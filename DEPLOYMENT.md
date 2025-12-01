# Deployment Guide

This guide covers deploying the blog application to production.

## Production Deployment Options

### 1. Docker Compose on Single Server

**Prerequisites:**
- Docker and Docker Compose installed
- Server with at least 2GB RAM
- Domain name (optional)
- SSL certificate (recommended)

**Steps:**

```bash
# 1. Clone repository
git clone <repository-url>
cd blogsite

# 2. Update environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with production values:
# - Change JWT_SECRET to a strong random key
# - Set DB_PASSWORD to a strong password
# - Set NODE_ENV=production

# 3. Update docker-compose.yml
# - Change all passwords
# - Update environment variables
# - Consider using environment file

# 4. Start services
docker-compose up -d

# 5. Verify deployment
curl http://localhost:5000/api/posts
```

**Security Considerations:**
```bash
# Generate strong JWT secret
openssl rand -base64 32

# Set proper file permissions
chmod 600 backend/.env
chmod 600 docker-compose.yml
```

### 2. Kubernetes Deployment

**Prerequisites:**
- Kubernetes cluster (k8s v1.20+)
- kubectl configured
- Docker images pushed to registry
- Persistent volumes available

**Create ConfigMap for non-sensitive data:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-config
data:
  DB_HOST: mysql
  DB_NAME: blog_db
  DB_PORT: "3306"
  PORT: "5000"
  NODE_ENV: production
```

**Create Secret for sensitive data:**

```bash
kubectl create secret generic blog-secrets \
  --from-literal=DB_PASSWORD=secure_password \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32)
```

**Deploy services:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: blog-backend
spec:
  type: LoadBalancer
  selector:
    app: blog-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 5000

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blog-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: blog-backend
  template:
    metadata:
      labels:
        app: blog-backend
    spec:
      containers:
      - name: backend
        image: yourusername/blog-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: blog-config
        - secretRef:
            name: blog-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 3. AWS Deployment

**Using ECS (Elastic Container Service):**

```bash
# Create ECR repositories
aws ecr create-repository --repository-name blog-backend
aws ecr create-repository --repository-name blog-frontend

# Push images
docker tag blog-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/blog-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/blog-backend:latest

# Create RDS MySQL instance
aws rds create-db-instance \
  --db-instance-identifier blog-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username blog_user \
  --allocated-storage 20

# Create ECS cluster and services
# (Use AWS Console or CloudFormation)
```

**Using Elastic Beanstalk:**

```bash
# Create .ebextensions/docker-compose.config
# Place docker-compose.yml in project root
# Deploy with eb cli

eb init -p docker blog-site
eb create prod-env
eb deploy
```

### 4. Heroku Deployment

**Create Procfile:**

```
web: npm start --prefix backend
```

**Deploy:**

```bash
heroku create blog-app
heroku addons:create cleardb:ignite
git push heroku main
```

### 5. DigitalOcean App Platform

**Deploy via GitHub:**

1. Push code to GitHub
2. Connect repository to DigitalOcean App Platform
3. Configure build settings
4. Set environment variables
5. Deploy

## SSL/HTTPS Setup

### With Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx to use certificate
# (in nginx config)
```

### With docker-compose

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend
```

## Database Backups

### Automated MySQL Backups

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backups/blog"
DATE=$(date +%Y%m%d_%H%M%S)

docker exec blog_mysql mysqldump \
  -u blog_user -p$DB_PASSWORD \
  blog_db > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete
```

### Schedule with cron

```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

### S3 Backup

```bash
# Upload to AWS S3
aws s3 cp backup_latest.sql s3://blog-backups/
```

## Monitoring and Logging

### Application Monitoring

```bash
# Docker stats
docker stats --no-stream

# Check service health
curl http://localhost:5000/api/posts
```

### Log Management

```bash
# View logs
docker-compose logs -f backend

# Send to CloudWatch/ELK Stack
# (Configure in docker-compose.yml)
```

### Error Tracking

```javascript
// Add Sentry for error tracking
const Sentry = require("@sentry/node");

Sentry.init({ 
  dsn: process.env.SENTRY_DSN 
});
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml with load balancer
services:
  nginx:
    image: nginx:latest
    # Routes traffic to backend instances

  backend:
    deploy:
      replicas: 3  # Multiple instances
```

### Database Scaling

- Add read replicas for read-heavy workloads
- Use caching (Redis/Memcached)
- Optimize queries and indexes

## Performance Optimization

### Frontend
- Minify CSS/JS
- Compress images
- Enable gzip
- Use CDN for static assets

### Backend
- Add database indexes
- Implement caching
- Use connection pooling
- Monitor slow queries

### Infrastructure
- Enable HTTP/2
- Use compression
- Implement rate limiting
- Set up DDoS protection

## Environment Variables for Production

```env
# Database
DB_HOST=prod-db.example.com
DB_USER=prod_user
DB_PASSWORD=<strong-password>
DB_NAME=blog_prod
DB_PORT=3306

# Security
JWT_SECRET=<strong-random-key>
JWT_EXPIRE=7d
NODE_ENV=production

# Server
PORT=5000
LOG_LEVEL=info

# Optional: External Services
SENTRY_DSN=<optional>
REDIS_URL=<optional>
```

## Health Checks

### Docker Health Check

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/posts"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Kubernetes Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/posts
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/posts
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
```

## Rollback Procedures

```bash
# Keep previous version running
docker tag blog-backend:latest blog-backend:v1.0.0

# Rollback if needed
docker-compose down
docker pull blog-backend:v1.0.0
docker-compose up -d
```

## Update Procedures

```bash
# 1. Pull latest code
git pull origin main

# 2. Build new images
docker-compose build

# 3. Test in staging
docker-compose up

# 4. Deploy to production
docker-compose up -d

# 5. Verify
curl http://localhost:5000/api/posts
```

## Troubleshooting Production Issues

### High CPU Usage
- Check database queries
- Monitor background jobs
- Review application logs

### Memory Issues
- Check for memory leaks
- Monitor connection pools
- Review error logs

### Database Slowness
- Analyze slow query log
- Add missing indexes
- Consider replication

### Container Crashes
```bash
# Check logs
docker logs blog_backend

# Check resources
docker stats

# Check exit code
docker inspect blog_backend | grep "ExitCode"
```

## Disaster Recovery

### Data Loss Prevention
1. Regular backups (daily minimum)
2. Test backup restoration
3. Replicate to different region
4. Keep backups encrypted

### Failover Setup
1. Database replication
2. Load balancer
3. Multiple server instances
4. Automated failover policies

## Security Hardening

1. Keep software updated
2. Use firewalls
3. Enable HTTPS/TLS
4. Regular security audits
5. Monitor access logs
6. Use secrets management (Vault, AWS Secrets Manager)
7. Implement rate limiting
8. Add WAF rules

## Compliance

- Data protection (GDPR, CCPA)
- Audit logging
- User consent management
- Data retention policies
- Privacy policy
- Terms of service
