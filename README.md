# Medical Dashboard

A full-stack medical management system with patient portals, provider dashboards, and admin analytics. Built with Node.js/Express, PostgreSQL, and React.

## 🎯 Features

### Patient Portal
- View personal medical records
- Browse prescriptions and their status
- Schedule and manage appointments
- Track medical history statistics

### Provider Dashboard
- Manage patient records
- Create and assign prescriptions
- View upcoming appointments
- Track patient data

### Admin Dashboard
- System-wide statistics
- Patient management
- User account creation
- Activity reports and analytics

## 🏗️ Project Structure

```
medical-dashboard/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── server.js
│   │   ├── config/database.sql
│   │   ├── middleware/auth.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── patientRoutes.js
│   │   │   ├── prescriptionRoutes.js
│   │   │   ├── appointmentRoutes.js
│   │   │   └── adminRoutes.js
│   │   └── utils/auth.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/             # React SPA
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── ProviderDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Dashboard.css
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── App.css
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── .github/workflows/ci-cd.yml
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)

### Using Docker Compose (Recommended)

1. **Clone and setup**
```bash
cd /path/to/medical-dashboard
```

2. **Start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on `localhost:5432`
- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:80`

3. **Verify services are running**
```bash
curl http://localhost:5000/health
```

### Local Development (Without Docker)

#### Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Setup database
psql -U postgres -c "CREATE DATABASE medical_dashboard;"
psql -U postgres -d medical_dashboard -f src/config/database.sql

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:5000" > .env

# Start development server
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "role": "patient",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Patient Records Endpoints

#### Get Patient Records
```bash
GET /patients/:patientId/records?limit=10&offset=0
Authorization: Bearer <token>
```

#### Add Medical Record
```bash
POST /patients/:patientId/records
Authorization: Bearer <token>
Content-Type: application/json

{
  "recordType": "diagnosis",
  "description": "Patient presents with symptoms of...",
  "diagnosis": "Common Cold",
  "date": "2024-04-26"
}
```

### Prescriptions Endpoints

#### Add Prescription
```bash
POST /prescriptions/:patientId/prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "medication": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "startDate": "2024-04-26",
  "endDate": "2024-05-06"
}
```

#### Get Prescriptions
```bash
GET /prescriptions/:patientId/prescriptions
Authorization: Bearer <token>
```

### Appointments Endpoints

#### Schedule Appointment
```bash
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": 1,
  "providerId": 2,
  "scheduledDate": "2024-04-30T10:00:00Z",
  "reason": "Regular checkup"
}
```

#### Get Appointments
```bash
GET /appointments?patientId=1&limit=10&offset=0
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Statistics
```bash
GET /admin/statistics
Authorization: Bearer <token>
```

#### Get All Patients
```bash
GET /admin/patients?limit=20&offset=0&search=john
Authorization: Bearer <token>
```

#### Create User
```bash
POST /admin/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "doctor@example.com",
  "password": "password123",
  "role": "provider",
  "firstName": "Jane",
  "lastName": "Smith",
  "licenseNumber": "MD123456",
  "specialization": "Cardiology"
}
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. 

1. **Register/Login** to get a token
2. **Include token** in the `Authorization` header: `Bearer <token>`
3. **Token expires** in 7 days (configurable via JWT_EXPIRE)

### User Roles
- **patient**: Can view own records and appointments
- **provider**: Can manage patient records and prescriptions
- **admin**: Can manage users and view system statistics

## 🗄️ Database Schema

### Users
- id, email, password_hash, role, first_name, last_name, created_at

### Patients
- id, user_id, date_of_birth, blood_type, allergies, emergency_contact

### Providers
- id, user_id, license_number, specialization, phone_number

### Medical Records
- id, patient_id, provider_id, record_type, description, diagnosis, date, file_url

### Prescriptions
- id, patient_id, provider_id, medication, dosage, frequency, start_date, end_date, status

### Appointments
- id, patient_id, provider_id, scheduled_date, reason, status

## 🔄 CI/CD Pipeline

The project includes a GitHub Actions workflow that:

1. **Tests** backend and builds frontend on every push
2. **Builds** Docker images for both services
3. **Verifies** containers start and API is healthy
4. **Deploys** on main branch (configure your deployment step)

### GitHub Actions Workflow
Located at `.github/workflows/ci-cd.yml`

### Running Locally
```bash
# Build images
docker-compose build

# Run all services
docker-compose up

# Stop services
docker-compose down
```

## 📋 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Build
```bash
cd frontend
npm run build
```

## 🛠️ Development Tips

### Environment Variables

**Backend (.env)**
```
PORT=5000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_dashboard
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
```

### Database Management

#### Connect to Database
```bash
psql -U postgres -d medical_dashboard
```

#### View Tables
```sql
\dt
```

#### Reset Database
```sql
DROP DATABASE IF EXISTS medical_dashboard;
CREATE DATABASE medical_dashboard;
```

## 📦 Deployment

### Deploying to Cloud Platforms

#### AWS ECS
1. Push Docker images to ECR
2. Create ECS task definitions
3. Deploy using ECS service

#### Heroku
```bash
heroku create medical-dashboard
heroku container:push web
heroku container:release web
```

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure environment variables
3. Deploy on push to main

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs medical_db

# Rebuild containers
docker-compose down -v
docker-compose up --build
```

### API Not Responding
```bash
# Check backend logs
docker logs medical_api

# Test API health
curl http://localhost:5000/health
```

### Frontend Not Loading
```bash
# Check frontend logs
docker logs medical_ui

# Ensure backend is accessible
curl http://localhost:5000/health
```

## 📝 API Error Codes

- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Missing or invalid token
- **403**: Forbidden - User doesn't have permission
- **404**: Not Found - Resource doesn't exist
- **500**: Internal Server Error

## 🔒 Security Notes

⚠️ **Before Production:**
1. Change JWT_SECRET to a strong random string
2. Enable HTTPS
3. Set up CORS properly
4. Implement rate limiting
5. Add input validation (frontend and backend)
6. Consider HIPAA compliance requirements
7. Set up database backups
8. Enable audit logging

## 📞 Support

For issues, feature requests, or questions:
1. Check existing documentation
2. Review error logs
3. Verify all environment variables
4. Ensure all services are running

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Happy coding! 🚀**
