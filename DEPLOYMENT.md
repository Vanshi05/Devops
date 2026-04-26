# Medical Dashboard - Deployment Guide

## Database Configuration

**Database Name:** `sehat_db` (for CI/CD)  
**Database User:** `postgres`  
**Default Port:** `5432`

## Local Development with Docker

### 1. Build and start containers
```bash
cd /path/to/medical-dashboard
docker-compose up -d
```

### 2. Verify database initialization
```bash
docker exec -i backend-db psql -U postgres -d sehat_db << 'EOF'
\dt
EOF
```

You should see these tables:
- users
- patients
- providers
- medical_records
- prescriptions
- appointments
- documents

### 3. Access the application
- **Frontend:** http://localhost
- **Backend API:** http://localhost:5001
- **Database:** localhost:5432

---

## Production Deployment (CI/CD)

### Environment Variables

Set these in your CI/CD platform:

```bash
# Database
DB_USER=postgres
DB_PASSWORD=your-secure-password-here
DB_HOST=db
DB_PORT=5432
DB_NAME=sehat_db

# API
PORT=5001
JWT_SECRET=your-very-secure-random-key-here
JWT_EXPIRE=7d
NODE_ENV=production

# Frontend
REACT_APP_API_URL=https://your-domain.com
```

### Docker Compose Deployment

1. **Update docker-compose.yml** with your secure passwords:
```yaml
db:
  environment:
    POSTGRES_PASSWORD: your-secure-password-here
```

2. **Build images:**
```bash
docker-compose build
```

3. **Deploy:**
```bash
docker-compose up -d
```

4. **Verify database:**
```bash
docker exec -i backend-db psql -U postgres -d sehat_db -c "\dt"
```

---

## AWS Deployment (EC2 + RDS)

### 1. Database Setup (RDS)
- Engine: PostgreSQL 15
- DB name: `sehat_db`
- Master username: `postgres`
- Create security group allowing port 5432

### 2. Backend Setup (EC2)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/YOUR-USERNAME/medical-dashboard.git
cd medical-dashboard/backend

# Install dependencies
npm install --production

# Set environment variables
export DB_HOST=your-rds-endpoint.amazonaws.com
export DB_NAME=sehat_db
export DB_USER=postgres
export DB_PASSWORD=your-password
export JWT_SECRET=your-secret
export NODE_ENV=production

# Start server
npm start
```

### 3. Initialize Database
```bash
psql -h your-rds-endpoint.amazonaws.com -U postgres -d sehat_db -f src/config/init.sql
```

---

## GitHub Actions CI/CD Pipeline

The `.github/workflows/ci-cd.yml` handles:

1. **Testing** - Runs on every push
2. **Docker Build** - Builds images for main branch
3. **Database Check** - Verifies schema creation
4. **Deploy** - Push to your registry

### Setup Steps

1. Add Docker credentials to GitHub Secrets:
   - `DOCKER_USERNAME`
   - `DOCKER_PASSWORD`

2. Update workflow for your deployment platform

---

## Troubleshooting

### Tables Not Creating

**Problem:** `ERROR: relation "users" does not exist`

**Solution:**
```bash
# Manually run init script
docker exec -i backend-db psql -U postgres -d sehat_db < backend/src/config/init.sql

# Or check container logs
docker logs backend-db
docker logs backend-api
```

### Database Connection Refused

**Check connectivity:**
```bash
docker exec backend-db psql -U postgres -c "SELECT 1"
```

**Check environment variables:**
```bash
docker exec backend-api env | grep DB_
```

### Schema Not Updating

1. Clear volumes (WARNING: deletes data):
```bash
docker-compose down -v
docker-compose up -d
```

2. Or manually rebuild:
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## Backup & Restore

### Backup Database
```bash
docker exec backend-db pg_dump -U postgres sehat_db > backup.sql
```

### Restore Database
```bash
docker exec -i backend-db psql -U postgres sehat_db < backup.sql
```

---

## Security Checklist

- [ ] Change `JWT_SECRET` in production
- [ ] Use strong `DB_PASSWORD`
- [ ] Enable HTTPS for frontend
- [ ] Restrict database access (VPC/Security Groups)
- [ ] Use environment variables for all secrets
- [ ] Enable CloudWatch/monitoring
- [ ] Set up automated backups
- [ ] Regular security updates

---

## Monitoring

### Check Logs
```bash
# Backend
docker logs backend-api -f

# Database
docker logs backend-db -f

# Combined
docker-compose logs -f
```

### Database Health
```bash
curl http://localhost:5001/health
```

---

## Scaling

For production with multiple containers, use:
- Load Balancer (AWS ELB, Nginx)
- Database Replication (RDS Multi-AZ)
- Container Orchestration (ECS, Kubernetes)
- CDN for static assets (CloudFront)

---

## Support & Maintenance

For issues:
1. Check container logs: `docker logs backend-api`
2. Verify database: `docker exec backend-db psql -U postgres sehat_db -c "\dt"`
3. Test API: `curl http://localhost:5001/health`
