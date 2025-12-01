const API_URL = 'http://localhost:5000/api';

let currentUser = null;
let currentPage = 'home';

class Blog {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        this.currentPage = 'home';
        if (this.token) {
            currentUser = this.currentUser;
        }
        this.init();
    }

    init() {
        this.render();
        window.addEventListener('hashchange', () => this.handleRoute());
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        this.showPage(hash);
    }

    showPage(page) {
        this.currentPage = page;
        this.render();
    }

    render() {
        const root = document.getElementById('root');
        root.innerHTML = `
            <div class="container">
                <header>
                    <h1>📝 My Blog</h1>
                    <nav>
                        <button onclick="blog.showPage('home')">Home</button>
                        ${this.token ? `
                            <button onclick="blog.showPage('create')">New Post</button>
                            <button onclick="blog.showPage('dashboard')">Dashboard</button>
                            <button onclick="blog.logout()">Logout</button>
                        ` : `
                            <button onclick="blog.showPage('login')">Login</button>
                            <button onclick="blog.showPage('register')">Register</button>
                        `}
                    </nav>
                </header>
                <div class="content" id="page-content">
                    Loading...
                </div>
            </div>
        `;
        
        // Load content asynchronously
        this.loadPageContent();
    }

    async loadPageContent() {
        const pageContent = await this.renderPage();
        document.getElementById('page-content').innerHTML = pageContent;
        
        // Load posts based on current page
        const hashParts = this.currentPage.split('?');
        const page = hashParts[0];
        
        if (page === 'home') {
            this.loadPosts();
        } else if (page === 'dashboard') {
            this.loadMyPosts();
        }
    }

    async renderPage() {
        const hashParts = this.currentPage.split('?');
        const page = hashParts[0];
        
        switch(page) {
            case 'home':
                return this.renderHome();
            case 'login':
                return this.token ? this.renderDashboard() : this.renderLogin();
            case 'register':
                return this.token ? this.renderDashboard() : this.renderRegister();
            case 'create':
                return this.token ? this.renderCreatePost() : this.renderLogin();
            case 'dashboard':
                return this.token ? this.renderDashboard() : this.renderLogin();
            case 'post':
                const queryString = hashParts[1] || '';
                const postId = new URLSearchParams(queryString).get('id');
                return postId ? await this.renderPostDetail(postId) : this.renderHome();
            default:
                return this.renderHome();
        }
    }

    renderHome() {
        return `
            <h2>Latest Posts</h2>
            <div id="posts-container" class="posts-list"></div>
        `;
    }

    renderLogin() {
        return `
            <h2>Login</h2>
            <form onsubmit="blog.handleLogin(event)" style="max-width: 400px;">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="login-username" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="login-password" required>
                </div>
                <button type="submit" class="primary">Login</button>
            </form>
        `;
    }

    renderRegister() {
        return `
            <h2>Register</h2>
            <form onsubmit="blog.handleRegister(event)" style="max-width: 400px;">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="reg-username" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="reg-email" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="reg-password" required>
                </div>
                <button type="submit" class="primary">Register</button>
            </form>
        `;
    }

    renderCreatePost() {
        return `
            <h2>Create New Post</h2>
            <form onsubmit="blog.handleCreatePost(event)" style="max-width: 800px;">
                <div id="message"></div>
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="post-title" required>
                </div>
                <div class="form-group">
                    <label>Content (Markdown)</label>
                    <textarea id="post-content" required></textarea>
                </div>
                <div class="form-group">
                    <label>Excerpt (Optional)</label>
                    <input type="text" id="post-excerpt">
                </div>
                <button type="submit" class="primary">Publish Post</button>
            </form>
        `;
    }

    renderDashboard() {
        return `
            <h2>My Dashboard</h2>
            <p>Welcome, <strong>${currentUser?.username}</strong>!</p>
            <button class="primary" onclick="blog.showPage('create')" style="margin-bottom: 20px;">+ New Post</button>
            <h3>My Posts</h3>
            <div id="my-posts-container" class="posts-list"></div>
        `;
    }

    async renderPostDetail(postId) {
        try {
            const response = await fetch(`${API_URL}/posts/${postId}`);
            if (!response.ok) throw new Error('Post not found');
            
            const post = await response.json();
            const htmlContent = marked.parse(post.content);
            
            return `
                <div class="post-detail">
                    <h2>${this.escapeHtml(post.title)}</h2>
                    <div class="meta">
                        By <strong>${this.escapeHtml(post.username)}</strong> on ${new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div class="post-actions">
                        <button class="like-button" onclick="blog.likePost(${postId})">👍 Like (${post.likes || 0})</button>
                        <span>👁️ Views: ${post.views}</span>
                    </div>
                    ${this.token && currentUser?.username === post.username ? `
                        <div class="post-actions">
                            <button onclick="blog.showEditPost(${postId})">Edit</button>
                            <button onclick="blog.deletePost(${postId})">Delete</button>
                        </div>
                    ` : ''}
                    <div class="post-content">${htmlContent}</div>
                    
                    <div class="comments-section">
                        <h3>Comments (${post.comments?.length || 0})</h3>
                        
                        <div class="comment-form">
                            <h4>Leave a Comment</h4>
                            <form onsubmit="blog.handleAddComment(event, ${postId})">
                                <div class="form-group">
                                    <label>Name</label>
                                    <input type="text" id="comment-author" required>
                                </div>
                                <div class="form-group">
                                    <label>Email</label>
                                    <input type="email" id="comment-email" required>
                                </div>
                                <div class="form-group">
                                    <label>Comment</label>
                                    <textarea id="comment-content" required></textarea>
                                </div>
                                <button type="submit" class="primary">Post Comment</button>
                            </form>
                        </div>

                        ${post.comments && post.comments.length > 0 ? `
                            <div class="comments-list">
                                ${post.comments.map(comment => `
                                    <div class="comment">
                                        <div class="author">${this.escapeHtml(comment.author)}</div>
                                        <div class="date">${new Date(comment.created_at).toLocaleString()}</div>
                                        <div class="text">${this.escapeHtml(comment.content)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p>No comments yet. Be the first to comment!</p>'}
                    </div>
                </div>
            `;
        } catch (error) {
            return `<div class="error">Error loading post: ${error.message}</div>`;
        }
    }

    async loadPosts() {
        try {
            const response = await fetch(`${API_URL}/posts`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const posts = await response.json();
            
            const container = document.getElementById('posts-container');
            if (!posts || posts.length === 0) {
                container.innerHTML = '<p>No posts yet.</p>';
                return;
            }

            container.innerHTML = posts.map(post => `
                <div class="post-card" onclick="window.location.hash='#post?id=${post.id}'">
                    <h3>${this.escapeHtml(post.title)}</h3>
                    <div class="meta">By ${this.escapeHtml(post.username)} on ${new Date(post.created_at).toLocaleDateString()}</div>
                    <div class="excerpt">${this.escapeHtml(post.excerpt)}</div>
                    <div class="stats">
                        <span>👁️ ${post.views} views</span>
                        <span>👍 ${post.likes} likes</span>
                        <span>💬 ${post.comments} comments</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            const container = document.getElementById('posts-container');
            container.innerHTML = `<div class="error">Error loading posts: ${error.message}</div>`;
        }
    }

    async loadMyPosts() {
        try {
            const response = await fetch(`${API_URL}/posts`);
            const allPosts = await response.json();
            
            const myPosts = allPosts.filter(post => post.username === currentUser?.username);
            const container = document.getElementById('my-posts-container');
            
            if (myPosts.length === 0) {
                container.innerHTML = '<p>You haven\'t published any posts yet.</p>';
                return;
            }

            container.innerHTML = myPosts.map(post => `
                <div class="post-card">
                    <h3 onclick="window.location.hash='#post?id=${post.id}'">${this.escapeHtml(post.title)}</h3>
                    <div class="meta">${new Date(post.created_at).toLocaleDateString()}</div>
                    <div class="excerpt">${this.escapeHtml(post.excerpt)}</div>
                    <div class="stats">
                        <span>👁️ ${post.views} views</span>
                        <span>👍 ${post.likes} likes</span>
                        <span>💬 ${post.comments} comments</span>
                    </div>
                    <div class="post-actions" style="margin-top: 10px;">
                        <button onclick="blog.showEditPost(${post.id})">Edit</button>
                        <button onclick="blog.deletePost(${post.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            this.token = data.token;
            currentUser = data.user;
            this.showPage('dashboard');
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            // Auto-login after registration
            if (data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.token = data.token;
                currentUser = data.user;
                alert('Registration successful! Welcome ' + username);
                this.showPage('dashboard');
            } else {
                alert('Registration successful! Please login.');
                this.showPage('login');
            }
        } catch (error) {
            alert('Registration failed: ' + error.message);
        }
    }

    async handleCreatePost(event) {
        event.preventDefault();
        const title = document.getElementById('post-title').value;
        const content = document.getElementById('post-content').value;
        const excerpt = document.getElementById('post-excerpt').value;

        try {
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ title, content, excerpt })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Post creation failed');

            document.getElementById('message').innerHTML = '<div class="success">Post published successfully!</div>';
            setTimeout(() => this.showPage('dashboard'), 2000);
        } catch (error) {
            document.getElementById('message').innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }

    async handleAddComment(event, postId) {
        event.preventDefault();
        const author = document.getElementById('comment-author').value.trim();
        const email = document.getElementById('comment-email').value.trim();
        const content = document.getElementById('comment-content').value.trim();

        if (!author || !email || !content) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, email, content })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.errors?.[0]?.msg || 'Comment failed');
            }

            // Clear form and reload post
            document.getElementById('comment-author').value = '';
            document.getElementById('comment-email').value = '';
            document.getElementById('comment-content').value = '';
            
            // Reload the post to show the new comment
            const pageContent = await this.renderPostDetail(postId);
            document.getElementById('page-content').innerHTML = pageContent;
            
            alert('Comment posted successfully!');
        } catch (error) {
            alert('Error posting comment: ' + error.message);
        }
    }

    async likePost(postId) {
        try {
            const response = await fetch(`${API_URL}/posts/${postId}/like`, {
                method: 'POST'
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Like failed');

            alert('Post liked!');
            location.reload();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Delete failed');

            alert('Post deleted successfully!');
            this.showPage('dashboard');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        currentUser = null;
        this.showPage('home');
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

const blog = new Blog();
