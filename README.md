# Blog Site

A complete web-based blog platform with user authentication, markdown support, and engagement tracking (views, likes, comments).

## Features

✨ **Core Features**
- User authentication and authorization with JWT
- Create, read, update, and delete blog posts
- Markdown support for rich text formatting
- Comment system for post engagement
- Like tracking with IP-based duplicate prevention
- View counter
- Responsive design

📊 **Engagement Tracking**
- Track post views
- Count likes per post (IP-based)
- Comments with author information
- Comment count display

🔐 **Security**
- Password hashing with bcryptjs
- JWT-based authentication
- Input validation and sanitization
- CORS protection
- Helmet.js for HTTP headers security

🐳 **DevOps**
- Docker containerization
- Docker Compose for multi-container orchestration
- MySQL database
- Jenkinsfile for CI/CD pipeline

## Tech Stack

**Backend:**
- Node.js + Express.js
- MySQL 8.0
- JWT authentication
- Marked (Markdown parser)

**Frontend:**
- Vanilla JavaScript (no framework dependencies)
- HTML5 + CSS3
- Responsive design
- Markdown rendering

**DevOps:**
- Docker & Docker Compose
- Jenkins
- MySQL

## Project Structure

```
blogsite/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth & utilities
│   │   ├── models/         # Data models
│   │   └── routes/         # API routes
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── frontend/                # Static frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── styles.css
│   │   └── app.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml       # Multi-container setup
├── Jenkinsfile             # CI/CD pipeline
└── README.md
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd blogsite

# Build and start all services
docker-compose up --build

# Services will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MySQL: localhost:3306
```

### Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Frontend:**
```bash
cd frontend
npm start
```

**Database:**
- MySQL 8.0 running on localhost:3306
- Database: `blog_db`
- User: `blog_user`
- Password: `secure_password`

## API Documentation

### Authentication Endpoints

**Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepass123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "username": "john_doe" }
}
```

### Post Endpoints

**Get All Posts**
```bash
GET /api/posts
```

**Get Single Post**
```bash
GET /api/posts/:id
```

**Create Post** (Protected)
```bash
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Post",
  "content": "# Markdown content...",
  "excerpt": "Optional excerpt"
}
```

**Update Post** (Protected)
```bash
PUT /api/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "excerpt": "Updated excerpt"
}
```

**Delete Post** (Protected)
```bash
DELETE /api/posts/:id
Authorization: Bearer <token>
```

**Like Post**
```bash
POST /api/posts/:id/like
```

### Comment Endpoints

**Add Comment**
```bash
POST /api/posts/:postId/comments
Content-Type: application/json

{
  "author": "Jane Doe",
  "email": "jane@example.com",
  "content": "Great post!"
}
```

**Get Comments**
```bash
GET /api/posts/:postId/comments
```

## Environment Variables

### Backend (.env)

```env
DB_HOST=db
DB_USER=blog_user
DB_PASSWORD=secure_password
DB_NAME=blog_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
```

## Database Schema

**Users Table**
- id (INT, PRIMARY KEY)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- created_at (TIMESTAMP)

**Posts Table**
- id (INT, PRIMARY KEY)
- user_id (INT, FOREIGN KEY)
- title (VARCHAR)
- content (LONGTEXT, Markdown)
- excerpt (VARCHAR)
- views (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**Likes Table**
- id (INT, PRIMARY KEY)
- post_id (INT, FOREIGN KEY)
- ip_address (VARCHAR)
- created_at (TIMESTAMP)
- UNIQUE constraint on (post_id, ip_address)

**Comments Table**
- id (INT, PRIMARY KEY)
- post_id (INT, FOREIGN KEY)
- author (VARCHAR)
- email (VARCHAR)
- content (TEXT)
- created_at (TIMESTAMP)

## CI/CD Pipeline

The Jenkinsfile provides:
- Code checkout
- Backend and frontend builds
- Docker image creation
- Registry push (on main branch)
- Automated deployment
- Health checks

### Jenkins Setup

1. Create a new Pipeline job in Jenkins
2. Point to this repository
3. Configure Docker registry credentials
4. Add `DOCKER_REGISTRY_CREDENTIALS` credential ID
5. Update Docker image names in Jenkinsfile

## Deployment

### Docker Compose

```bash
docker-compose up -d
```

### Kubernetes (Optional)

Create deployment manifests for production Kubernetes deployments.

## Development

### Adding Features

1. **New API Endpoint**: Create controller → Create route → Add validation
2. **Database Changes**: Update `initDb.js` → Run initialization
3. **Frontend Changes**: Edit `app.js` and `styles.css`

### Running Tests

```bash
cd backend
npm test
```

## Security Notes

⚠️ **Important for Production:**
- Change all default passwords
- Use strong JWT_SECRET
- Enable HTTPS
- Use environment variables for all secrets
- Keep dependencies updated
- Implement rate limiting
- Add CSRF protection
- Enable database backups
- Use reverse proxy (nginx)

## Troubleshooting

**Backend won't connect to database:**
- Ensure MySQL is running
- Check database credentials in .env
- Verify network connectivity

**Frontend can't reach API:**
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API_URL in frontend code

**Docker issues:**
- Clean up: `docker-compose down -v`
- Rebuild: `docker-compose up --build`
- Check logs: `docker-compose logs <service>`

## License

MIT

## Support

For issues and questions, please open an issue in the repository.
