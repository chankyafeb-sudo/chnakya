# 📌 API ENDPOINTS - QUICK REFERENCE

## 🔐 AUTHENTICATION

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chankya/auth/student/login` | Student login |
| POST | `/chankya/auth/student/logout` | Student logout |
| POST | `/chankya/auth/staff/login` | Staff login |
| POST | `/chankya/auth/staff/logout` | Staff logout |
| POST | `/admin/auth/login` | Principal login |
| POST | `/admin/auth/logout` | Principal logout |

---

## 👨‍💼 PRINCIPAL APIS

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/:school_id/dashboard` | Get dashboard data |
| GET | `/admin/:school_id/students` | Get all students |
| GET | `/admin/:school_id/staff` | Get all staff |
| GET | `/admin/:school_id/classes` | Get all classes |
| GET | `/admin/:school_id/attendance` | Get attendance report |
| GET | `/admin/:school_id/fees` | Get fee report |
| GET | `/admin/:school_id/events` | Get all events |
| GET | `/admin/:school_id/notifications` | Get notifications |
| GET | `/admin/:school_id/feedback` | Get feedback |

---

## 👨‍🏫 STAFF APIS

### Assignment Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/assignment/staff/:staffid` | Get assigned classes |
| POST | `/chankya/assignment/staff/:classid` | Create assignment |
| GET | `/chankya/assignment/staff/class/:classid` | Get assignments by class |
| GET | `/chankya/assignment/staff/class/:assignmentid` | Get assignment details |
| PUT | `/chankya/assignment/staff/class/:assignmentid` | Update submission |

### Attendance Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chankya/attendance/staff/mark` | Mark attendance |
| GET | `/chankya/attendance/staff/class/:classid` | Get class attendance |

### Book Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/books/staff` | Get all books |
| POST | `/chankya/books/staff/issue` | Issue book |
| POST | `/chankya/books/staff/return` | Return book |

### Event Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/events/staff` | Get all events |
| POST | `/chankya/events/staff/create` | Create event |
| PUT | `/chankya/events/staff/:eventid` | Update event |

### Fee Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chankya/fee/staff/payment` | Add fee payment |
| GET | `/chankya/fee/staff/student/:studentid` | Get student fee details |

### Certificate Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chankya/certificate/staff/upload` | Upload certificate |
| GET | `/chankya/certificate/staff/student/:studentid` | Get student certificates |

### Feedback Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/feedback/staff` | View all feedback |
| PUT | `/chankya/feedback/staff/:feedbackid/respond` | Respond to feedback |

---

## 👨‍🎓 STUDENT APIS

### Profile & School
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/student/profile` | Get my profile |
| GET | `/chankya/aboutschool` | Get school info |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/attendance/student` | Get my attendance |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/assignment/student/:studentid` | Get my assignments |
| POST | `/chankya/assignment/student/:assignmentid/submit` | Submit assignment |

### Books
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/books/student` | Get library books |
| POST | `/chankya/books/student/request` | Request book issue |

### Timetable
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/timetable/student` | Get my timetable |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/events/student` | Get upcoming events |

### Fees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/fee/student` | Get my fee details |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/notification/student` | Get notifications |
| PUT | `/chankya/notification/student/:notificationid/read` | Mark as read |

### Classmates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/classmate/student` | Get classmates |

### Staff Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/staff/student` | Get teachers list |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/certificate/student` | Get my certificates |

### Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chankya/feedback/student/submit` | Submit feedback |
| GET | `/chankya/feedback/student` | Get my feedback history |

### Interactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chankya/intraction/student` | Get interactions |
| POST | `/chankya/intraction/student/create` | Create interaction |

---

## 📊 SUMMARY

| Category | Endpoints |
|----------|-----------|
| Authentication | 6 |
| Principal | 9 |
| Staff | 19 |
| Student | 17 |
| **TOTAL** | **51 endpoints** |

---

## 🔒 AUTHORIZATION

All protected endpoints require:
```
Headers:
  Authorization: Bearer <token>
```

Get token from login endpoints.

---

**Quick Reference - See README.md for detailed documentation**
