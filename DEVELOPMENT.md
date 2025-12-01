# Development Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MySQL 8.0 (if running without Docker)
- Git

## Local Development Setup

### Option 1: With Docker Compose (Recommended)

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up

# Services will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MySQL: localhost:3306

# Stop services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Option 2: Manual Setup

**1. Start MySQL**

```bash
# Using Docker
docker run -d \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=blog_db \
  -e MYSQL_USER=blog_user \
  -e MYSQL_PASSWORD=secure_password \
  mysql:8.0

# Or use your own MySQL installation
```

**2. Start Backend**

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend will be available at `http://localhost:5000`

**3. Start Frontend**

```bash
cd frontend
npm start
```

Frontend will be available at `http://localhost:3000`

## Development Workflow

### Backend Development

1. Make changes to files in `backend/src/`
2. If using `npm run dev`, changes auto-reload with nodemon
3. Test API endpoints using curl or Postman

### Frontend Development

1. Edit files in `frontend/public/`
2. Refresh browser to see changes
3. Check browser console for errors

### Database Changes

1. Modify `backend/src/config/initDb.js`
2. Restart backend to apply migrations
3. Data persists in Docker volume

## Common Development Tasks

### Adding a New API Endpoint

1. Create controller function in `backend/src/controllers/`
2. Create route in `backend/src/routes/`
3. Add validation with `express-validator`
4. Test with curl/Postman
5. Add frontend integration

### Adding a New Frontend Page

1. Add new HTML/CSS in `frontend/public/`
2. Add page logic to `frontend/public/app.js`
3. Update navigation menu
4. Test in browser

### Database Debugging

```bash
# Connect to MySQL in Docker
docker exec -it blog_mysql_dev mysql -u blog_user -p -D blog_db

# List tables
SHOW TABLES;

# View table structure
DESCRIBE posts;

# Query data
SELECT * FROM posts;
```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Manual API Testing

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# Get posts
curl http://localhost:5000/api/posts

# Create post (requires token)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Post",
    "content": "# Test Post\n\nThis is a test.",
    "excerpt": "Test"
  }'
```

## Troubleshooting

### Port Already in Use

```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Database Connection Error

1. Ensure MySQL is running
2. Check credentials in `.env`
3. Verify network connectivity:
   ```bash
   docker exec blog_mysql_dev mysql -u blog_user -p -D blog_db
   ```

### Frontend Can't Connect to API

1. Check backend is running: `curl http://localhost:5000/api/posts`
2. Check CORS is enabled in backend
3. Check browser console for errors
4. Ensure API_URL is correct in frontend

### Docker Issues

```bash
# Remove all stopped containers
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Check service status
docker-compose ps

# View logs
docker-compose logs <service_name>
```

## Production Deployment

See main README.md for Docker and Kubernetes deployment instructions.

## Code Style

- JavaScript: Use arrow functions and ES6+ features
- Naming: camelCase for variables/functions, PascalCase for classes
- Comments: Use JSDoc for functions
- Formatting: Use consistent indentation (2 spaces)

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Commit changes
git commit -m "Add my feature"

# Push branch
git push origin feature/my-feature

# Create pull request on GitHub
```

## Dependencies

Keep dependencies updated:

```bash
cd backend
npm outdated
npm update

cd ../frontend
npm outdated
npm update
```

## Performance Tips

- Use database indexes for frequently queried columns
- Cache responses when appropriate
- Optimize markdown rendering on frontend
- Use lazy loading for images
- Monitor API response times

## Security During Development

- Never commit `.env` file
- Use strong test passwords
- Don't hardcode secrets
- Validate all user input
- Test authentication flows

## Additional Resources

- Express.js docs: https://expressjs.com/
- MySQL documentation: https://dev.mysql.com/doc/
- Docker docs: https://docs.docker.com/
- JWT Guide: https://jwt.io/introduction
