pipeline {
    agent any

    environment {
        REGISTRY = 'docker.io'
        DOCKER_REGISTRY_CREDENTIALS = 'docker-credentials'
        DOCKER_IMAGE_BACKEND = 'yourusername/blog-backend'
        DOCKER_IMAGE_FRONTEND = 'yourusername/blog-frontend'
        MYSQL_IMAGE = 'mysql:8.0'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo 'Code checked out successfully'
                }
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    echo 'Building backend image...'
                    dir('backend') {
                        sh 'npm install'
                        sh 'npm test || true'
                    }
                    sh 'docker build -t ${DOCKER_IMAGE_BACKEND}:latest -f backend/Dockerfile backend/'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                script {
                    echo 'Building frontend image...'
                    sh 'docker build -t ${DOCKER_IMAGE_FRONTEND}:latest -f frontend/Dockerfile frontend/'
                }
            }
        }

        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Pushing images to Docker registry...'
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_REGISTRY_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                            docker logout
                        '''
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Deploying with docker-compose...'
                    sh '''
                        # Stop existing services
                        docker-compose down || true
                        
                        # Start services
                        docker-compose up -d
                        
                        # Wait for services to be ready
                        sleep 10
                        
                        # Check service health
                        docker-compose ps
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Performing health checks...'
                    sh '''
                        # Check if backend is responding
                        for i in {1..30}; do
                            if curl -f http://localhost:5000/api/posts 2>/dev/null; then
                                echo "Backend is healthy"
                                exit 0
                            fi
                            sleep 1
                        done
                        echo "Backend health check failed"
                        exit 1
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo 'Cleaning up workspace...'
                cleanWs()
            }
        }
        success {
            script {
                echo 'Pipeline succeeded!'
                // Optional: Send success notification
            }
        }
        failure {
            script {
                echo 'Pipeline failed!'
                // Optional: Send failure notification
                sh 'docker-compose logs || true'
            }
        }
    }
}
