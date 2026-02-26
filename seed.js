// seed.js - COMPLETE VERSION with attendance refs + certificates in student
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chankya:akshansh@cluster0.bzvzhkm.mongodb.net/?appName=Cluster0';
console.log('🔗 Using MONGO_URI:', MONGO_URI);

const Student    = require('./models/student');
const Staff      = require('./models/staff');
const School     = require('./models/school');
const Notification = require('./models/notification');
const Feedback   = require('./models/feedback');
const Event      = require('./models/event');
const ClassModel = require('./models/class');
const Book       = require('./models/book');
const Attendance = require('./models/attendance');
const Timetable  = require('./models/timetable');
const Assignment = require('./models/assignment');

async function hashPassword(p) { return bcrypt.hash(p, SALT_ROUNDS); }

async function clearCollections() {
  console.log('🗑️  Clearing collections...');
  await Promise.all([Student, Staff, School, Notification, Feedback, Event, ClassModel, Book, Attendance, Timetable, Assignment].map(m => m.deleteMany({})));
  console.log('✅ Collections cleared\n');
}

const firstNames = {
  male:   ['Rahul','Amit','Rohan','Arjun','Vikram','Aditya','Karan','Nikhil','Varun','Sanjay','Rajesh','Suresh','Manish','Deepak','Ajay','Rakesh','Ankit','Mohit','Naveen','Pankaj','Ravi','Sachin','Vishal','Yash','Ashok','Gopal','Hari','Jatin','Kunal','Lalit','Mukesh','Neeraj','Omkar','Prakash','Ramesh','Sumit','Tarun','Uday','Vinod','Wasim','Akash','Bhuvan','Chirag','Dinesh','Farhan','Gaurav','Hitesh','Irfan','Jay'],
  female: ['Priya','Sneha','Ananya','Riya','Neha','Pooja','Anjali','Kavya','Simran','Divya','Ishita','Shreya','Aditi','Megha','Preeti','Shweta','Tanvi','Vani','Pallavi','Ritu','Sonal','Uma','Vidya','Zoya','Aarti','Bhavna','Chitra','Deepa','Ekta','Geeta','Hema','Isha','Jaya','Kiran','Lata','Mala','Nisha','Payal','Rachna','Sangeeta','Tara','Usha','Vandana','Babita','Chhaya','Dipti','Farida','Garima','Heena']
};

const lastNames = ['Sharma','Kumar','Patel','Singh','Verma','Gupta','Reddy','Iyer','Joshi','Mehta','Kapoor','Malhotra','Chopra','Agarwal','Bansal','Arora','Bhatia','Saxena','Mishra','Pandey','Rao','Nair','Menon','Shah','Desai','Jain','Sinha','Ghosh','Dutta','Chatterjee','Mukherjee','Roy','Das','Bose','Sen','Bhattacharya','Chakraborty','Banerjee','Khan','Ali'];
const subjects  = ['Mathematics','Science','English','Hindi','Social Studies','Computer Science','Physics','Chemistry','Biology','History','Geography','Economics'];

const cities = {
  school1: { city: 'Indore', state: 'MP', pincode: '452001' },
  school2: { city: 'Mumbai', state: 'MH', pincode: '400001' }
};

const certTitles  = ['Best Student Award','Academic Excellence Certificate','Sports Achievement Award','Science Olympiad Winner','Cultural Fest Participant','Leadership Award','Perfect Attendance Award','Mathematics Competition Winner'];
const certAwardedBy = ['School Principal','District Education Board','State Sports Authority','National Science Foundation','Cultural Committee','School Management Committee'];

async function createSchool(schoolData, schoolNumber) {
  const commonHash = await hashPassword('akshansh');
  const location   = schoolNumber === 1 ? cities.school1 : cities.school2;
  const shortName  = schoolData.name.split(' ')[0].toLowerCase();

  console.log(`\n🏫 Creating School ${schoolNumber}: ${schoolData.name}...`);

  // ── STAFF ───────────────────────────────────────────────────────────
  const teacherDefs = [
    { name:'Ramesh Kumar',  gender:'Male',   subject:'Mathematics'     },
    { name:'Sunita Verma',  gender:'Female', subject:'Science'         },
    { name:'Anjali Singh',  gender:'Female', subject:'English'         },
    { name:'Vikram Sharma', gender:'Male',   subject:'Hindi'           },
    { name:'Pooja Gupta',   gender:'Female', subject:'Social Studies'  },
    { name:'Rajesh Patel',  gender:'Male',   subject:'Computer Science'},
    { name:'Meera Reddy',   gender:'Female', subject:'Physics'         },
    { name:'Arun Desai',    gender:'Male',   subject:'Chemistry'       },
    { name:'Kavita Joshi',  gender:'Female', subject:'Biology'         }
  ];

  const staffDocs = [];
  staffDocs.push({
    name: schoolData.principalName, username: schoolData.principalUsername,
    password: commonHash, school_id: null,
    photo: `https://randomuser.me/api/portraits/${schoolData.principalGender === 'Male' ? 'men' : 'women'}/1.jpg`,
    gender: schoolData.principalGender, experience: '15 years',
    mobile: `+91-${8000000000 + schoolNumber}`,
    email: `${schoolData.principalUsername}@${shortName}.edu`,
    about: 'Principal with expertise in educational leadership',
    address: `${100 * schoolNumber} MG Road, ${location.city}, ${location.state}`,
    dob: new Date(1980, 4, 15), subject: 'Administration',
    achievements: [`Best Principal Award ${2020 + schoolNumber}`],
    extraCurricular: 'Educational Leadership'
  });

  teacherDefs.forEach((t, idx) => {
    const uname = `${t.name.split(' ')[0].toLowerCase()}_${t.name.split(' ')[1].toLowerCase()}_s${schoolNumber}`;
    staffDocs.push({
      name: t.name, username: uname, password: commonHash, school_id: null,
      photo: `https://randomuser.me/api/portraits/${t.gender === 'Male' ? 'men' : 'women'}/${idx + 2}.jpg`,
      gender: t.gender, experience: `${5 + idx} years`,
      mobile: `+91-${8100000000 + schoolNumber * 100 + idx}`,
      email: `${uname}@${shortName}.edu`,
      about: `${t.subject} teacher with passion for teaching`,
      address: `${200 + idx * 10} AB Road, ${location.city}, ${location.state}`,
      dob: new Date(1985 + idx, (idx * 2) % 12, 10), subject: t.subject,
      achievements: [`Best ${t.subject} Teacher ${2020 + idx % 3}`],
      extraCurricular: `${t.subject} Club`
    });
  });

  const staff = await Staff.insertMany(staffDocs);

  // ── SCHOOL ──────────────────────────────────────────────────────────
  const school = await School.create({
    name: schoolData.name, school_image: schoolData.image,
    mission_statement: schoolData.mission,
    principal: {
      name: staff[0].name, username: staff[0].username,
      passwordHash: staff[0].password, email: staff[0].email,
      phone: staff[0].mobile, image_url: staff[0].photo,
      bio: staff[0].about, address: staff[0].address,
      gender: staff[0].gender, dob: staff[0].dob, isActive: true
    },
    contact_info: {
      address: `${100 * schoolNumber} Education Lane, ${location.city}, ${location.state}, ${location.pincode}`,
      phone: `+91-${schoolNumber === 1 ? '731' : '22'}-1234567`,
      email: `info@${shortName}.edu`
    },
    staff: staff.map(s => s._id)
  });

  await Staff.updateMany({ _id: { $in: staff.map(s => s._id) } }, { school_id: school._id });

  // ── CLASSES ─────────────────────────────────────────────────────────
  const classNames = ['6-A','6-B','7-A','7-B','8-A','8-B','9-A','9-B','10-A','10-B'];
  const createdClasses = await ClassModel.insertMany(
    classNames.map((cn, i) => ({
      class_name: cn, year: 2025, school_id: school._id,
      class_teacher: staff[1 + (i % 9)]._id, students: []
    }))
  );

  // ── STUDENTS (without attendance array yet) ──────────────────────────
  console.log(`   👨‍🎓 Creating students...`);
  const modes = ['UPI','Cash','Bank Transfer','Cheque'];
  const feeScenarios = [
    t => ({ paid: t,                    pending: 0                    }),
    t => ({ paid: Math.floor(t * 0.7),  pending: Math.ceil(t * 0.3)  }),
    t => ({ paid: Math.floor(t * 0.5),  pending: Math.ceil(t * 0.5)  }),
    t => ({ paid: 0,                    pending: t                    })
  ];

  const studentDocs = [];

  for (let ci = 0; ci < createdClasses.length; ci++) {
    const cls = createdClasses[ci];
    for (let si = 0; si < 10; si++) {
      const gi      = ci * 10 + si;
      const isMale  = si % 2 === 0;
      const gKey    = isMale ? 'male' : 'female';
      const fname   = firstNames[gKey][gi % firstNames[gKey].length];
      const lname   = lastNames[gi % lastNames.length];
      const name    = `${fname} ${lname}`;
      const uname   = `${fname.toLowerCase()}_${lname.toLowerCase()}_${shortName}${gi}`;

      const totalFees = 50000 + (gi % 5) * 10000;
      const scenario  = feeScenarios[gi % 4](totalFees);
      const payRecs   = [];

      if (scenario.paid > 0) {
        const numP = (gi % 3) + 1;
        let rem = scenario.paid;
        for (let pi = 0; pi < numP && rem > 0; pi++) {
          const amt = pi === numP - 1 ? rem : Math.floor(rem / (numP - pi));
          rem -= amt;
          payRecs.push({
            amount_paid: amt,
            payment_date: new Date(2024, 5 + pi * 2, 10 + (gi % 15)),
            mode_of_payment: modes[(gi + pi) % modes.length],
            payment_proof: '',
            uploaded_by: staff[1 + (ci % 9)]._id,
            uploaded_by_name: staff[1 + (ci % 9)].name
          });
        }
      }

      // ✅ Certificates for every 3rd student
      const certs = [];
      if (gi % 3 === 0) {
        const numCerts = (gi % 2) + 1;
        for (let cerI = 0; cerI < numCerts; cerI++) {
          certs.push({
            certificate_image: `https://picsum.photos/400/300?random=${gi * 10 + cerI}`,
            issue_date: new Date(2024, cerI * 3, 15 + cerI),
            title: certTitles[(gi + cerI) % certTitles.length],
            awarded_by: certAwardedBy[(gi + cerI) % certAwardedBy.length],
            uploaded_by: staff[1 + (ci % 9)]._id,
            uploaded_by_name: staff[1 + (ci % 9)].name,
            uploaded_at: new Date(2024, cerI * 3, 16)
          });
        }
      }

      studentDocs.push({
        name, username: uname, password: commonHash,
        rollnumber: String(gi + 1).padStart(3, '0'),
        photo: `https://randomuser.me/api/portraits/${isMale ? 'men' : 'women'}/${(gi % 70) + 1}.jpg`,
        batch: '2024-25', class_id: cls._id, school_id: school._id,
        gender: isMale ? 'Male' : 'Female',
        mobile: `+91-${9000000000 + schoolNumber * 10000 + gi}`,
        email: `${uname}@${shortName}.edu`,
        father_name: `${firstNames.male[(gi + 10) % firstNames.male.length]} ${lname}`,
        mother_name: `${firstNames.female[(gi + 10) % firstNames.female.length]} ${lname}`,
        dob: new Date(2009, gi % 12, (gi % 28) + 1),
        address: `${100 + gi} ${['Green Park','Civil Lines','MG Road','AB Road','Vijay Nagar'][gi % 5]}, ${location.city}, ${location.state} - ${location.pincode}`,
        created_by: staff[1 + (ci % 9)]._id,
        created_by_name: staff[1 + (ci % 9)].name,
        fee: {
          total_amount: totalFees, paid_amount: scenario.paid, pending_amount: scenario.pending,
          due_date: new Date(2025, 3, 30),
          uploaded_by: staff[1 + (ci % 9)]._id,
          uploaded_by_name: staff[1 + (ci % 9)].name,
          payment_records: payRecs
        },
        certificates: certs,   // ✅ EMBEDDED CERTIFICATES
        attendance: [],         // will be filled below
        assignments: [],        // will be filled below
        isBlocked: false, failedLoginAttempts: 0
      });
    }
  }

  const students = await Student.insertMany(studentDocs);

  // Update class.students
  for (let ci = 0; ci < createdClasses.length; ci++) {
    await ClassModel.findByIdAndUpdate(createdClasses[ci]._id, {
      students: students.slice(ci * 10, ci * 10 + 10).map(s => s._id)
    });
  }

  // ── ATTENDANCE (create + link to student) ──────────────────────────
  console.log(`   📅 Creating attendance records (30 days)...`);
  const attendanceDocs = [];

  for (let day = 0; day < 30; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);

    for (const s of students) {
      attendanceDocs.push({
        student_id: s._id,
        class_id:   s.class_id,
        school_id:  school._id,
        date,
        status: Math.random() > 0.15 ? 'present' : 'absent',
        notes: ''
      });
    }
  }

  const createdAttendance = await Attendance.insertMany(attendanceDocs);

  // ✅ Link attendance ObjectIds into student.attendance[]
  console.log(`   🔗 Linking attendance refs into each student...`);
  const attByStudent = {};
  createdAttendance.forEach(a => {
    const k = a.student_id.toString();
    if (!attByStudent[k]) attByStudent[k] = [];
    attByStudent[k].push(a._id);
  });

  await Promise.all(students.map(s =>
    Student.findByIdAndUpdate(s._id, { attendance: attByStudent[s._id.toString()] || [] })
  ));

  // ── ASSIGNMENTS (create + link to student) ─────────────────────────
  console.log(`   📝 Creating assignments...`);
  const assignmentDocs = [];
  const assignSubjects = ['Mathematics','Science','English'];

  for (const cls of createdClasses) {
    for (let i = 0; i < 3; i++) {
      const due = new Date();
      due.setDate(due.getDate() + 7 + i * 7);
      assignmentDocs.push({
        title: `${assignSubjects[i]} Assignment ${i + 1}`,
        description: `Complete exercises from chapter ${i + 1}`,
        subject: assignSubjects[i],
        difficulty: ['Easy','Medium','Hard'][i],
        max_marks: '100',
        class_id: cls._id, school_id: school._id,
        dueDate: due, submissions: []
      });
    }
  }

  const createdAssignments = await Assignment.insertMany(assignmentDocs);

  // ✅ Link assignment refs into student.assignments[]
  console.log(`   🔗 Linking assignment refs into each student...`);
  const assignByClass = {};
  createdAssignments.forEach(a => {
    const k = a.class_id.toString();
    if (!assignByClass[k]) assignByClass[k] = [];
    assignByClass[k].push(a._id);
  });

  await Promise.all(students.map(s => {
    const ids = assignByClass[s.class_id.toString()] || [];
    return Student.findByIdAndUpdate(s._id, {
      assignments: ids.map(id => ({ assignment_id: id, status: 'Pending' }))
    });
  }));

  // ── EVENTS ──────────────────────────────────────────────────────────
  console.log(`   🎉 Creating events...`);
  const eventNames     = ['Annual Day','Sports Day','Science Fair','Cultural Fest','Parent-Teacher Meeting'];
  const eventSchedules = [
    '9:00 AM - Registration, 10:00 AM - Performances, 2:00 PM - Prize Distribution',
    '8:00 AM - Opening, 9:00 AM - Track Events, 12:00 PM - Field Events, 4:00 PM - Closing',
    '10:00 AM - Inauguration, 11:00 AM - Exhibition, 3:00 PM - Award Ceremony',
    '9:30 AM - Welcome, 10:00 AM - Cultural Programs, 1:00 PM - Lunch, 3:00 PM - Closing',
    '10:00 AM - Meeting Start, 11:00 AM - Discussions, 1:00 PM - One-on-One Sessions'
  ];

  await Event.insertMany(eventNames.map((en, i) => {
    const d = new Date(); d.setDate(d.getDate() + 30 + i * 15);
    return {
      title: en, description: `Annual ${en} celebration - A wonderful event for students and parents`,
      date: d, location: `${school.name} Auditorium`,
      event_coordinator: staff[1 + (i % 9)].name,
      schedule: eventSchedules[i], chief_guest: `Chief Guest ${i + 1}`,
      tags: ['School Event', en.split(' ')[0]],
      school_id: school._id, created_by: staff[0]._id, created_by_name: staff[0].name,
      image: `https://images.unsplash.com/photo-${1580582932707 + i * 1000}`,
      image_public_id: `event_${schoolNumber}_${i}`,
      event_url: `https://${shortName}.edu/events/${i + 1}`
    };
  }));

  // ── BOOKS ───────────────────────────────────────────────────────────
  console.log(`   📚 Creating library books...`);
  const bookTitles = [
    'Mathematics Class 10','Science Class 10','English Literature','Hindi Textbook','Social Studies',
    'Computer Science Basics','Physics Fundamentals','Chemistry Essentials','Biology Guide','World History',
    'Indian Geography','Economics Theory','Advanced Mathematics','Environmental Science','English Grammar',
    'Sanskrit Primer','Political Science','Business Studies','Accountancy','Physical Education'
  ];

  await Book.insertMany(bookTitles.map((bt, i) => ({
    bookname: bt, title: bt, author: `Author ${i + 1}`,
    isbn: `ISBN-${schoolNumber}${String(1000000000 + i).slice(1)}`,
    publisher: `Publisher ${(i % 5) + 1}`,
    category: subjects[i % subjects.length],
    class_id: createdClasses[i % 10]._id, school_id: school._id,
    total_copies: 10 + (i % 5) * 5, available_copies: 10 + (i % 5) * 5,
    image: `https://picsum.photos/200/300?random=${i + schoolNumber * 100}`,
    description: `Complete guide for ${bt}`, language: 'English', pages: 200 + i * 10
  })));

  // ── TIMETABLE ───────────────────────────────────────────────────────
  console.log(`   ⏰ Creating timetables...`);
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const timetableDocs = [];
  const base = new Date(); base.setHours(0, 0, 0, 0);

  for (const cls of createdClasses) {
    for (let di = 0; di < days.length; di++) {
      for (let pi = 0; pi < 6; pi++) {
        const st = new Date(base);
        st.setHours(9 + Math.floor(pi * 0.75), (pi % 4) * 15, 0, 0);
        const et = new Date(st); et.setMinutes(et.getMinutes() + 45);
        timetableDocs.push({
          class_id: cls._id, school_id: school._id, day: days[di],
          subject: subjects[pi % subjects.length], teacher: staff[1 + (pi % 9)].name,
          start_time: st, end_time: et, room_number: `Room ${101 + pi}`,
          effective_from: new Date(2024, 5, 1)
        });
      }
    }
  }
  await Timetable.insertMany(timetableDocs);

  // ── NOTIFICATIONS ───────────────────────────────────────────────────
  console.log(`   🔔 Creating notifications...`);
  const notifMessages = [
    'Exam schedule released','Holiday notice - Diwali','Parent-teacher meeting scheduled',
    'Fee payment reminder','Sports day registration open','Library books return reminder',
    'Annual day preparations','Mid-term results published','Homework submission deadline','School timing change notice'
  ];

  await Notification.insertMany(notifMessages.map((msg, i) => ({
    title: msg, message: `Details about ${msg}. Please take note and act accordingly.`,
    type: ['Announcement','Alert','Reminder'][i % 3],
    recipients: students.slice(0, 10).map(s => s._id),
    created_by: staff[0]._id, school_id: school._id,
    created_at: new Date(Date.now() - i * 86400000)
  })));

  // ── FEEDBACK ────────────────────────────────────────────────────────
  console.log(`   💬 Creating feedback...`);
  const fbComments = [
    'Great teaching methods','Need more practical sessions','Excellent infrastructure',
    'Library needs more books','Good sports facilities','Canteen food quality improvement needed',
    'Teachers are very helpful','Need better computer lab','Appreciate the extra classes','School bus service is good'
  ];

  await Feedback.insertMany([...Array(20)].map((_, i) => ({
    student: students[i]._id, staff: staff[1 + (i % 9)]._id,
    title: fbComments[i % 10],
    description: `Detailed feedback: ${fbComments[i % 10]}. This is an important observation.`,
    rating: 3 + (i % 3), school_id: school._id,
    created_at: new Date(Date.now() - i * 172800000)
  })));

  console.log(`\n✅ School ${schoolNumber} DONE: ${school.name}`);
  console.log(`   Staff: ${staff.length} | Classes: ${createdClasses.length} | Students: ${students.length}`);
  console.log(`   Attendance: ${createdAttendance.length} records → linked into student.attendance[] ✅`);
  console.log(`   Assignments: ${createdAssignments.length} → linked into student.assignments[] ✅`);
  console.log(`   Certificates: embedded in every 3rd student ✅`);
  console.log(`   School ID: ${school._id}`);

  return { school, staff, students, classes: createdClasses };
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    await clearCollections();

    const r1 = await createSchool({
      name: 'Bright Mind Public School',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
      mission: 'To nurture young minds with values and skills for tomorrow',
      principalName: 'Dr. Priya Sharma', principalUsername: 'priya_sharma', principalGender: 'Female'
    }, 1);

    const r2 = await createSchool({
      name: 'Future Leaders Academy',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585',
      mission: 'Empowering future leaders through innovation and excellence',
      principalName: 'Dr. Arvind Desai', principalUsername: 'arvind_desai', principalGender: 'Male'
    }, 2);

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SEED COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log('🏫 SCHOOL 1: Bright Mind Public School (Indore)');
    console.log(`   School ID : ${r1.school._id}`);
    console.log('   Principal : priya_sharma / akshansh');
    console.log('   Staff     : ramesh_kumar_s1 / akshansh');
    console.log('   Student   : rahul_sharma_bright0 / akshansh');
    console.log('\n🏫 SCHOOL 2: Future Leaders Academy (Mumbai)');
    console.log(`   School ID : ${r2.school._id}`);
    console.log('   Principal : arvind_desai / akshansh');
    console.log('   Staff     : ramesh_kumar_s2 / akshansh');
    console.log('   Student   : rahul_sharma_future0 / akshansh');
    console.log('\n📊 PER SCHOOL: Staff:10 | Classes:10 | Students:100 | Attendance:3000 | Assignments:30 | Events:5 | Books:20 | Timetables:360 | Notifications:10 | Feedback:20');
    console.log('='.repeat(70) + '\n');

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seed error:', err);
    mongoose.connection.close();
    process.exit(1);
  }
}

main();
