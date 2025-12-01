# Blog Backend

Express.js backend API for the blog application.

## Features
- User authentication with JWT
- Create, read, update, delete blog posts
- Comment system
- Like tracking
- Markdown content support

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
DB_HOST=localhost
DB_USER=blog_user
DB_PASSWORD=secure_password
DB_NAME=blog_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
```

## Installation

```bash
cd backend
npm install
```

## Running Locally

```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post (protected)
- `PUT /api/posts/:id` - Update post (protected)
- `DELETE /api/posts/:id` - Delete post (protected)
- `POST /api/posts/:id/like` - Like a post

### Comments
- `GET /api/posts/:postId/comments` - Get post comments
- `POST /api/posts/:postId/comments` - Add comment to post
