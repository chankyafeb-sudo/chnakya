# 🚀 QUICK START - 5 MINUTES SETUP

## ⚡ Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure .env file
MONGO_URI=mongodb://localhost:27017/school_db
# OR use MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/school_db
PORT=8080
AES_SECRET=your_secret_key_minimum_32_chars_long

# 3. Seed database (creates 2 schools)
node seed.js

# 4. Start server
node app.js
```

---

## 🎯 First API Test

### 1. Login as Student
```bash
POST http://localhost:8080/chankya/auth/student/login

Body (JSON):
{
  "username": "rahul_sharma_bright0",
  "password": "akshansh"
}
```

### 2. Copy Token

### 3. Get Profile (Protected Route)
```bash
GET http://localhost:8080/chankya/student/profile

Headers:
Authorization: Bearer <paste_token_here>
```

---

## 📋 All Login Credentials

### School 1: Bright Mind Public School (Indore)
| Role | Username | Password |
|------|----------|----------|
| Principal | priya_sharma | akshansh |
| Staff | ramesh_kumar_s1 | akshansh |
| Student | rahul_sharma_bright0 | akshansh |

### School 2: Future Leaders Academy (Mumbai)
| Role | Username | Password |
|------|----------|----------|
| Principal | arvind_desai | akshansh |
| Staff | ramesh_kumar_s2 | akshansh |
| Student | rahul_sharma_future0 | akshansh |

---

## 📂 Project Structure

```
chankyaa-main/
├── controllers/
│   ├── student/        (14 controllers)
│   ├── staff/          (11 controllers)
│   └── principal/      (2 controllers)
├── routes/
│   ├── student/
│   ├── staff/
│   └── principal/
├── models/             (11 schemas)
├── middleware/
├── utils/
├── config/
├── app.js
├── seed.js
├── README.md           ← COMPLETE API DOCS (48+ endpoints)
└── package.json
```

---

## 🎉 What You Get After Seeding

### Per School:
- ✅ 1 Principal
- ✅ 10 Staff Members (9 teachers + 1 principal)
- ✅ 10 Classes (6-A to 10-B)
- ✅ 100 Students (10 per class)
- ✅ 3,000 Attendance Records (30 days)
- ✅ 30 Assignments
- ✅ 5 Events
- ✅ 20 Library Books
- ✅ 360 Timetables
- ✅ 10 Notifications
- ✅ 20 Feedback Entries

### Total (2 Schools):
- 📊 200 Students
- 👥 20 Staff
- 📚 20 Classes
- 📅 6,000 Attendance Records
- 📝 60 Assignments

---

## 🔥 API Categories

### 🔐 Authentication (3)
- Student, Staff, Principal Login/Logout

### 👨‍💼 Principal APIs (9)
- Dashboard, Reports, Management

### 👨‍🏫 Staff APIs (19)
- Assignment, Attendance, Books, Events, Fees, Certificates, Feedback

### 👨‍🎓 Student APIs (17)
- Profile, Attendance, Assignments, Timetable, Events, Fees, Notifications

**Total: 48+ API Endpoints**

---

## 📖 Full Documentation

See **README.md** for complete API reference with:
- Request/Response examples
- All endpoints documented
- Error codes
- Testing guide
- Database schema

---

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3000
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongod

# Or use MongoDB Atlas cloud database
```

### Seed Errors
```bash
# Clear database first
mongo
use school_db
db.dropDatabase()

# Then run seed again
node seed.js
```

---

## 🎯 Next Steps

1. ✅ Test login endpoints
2. ✅ Explore student APIs
3. ✅ Try staff management
4. ✅ Test principal dashboard
5. ✅ Read full README.md

---

**You're ready to go! 🚀**
