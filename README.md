# 🎓 SCHOOL MANAGEMENT SYSTEM - COMPLETE API DOCUMENTATION

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Authentication APIs](#authentication-apis)
3. [Principal APIs](#principal-apis)
4. [Staff APIs](#staff-apis)
5. [Student APIs](#student-apis)
6. [Common APIs](#common-apis)
7. [Database Schema](#database-schema)
8. [Testing Guide](#testing-guide)

---

## 🚀 Quick Start

### Installation
```bash
# Install dependencies
npm install

# Configure environment
# Edit .env file with your MongoDB URI
MONGO_URI=mongodb://localhost:27017/school_db
PORT=8080
AES_SECRET=your_secret_key_minimum_32_chars_long

# Seed database (creates 2 schools)
node seed.js

# Start server
node app.js
```

### Server Info
- **Base URL:** `http://localhost:8080`
- **API Prefix (Student/Staff):** `/chankya`
- **API Prefix (Principal):** `/admin`

---

## 🔐 AUTHENTICATION APIS

### 1. Student Login
**Endpoint:** `POST /chankya/auth/student/login`

**Request:**
```json
{
  "username": "rahul_sharma_bright0",
  "password": "akshansh"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "encrypted_jwt_token",
  "student_id": "65f...",
  "studentData": {
    "_id": "65f...",
    "name": "Rahul Sharma",
    "username": "rahul_sharma_bright0",
    "email": "rahul_sharma_bright0@bright.edu",
    "rollnumber": "001",
    "class_id": "65f...",
    "school_id": "65f...",
    "batch": "2024-25",
    "photo": "https://..."
  }
}
```

---

### 2. Staff Login
**Endpoint:** `POST /chankya/auth/staff/login`

**Request:**
```json
{
  "username": "ramesh_kumar_s1",
  "password": "akshansh"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "encrypted_jwt_token",
  "staff_id": "65f...",
  "staffData": {
    "_id": "65f...",
    "name": "Ramesh Kumar",
    "username": "ramesh_kumar_s1",
    "email": "ramesh_kumar_s1@bright.edu",
    "subject": "Mathematics",
    "school_id": "65f...",
    "school_name": "Bright Mind Public School"
  }
}
```

---

### 3. Principal Login
**Endpoint:** `POST /admin/auth/login`

**Request:**
```json
{
  "username": "priya_sharma",
  "password": "akshansh"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "encrypted_jwt_token",
  "school_id": "65f...",
  "principalData": {
    "name": "Dr. Priya Sharma",
    "username": "priya_sharma",
    "email": "priya_sharma@bright.edu",
    "school_id": "65f...",
    "school_name": "Bright Mind Public School"
  }
}
```

---

### 4. Logout (All Roles)
**Endpoints:**
- Student: `POST /chankya/auth/student/logout`
- Staff: `POST /chankya/auth/staff/logout`
- Principal: `POST /admin/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 👨‍💼 PRINCIPAL APIS

All Principal APIs require: `Authorization: Bearer <principal_token>`

### 1. Dashboard
**GET** `/admin/:school_id/dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 100,
    "totalStaff": 10,
    "totalClasses": 10,
    "presentToday": 85,
    "absentToday": 15,
    "pendingFees": 150000
  }
}
```

### 2. Get All Students
**GET** `/admin/:school_id/students`

**Query Params:**
- `class_id` (optional)
- `page` (default: 1)
- `limit` (default: 20)

**Response:**
```json
{
  "success": true,
  "students": [...],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

### 3. Get All Staff
**GET** `/admin/:school_id/staff`

### 4. Get All Classes
**GET** `/admin/:school_id/classes`

### 5. Get Attendance Report
**GET** `/admin/:school_id/attendance?date=2025-02-12&class_id=65f...`

### 6. Get Fee Report
**GET** `/admin/:school_id/fees?status=pending`

### 7. Get Events
**GET** `/admin/:school_id/events`

### 8. Get Notifications
**GET** `/admin/:school_id/notifications`

### 9. Get Feedback
**GET** `/admin/:school_id/feedback`

---

## 👨‍🏫 STAFF APIS

All Staff APIs require: `Authorization: Bearer <staff_token>`

### Assignment Management

#### 1. Get Assigned Classes
**GET** `/chankya/assignment/staff/:staffid`

**Response:**
```json
{
  "success": true,
  "classes": [
    {
      "_id": "65f...",
      "class_name": "10-A",
      "students_count": 10
    }
  ]
}
```

#### 2. Create Assignment
**POST** `/chankya/assignment/staff/:classid`

**Headers:** `Content-Type: multipart/form-data`

**Form Data:**
- `title`: Assignment title
- `description`: Description
- `subject`: Subject name
- `dueDate`: Due date (YYYY-MM-DD)
- `max_marks`: Maximum marks
- `resources[]`: Files (PDFs, images) - optional
- `cover_image`: Cover image - optional

**Response:**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "assignment_id": "65f..."
}
```

#### 3. Get Assignments by Class
**GET** `/chankya/assignment/staff/class/:classid`

**Response:**
```json
{
  "success": true,
  "assignments": [
    {
      "_id": "65f...",
      "title": "Mathematics Assignment 1",
      "subject": "Mathematics",
      "dueDate": "2025-02-20",
      "submissions_count": 5,
      "total_students": 10
    }
  ]
}
```

#### 4. Get Assignment Details
**GET** `/chankya/assignment/staff/class/:assignmentid`

**Response:**
```json
{
  "success": true,
  "assignment": {
    "title": "Mathematics Assignment 1",
    "description": "Complete chapter 1",
    "dueDate": "2025-02-20",
    "submissions": [
      {
        "student_name": "Rahul Sharma",
        "status": "Submitted",
        "submission_date": "2025-02-15"
      }
    ]
  }
}
```

#### 5. Update Assignment Submission
**PUT** `/chankya/assignment/staff/class/:assignmentid`

**Form Data:**
- `student_id`: Student ID
- `obtained_grade`: Grade/marks
- `feedback`: Feedback text
- `submission_files[]`: Student submission files

---

### Attendance Management

#### 6. Mark Attendance
**POST** `/chankya/attendance/staff/mark`

**Request:**
```json
{
  "class_id": "65f...",
  "date": "2025-02-12",
  "attendance": [
    {
      "student_id": "65f...",
      "status": "present"
    },
    {
      "student_id": "65f...",
      "status": "absent"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "marked_count": 10
}
```

#### 7. Get Attendance by Class
**GET** `/chankya/attendance/staff/class/:classid?date=2025-02-12`

**Response:**
```json
{
  "success": true,
  "attendance": [
    {
      "student_name": "Rahul Sharma",
      "rollnumber": "001",
      "status": "present"
    }
  ],
  "summary": {
    "total": 10,
    "present": 8,
    "absent": 2
  }
}
```

---

### Book Management

#### 8. Get All Books
**GET** `/chankya/books/staff`

**Response:**
```json
{
  "success": true,
  "books": [
    {
      "_id": "65f...",
      "bookname": "Mathematics Class 10",
      "author": "Author 1",
      "isbn": "ISBN-1000000000",
      "total_copies": 10,
      "available_copies": 7
    }
  ]
}
```

#### 9. Issue Book
**POST** `/chankya/books/staff/issue`

**Request:**
```json
{
  "book_id": "65f...",
  "student_id": "65f...",
  "issue_date": "2025-02-12",
  "return_date": "2025-03-12"
}
```

#### 10. Return Book
**POST** `/chankya/books/staff/return`

**Request:**
```json
{
  "book_id": "65f...",
  "student_id": "65f..."
}
```

---

### Event Management

#### 11. Create Event
**POST** `/chankya/events/staff/create`

**Form Data:**
- `title`: Event title
- `description`: Description
- `date`: Event date
- `location`: Venue
- `event_coordinator`: Coordinator name
- `schedule`: Event schedule
- `image`: Event image - optional

#### 12. Get All Events
**GET** `/chankya/events/staff`

#### 13. Update Event
**PUT** `/chankya/events/staff/:eventid`

---

### Fee Management

#### 14. Add Fee Payment
**POST** `/chankya/fee/staff/payment`

**Request:**
```json
{
  "student_id": "65f...",
  "amount_paid": 5000,
  "payment_date": "2025-02-12",
  "mode_of_payment": "UPI",
  "payment_proof": "receipt_url"
}
```

#### 15. Get Fee Details by Student
**GET** `/chankya/fee/staff/student/:studentid`

---

### Certificate Management

#### 16. Upload Certificate
**POST** `/chankya/certificate/staff/upload`

**Form Data:**
- `student_id`: Student ID
- `certificate_image`: Certificate file
- `title`: Certificate title
- `issue_date`: Issue date
- `awarded_by`: Organization name

#### 17. Get Certificates by Student
**GET** `/chankya/certificate/staff/student/:studentid`

---

### Feedback Management

#### 18. View Feedback
**GET** `/chankya/feedback/staff`

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "student_name": "Rahul Sharma",
      "title": "Great teaching",
      "description": "Excellent explanation",
      "rating": 5,
      "created_at": "2025-02-10"
    }
  ]
}
```

#### 19. Respond to Feedback
**PUT** `/chankya/feedback/staff/:feedbackid/respond`

**Request:**
```json
{
  "response": "Thank you for your feedback"
}
```

---

## 👨‍🎓 STUDENT APIS

All Student APIs require: `Authorization: Bearer <student_token>`

### Profile & School Info

#### 1. Get Profile
**GET** `/chankya/student/profile`

**Response:**
```json
{
  "success": true,
  "student": {
    "name": "Rahul Sharma",
    "rollnumber": "001",
    "class_name": "10-A",
    "father_name": "Amit Sharma",
    "mother_name": "Priya Sharma",
    "dob": "2009-05-15",
    "address": "100 Green Park, Indore, MP",
    "email": "rahul_sharma_bright0@bright.edu",
    "mobile": "+91-9000000000"
  }
}
```

#### 2. Get School Info
**GET** `/chankya/aboutschool`

**Response:**
```json
{
  "success": true,
  "school": {
    "name": "Bright Mind Public School",
    "school_image": "https://...",
    "mission_statement": "To nurture young minds...",
    "contact_info": {
      "address": "100 Education Lane, Indore, MP",
      "phone": "+91-731-1234567",
      "email": "info@bright.edu"
    }
  }
}
```

---

### Attendance

#### 3. Get My Attendance
**GET** `/chankya/attendance/student?month=2025-02`

**Response:**
```json
{
  "success": true,
  "attendance": [
    {
      "date": "2025-02-12",
      "status": "present"
    },
    {
      "date": "2025-02-11",
      "status": "present"
    }
  ],
  "summary": {
    "total_days": 30,
    "present": 27,
    "absent": 3,
    "percentage": 90
  }
}
```

---

### Assignments

#### 4. Get My Assignments
**GET** `/chankya/assignment/student/:studentid?status=pending`

**Query Params:**
- `status`: pending | submitted | graded

**Response:**
```json
{
  "success": true,
  "assignments": [
    {
      "_id": "65f...",
      "title": "Mathematics Assignment 1",
      "subject": "Mathematics",
      "description": "Complete chapter 1",
      "dueDate": "2025-02-20",
      "status": "pending",
      "max_marks": "100"
    }
  ]
}
```

#### 5. Submit Assignment
**POST** `/chankya/assignment/student/:assignmentid/submit`

**Form Data:**
- `submission_files[]`: Assignment files
- `notes`: Optional submission notes

---

### Books

#### 6. Get Library Books
**GET** `/chankya/books/student`

**Response:**
```json
{
  "success": true,
  "books": [
    {
      "bookname": "Mathematics Class 10",
      "author": "Author 1",
      "isbn": "ISBN-1000000000",
      "category": "Mathematics",
      "available_copies": 7
    }
  ]
}
```

#### 7. Request Book Issue
**POST** `/chankya/books/student/request`

**Request:**
```json
{
  "book_id": "65f..."
}
```

---

### Timetable

#### 8. Get My Timetable
**GET** `/chankya/timetable/student`

**Response:**
```json
{
  "success": true,
  "timetable": {
    "Monday": [
      {
        "period": "09:00-09:45",
        "subject": "Mathematics",
        "teacher": "Ramesh Kumar",
        "room_number": "Room 101"
      }
    ],
    "Tuesday": [...],
    ...
  }
}
```

---

### Events

#### 9. Get Upcoming Events
**GET** `/chankya/events/student`

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "title": "Annual Day",
      "date": "2025-03-15",
      "location": "School Auditorium",
      "description": "Annual day celebration"
    }
  ]
}
```

---

### Fees

#### 10. Get My Fee Details
**GET** `/chankya/fee/student`

**Response:**
```json
{
  "success": true,
  "fee": {
    "total_amount": 50000,
    "paid_amount": 35000,
    "pending_amount": 15000,
    "payment_records": [
      {
        "amount_paid": 20000,
        "payment_date": "2024-06-10",
        "mode_of_payment": "UPI"
      },
      {
        "amount_paid": 15000,
        "payment_date": "2024-08-15",
        "mode_of_payment": "Cash"
      }
    ]
  }
}
```

---

### Notifications

#### 11. Get Notifications
**GET** `/chankya/notification/student`

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "title": "Exam schedule released",
      "message": "Mid-term exams will start from...",
      "type": "Announcement",
      "created_at": "2025-02-10"
    }
  ]
}
```

#### 12. Mark Notification as Read
**PUT** `/chankya/notification/student/:notificationid/read`

---

### Classmates

#### 13. Get Classmates
**GET** `/chankya/classmate/student`

**Response:**
```json
{
  "success": true,
  "classmates": [
    {
      "name": "Amit Patel",
      "rollnumber": "002",
      "photo": "https://...",
      "mobile": "+91-9000000002"
    }
  ]
}
```

---

### Staff Info

#### 14. Get Teachers List
**GET** `/chankya/staff/student`

**Response:**
```json
{
  "success": true,
  "teachers": [
    {
      "name": "Ramesh Kumar",
      "subject": "Mathematics",
      "photo": "https://...",
      "email": "ramesh_kumar_s1@bright.edu"
    }
  ]
}
```

---

### Certificates

#### 15. Get My Certificates
**GET** `/chankya/certificate/student`

**Response:**
```json
{
  "success": true,
  "certificates": [
    {
      "title": "Best Student Award",
      "certificate_image": "https://...",
      "issue_date": "2024-12-01",
      "awarded_by": "Bright Mind Public School"
    }
  ]
}
```

---

### Feedback

#### 16. Submit Feedback
**POST** `/chankya/feedback/student/submit`

**Request:**
```json
{
  "staff_id": "65f...",
  "title": "Great teaching",
  "description": "Very clear explanations",
  "rating": 5
}
```

#### 17. Get My Feedback History
**GET** `/chankya/feedback/student`

---

### Interactions

#### 18. Get Interactions
**GET** `/chankya/intraction/student`

#### 19. Create Interaction
**POST** `/chankya/intraction/student/create`

**Request:**
```json
{
  "title": "Question about homework",
  "message": "I have a doubt in question 5",
  "staff_id": "65f..."
}
```

---

## 📊 DATABASE SCHEMA

### Student
```javascript
{
  name: String,
  username: String (unique),
  password: String,
  rollnumber: String,
  class_id: ObjectId (ref: Class),
  school_id: ObjectId (ref: School),
  father_name: String,
  mother_name: String,
  dob: Date,
  address: String,
  email: String,
  mobile: String,
  photo: String,
  batch: String,
  fee: {
    total_amount: Number,
    paid_amount: Number,
    pending_amount: Number,
    payment_records: [{
      amount_paid: Number,
      payment_date: Date,
      mode_of_payment: String
    }]
  }
}
```

### Staff
```javascript
{
  name: String,
  username: String,
  password: String,
  school_id: ObjectId (ref: School),
  subject: String,
  email: String,
  mobile: String,
  experience: String,
  photo: String
}
```

### School
```javascript
{
  name: String,
  school_image: String,
  mission_statement: String,
  principal: {
    name: String,
    username: String,
    passwordHash: String,
    email: String,
    phone: String
  },
  contact_info: {
    address: String,
    phone: String,
    email: String
  }
}
```

---

## 🧪 TESTING GUIDE

### Using Postman

1. **Login and Get Token**
```
POST http://localhost:8080/chankya/auth/student/login
Body: {"username": "rahul_sharma_bright0", "password": "akshansh"}
```

2. **Copy Token from Response**

3. **Use Token in Subsequent Requests**
```
Headers:
  Authorization: Bearer <your_token>
```

### Sample Test Flow

**1. Student Login → View Profile → Check Attendance → Submit Assignment**

**2. Staff Login → Create Assignment → Mark Attendance → Add Fee Payment**

**3. Principal Login → View Dashboard → Get All Students → Generate Reports**

---

## 🔒 AUTHORIZATION

### Token Format
```json
{
  "id": "user_id",
  "role": "student|staff|principal",
  "username": "username",
  "school_id": "school_id"
}
```

### Roles & Permissions

**Principal:**
- Full access to own school data
- View all students, staff, classes
- Access all reports
- Cannot access other schools

**Staff:**
- Manage assigned classes
- Mark attendance
- Create/manage assignments
- Upload certificates
- View feedback
- Limited to own school

**Student:**
- View own profile & data
- View attendance
- Submit assignments
- View timetable, events
- Limited to own records

---

## 🎯 LOGIN CREDENTIALS (After Seed)

### School 1: Bright Mind Public School (Indore)
```
Principal: priya_sharma / akshansh
Staff: ramesh_kumar_s1 / akshansh
Students: rahul_sharma_bright0 / akshansh
         priya_kumar_bright1 / akshansh
```

### School 2: Future Leaders Academy (Mumbai)
```
Principal: arvind_desai / akshansh
Staff: ramesh_kumar_s2 / akshansh
Students: rahul_sharma_future0 / akshansh
         priya_kumar_future1 / akshansh
```

---

## 🚨 ERROR CODES

| Code | Meaning |
|------|---------|
| 200  | Success |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 500  | Server Error |

---

## 📝 NOTES

- All dates in ISO 8601 format
- All timestamps in UTC
- Tokens valid for 24 hours
- Multi-school support enabled
- Console logs enabled for debugging
- File uploads via multipart/form-data

---

## ✅ API SUMMARY

### Authentication (3 endpoints)
- Student Login/Logout
- Staff Login/Logout
- Principal Login/Logout

### Principal APIs (9 endpoints)
- Dashboard, Students, Staff, Classes
- Attendance, Fees, Events, Notifications, Feedback

### Staff APIs (19 endpoints)
- Assignment Management (5)
- Attendance Management (2)
- Book Management (3)
- Event Management (3)
- Fee Management (2)
- Certificate Management (2)
- Feedback Management (2)

### Student APIs (17 endpoints)
- Profile & School (2)
- Attendance (1)
- Assignments (2)
- Books (2)
- Timetable (1)
- Events (1)
- Fees (1)
- Notifications (2)
- Classmates (1)
- Staff Info (1)
- Certificates (1)
- Feedback (2)
- Interactions (2)

**Total: 48+ API Endpoints**

---

**Made with ❤️ for School Management - Complete MVC Architecture**
#   c h n a k y a  
 