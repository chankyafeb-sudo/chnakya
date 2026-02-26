# 🧪 COMPLETE TESTING GUIDE - All 53 APIs

## 🚀 QUICK START

```bash
# 1. Extract & Setup
unzip CHANKYAA_COMPLETE_22FEB.zip
cd CHANKYAA-FINAL-COMPLETE
npm install

# 2. Configure .env
echo "MONGO_URI=mongodb+srv://chankya:akshansh@cluster0.bzvzhkm.mongodb.net/?appName=Cluster0" > .env
echo "PORT=8080" >> .env
echo "AES_SECRET=your_secret_key_here" >> .env
echo "CLOUDINARY_CLOUD_NAME=your_cloud_name" >> .env
echo "CLOUDINARY_API_KEY=your_api_key" >> .env
echo "CLOUDINARY_API_SECRET=your_api_secret" >> .env

# 3. Seed Database
node seed.js

# 4. Start Server
node app.js
```

**Expected Output:**
```
✅ Connected to MongoDB
📌 Loading Student Auth Routes
📌 Loading Staff Auth Routes
📌 Loading Principal Auth Routes
✅ Server running on port 8080
```

---

## 🔑 LOGIN CREDENTIALS

### School 1: Bright Mind Public School (Indore)
| Role | Username | Password | School ID |
|------|----------|----------|-----------|
| 👨‍💼 Principal | `priya_sharma` | `akshansh` | (from seed output) |
| 👨‍🏫 Staff | `ramesh_kumar_s1` | `akshansh` | (auto) |
| 👨‍🎓 Student | `rahul_sharma_bright0` | `akshansh` | (auto) |

### School 2: Future Leaders Academy (Mumbai)
| Role | Username | Password | School ID |
|------|----------|----------|-----------|
| 👨‍💼 Principal | `arvind_desai` | `akshansh` | (from seed output) |
| 👨‍🏫 Staff | `ramesh_kumar_s2` | `akshansh` | (auto) |
| 👨‍🎓 Student | `rahul_sharma_future0` | `akshansh` | (auto) |

---

## 📊 API TESTING CHECKLIST

### ✅ AUTHENTICATION APIS (6)

#### 1. Student Login
```bash
POST http://localhost:8080/chankya/auth/student/login
Content-Type: application/json

{
  "username": "rahul_sharma_bright0",
  "password": "akshansh"
}
```
**Expected:** 200 OK + Token + Student Data  
**Save Token As:** `STUDENT_TOKEN`

#### 2. Staff Login
```bash
POST http://localhost:8080/chankya/auth/staff/login
Content-Type: application/json

{
  "username": "ramesh_kumar_s1",
  "password": "akshansh"
}
```
**Expected:** 200 OK + Token + Staff Data  
**Save Token As:** `STAFF_TOKEN`

#### 3. Principal Login
```bash
POST http://localhost:8080/admin/auth/login
Content-Type: application/json

{
  "username": "priya_sharma",
  "password": "akshansh"
}
```
**Expected:** 200 OK + Token + Principal Data  
**Save Token As:** `PRINCIPAL_TOKEN` + Save `school_id`

---

### ✅ PRINCIPAL APIS (10)

**Use:** `Authorization: Bearer {PRINCIPAL_TOKEN}`

#### 1. Dashboard Overview ⭐
```bash
GET http://localhost:8080/admin/dashboard/overview/{school_id}
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + 18 metrics (total_students, total_staff, etc.)

#### 2. All Classes
```bash
GET http://localhost:8080/admin/reports/classes/{school_id}
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + 10 classes with student counts

#### 3. Single Class Details
```bash
GET http://localhost:8080/admin/reports/class/{school_id}/10-A
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + Class details + Students list

#### 4. Attendance Report
```bash
GET http://localhost:8080/admin/reports/attendance/{school_id}?month=2&year=2026
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + Attendance statistics by class

#### 5. Financial Report
```bash
GET http://localhost:8080/admin/reports/financial/{school_id}?timeRange=monthly
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + Fee collection data

#### 6. All Students
```bash
GET http://localhost:8080/admin/students/all/{school_id}
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + 100 students

#### 7. Student Fees
```bash
GET http://localhost:8080/admin/fees/student/{student_id}
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + Fee details with payment records

#### 8. Fees Overview
```bash
GET http://localhost:8080/admin/fees/overview/{school_id}
Authorization: Bearer {PRINCIPAL_TOKEN}
```
**Expected:** 200 OK + Total fees, collected, pending

---

### ✅ STAFF APIS (20)

**Use:** `Authorization: Bearer {STAFF_TOKEN}`

#### ASSIGNMENTS (5)

1. **Get All Assignments**
```bash
GET http://localhost:8080/chankya/assignment/staff/{staff_id}
Authorization: Bearer {STAFF_TOKEN}
```

2. **Create Assignment**
```bash
POST http://localhost:8080/chankya/assignment/staff/{class_id}
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "title": "Math Homework",
  "description": "Complete chapter 5",
  "subject": "Mathematics",
  "dueDate": "2026-03-01",
  "max_marks": "100"
}
```

3. **Get Class Assignments**
```bash
GET http://localhost:8080/chankya/assignment/staff/class/{class_id}
Authorization: Bearer {STAFF_TOKEN}
```

4. **Get Single Assignment**
```bash
GET http://localhost:8080/chankya/assignment/staff/class/{assignment_id}
Authorization: Bearer {STAFF_TOKEN}
```

5. **Update Assignment**
```bash
PUT http://localhost:8080/chankya/assignment/staff/class/{assignment_id}
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### ATTENDANCE (3)

1. **Mark Attendance**
```bash
POST http://localhost:8080/chankya/attendance/staff/mark
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "student_id": "{student_id}",
  "class_id": "{class_id}",
  "school_id": "{school_id}",
  "date": "2026-02-22",
  "status": "present"
}
```

2. **Get Class Attendance**
```bash
GET http://localhost:8080/chankya/attendance/staff/class/{class_id}?date=2026-02-22
Authorization: Bearer {STAFF_TOKEN}
```

3. **Save Today's Attendance (BULK)** ⭐
```bash
POST http://localhost:8080/chankya/attendance/class/{teacher_id}/today
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "className": "10-A",
  "date": "2026-02-22",
  "students": [
    {
      "id": "{student_id_1}",
      "name": "Rahul Sharma",
      "rollnumber": "001",
      "status": "present"
    },
    {
      "id": "{student_id_2}",
      "name": "Priya Patel",
      "rollnumber": "002",
      "status": "absent"
    }
  ]
}
```

#### BOOKS (3)

1. **Get Books** ⭐
```bash
GET http://localhost:8080/chankya/books/class/{class_id}
Authorization: Bearer {STAFF_TOKEN}
```
**Note:** Accepts student_id OR class_id (auto-detects)

2. **Upload Book**
```bash
POST http://localhost:8080/chankya/books/staff/{class_id}
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "bookname": "Physics Class 10",
  "author": "Author Name",
  "isbn": "ISBN-123456",
  "total_copies": 50
}
```

3. **Return Book**
```bash
POST http://localhost:8080/chankya/books/staff/return
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "student_id": "{student_id}",
  "book_id": "{book_id}"
}
```

#### EVENTS (3)

1. **Get Events** ⭐
```bash
GET http://localhost:8080/chankya/events/student
Authorization: Bearer {STAFF_TOKEN}
```
**Note:** Works for all roles (student/staff/principal)

2. **Create Event**
```bash
POST http://localhost:8080/chankya/events/staff/{school_id}
Authorization: Bearer {STAFF_TOKEN}
Content-Type: multipart/form-data

title: Annual Day
description: School annual function
date: 2026-03-15
location: School Auditorium
image: [file]
```

3. **Update Event**
```bash
PUT http://localhost:8080/chankya/events/staff/{event_id}
Authorization: Bearer {STAFF_TOKEN}
Content-Type: application/json

{
  "title": "Updated Title"
}
```

---

### ✅ STUDENT APIS (17)

**Use:** `Authorization: Bearer {STUDENT_TOKEN}`

#### 1. Get Profile
```bash
GET http://localhost:8080/chankya/student/profile
Authorization: Bearer {STUDENT_TOKEN}
```

#### 2. Get School Info ⭐
```bash
GET http://localhost:8080/chankya/aboutschool/student
Authorization: Bearer {STUDENT_TOKEN}
```
**Note:** Also works with staff token

#### 3. Get Attendance
```bash
GET http://localhost:8080/chankya/attendance/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 4. Get Assignments
```bash
GET http://localhost:8080/chankya/assignment/student/{student_id}
Authorization: Bearer {STUDENT_TOKEN}
```

#### 5. Submit Assignment
```bash
POST http://localhost:8080/chankya/assignment/student/{assignment_id}/submit
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "submission_link": "https://drive.google.com/...",
  "notes": "Completed assignment"
}
```

#### 6. Get Books ⭐
```bash
GET http://localhost:8080/chankya/books/class/{student_id}
Authorization: Bearer {STUDENT_TOKEN}
```
**Note:** Auto-detects if ID is student_id or class_id

#### 7. Request Book
```bash
POST http://localhost:8080/chankya/books/student/request
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "book_id": "{book_id}",
  "student_id": "{student_id}"
}
```

#### 8. Get Timetable
```bash
GET http://localhost:8080/chankya/timetable/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 9. Get Events ⭐
```bash
GET http://localhost:8080/chankya/events/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 10. Get Fees
```bash
GET http://localhost:8080/chankya/fee/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 11. Get Notifications ⭐
```bash
GET http://localhost:8080/chankya/notification/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 12. Mark Notification Read
```bash
PUT http://localhost:8080/chankya/notification/student/{notification_id}/read
Authorization: Bearer {STUDENT_TOKEN}
```

#### 13. Get Classmates
```bash
GET http://localhost:8080/chankya/classmate/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 14. Get Staff List
```bash
GET http://localhost:8080/chankya/staff/student
Authorization: Bearer {STUDENT_TOKEN}
```

#### 15. Get Certificates ⭐
```bash
GET http://localhost:8080/chankya/certificate/student
Authorization: Bearer {STUDENT_TOKEN}
```
**Note:** Returns empty array if no certificates (not 404)

#### 16. Submit Feedback
```bash
POST http://localhost:8080/chankya/feedback/student/submit
Authorization: Bearer {STUDENT_TOKEN}
Content-Type: application/json

{
  "title": "Great teaching",
  "description": "Very helpful teacher",
  "rating": 5,
  "staff_id": "{staff_id}"
}
```

#### 17. Get Feedback
```bash
GET http://localhost:8080/chankya/feedback/student
Authorization: Bearer {STUDENT_TOKEN}
```

---

## ✅ VERIFICATION CHECKLIST

### Before Starting
- [ ] MongoDB connection string in .env
- [ ] Cloudinary credentials configured
- [ ] node_modules installed
- [ ] Database seeded
- [ ] Server starts without errors

### Authentication
- [ ] Student login → Token received
- [ ] Staff login → Token received
- [ ] Principal login → Token + school_id received
- [ ] Invalid credentials → 401 error

### Principal APIs (All 10)
- [ ] Dashboard overview → 18 metrics
- [ ] Class reports → 10 classes
- [ ] Single class → Student list
- [ ] Attendance report → Statistics
- [ ] Financial report → Fee data
- [ ] All students → 100 students
- [ ] Student fees → Payment records
- [ ] Fees overview → Totals

### Staff APIs (All 20)
- [ ] Create assignment → Success
- [ ] Get assignments → List returned
- [ ] Mark attendance → Saved
- [ ] Bulk attendance → All saved
- [ ] Get books → List returned
- [ ] Create event → Success
- [ ] Upload certificate → Success
- [ ] Submit feedback response → Success

### Student APIs (All 17)
- [ ] Get profile → Student data
- [ ] Get school info → School data
- [ ] Get attendance → Records
- [ ] Get assignments → Pending + Submitted
- [ ] Submit assignment → Status updated
- [ ] Get books → Auto-detection works
- [ ] Get timetable → 6 periods
- [ ] Get events → All events
- [ ] Get notifications → Full data
- [ ] Get certificates → Empty array if none
- [ ] Get classmates → List
- [ ] Submit feedback → Success

---

## 🐛 TROUBLESHOOTING

### Server won't start
```bash
# Check MongoDB connection
mongo "mongodb+srv://chankya:akshansh@cluster0.bzvzhkm.mongodb.net/"

# Check port availability
netstat -ano | findstr :8080

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 401 Errors
```bash
# Check token format
Authorization: Bearer {token}

# Re-login to get fresh token
POST /chankya/auth/student/login
```

### 404 Errors
```bash
# Verify endpoint URL
# Check if database is seeded
node seed.js

# Check route registration
# Look for route in console output
```

---

## 📝 SEED DATA SUMMARY

**Per School:**
- Staff: 10 (1 principal + 9 teachers)
- Classes: 10 (6-A to 10-B)
- Students: 100 (10 per class)
- Attendance: 3,000 records (30 days × 100 students)
- Assignments: 30 (3 per class)
- Events: 5
- Books: 20
- Timetables: 360 (6 days × 6 periods × 10 classes)
- Notifications: 10
- Feedback: 20
- Certificates: ~33 students (embedded, every 3rd student)

**Total Records:** 6,600+ across 2 schools

---

## 🎯 SUCCESS CRITERIA

✅ All 6 auth endpoints working  
✅ All 10 principal endpoints returning data  
✅ All 20 staff endpoints functional  
✅ All 17 student endpoints working  
✅ Console logs on every request  
✅ Proper error handling  
✅ Token-based authentication  
✅ Rate limiting active  

**ALL APIS WORKING = PRODUCTION READY! 🎉**
