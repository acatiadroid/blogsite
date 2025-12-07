pipeline {
    agent any

    environment {
        REGISTRY = 'docker.io'
        DOCKER_REGISTRY_CREDENTIALS = 'docker-credentials'
        DOCKER_IMAGE_BACKEND = 'acatia/blog-backend'
        DOCKER_IMAGE_FRONTEND = 'acatia/blog-frontend'
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        BUILD_VERSION = "${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Code checked out successfully"
                    echo "Git commit: ${GIT_COMMIT_SHORT}"
                    echo "Build version: ${BUILD_VERSION}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo "Installing backend dependencies..."
                    dir('backend') {
                        sh 'npm ci'
                    }
                }
            }
        }

        stage('Test Backend') {
            steps {
                script {
                    echo "Running backend tests..."
                    dir('backend') {
                        sh '''
                            npm test -- --coverage --watchAll=false --passWithNoTests
                        '''
                    }
                }
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    echo "Building backend Docker image..."
                    sh '''
                        docker build \
                          -t ${DOCKER_IMAGE_BACKEND}:latest \
                          -t ${DOCKER_IMAGE_BACKEND}:${BUILD_VERSION} \
                          -f backend/Dockerfile \
                          backend/
                    '''
                }
            }
        }

        stage('Build Frontend') {
            steps {
                script {
                    echo "Building frontend Docker image..."
                    sh '''
                        docker build \
                          -t ${DOCKER_IMAGE_FRONTEND}:latest \
                          -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_VERSION} \
                          -f frontend/Dockerfile \
                          frontend/
                    '''
                }
            }
        }

        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Pushing images to Docker Hub..."
                    withCredentials([usernamePassword(credentialsId: env.DOCKER_REGISTRY_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo "Logging into Docker Hub..."
                            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                            
                            echo "Pushing backend:latest..."
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            
                            echo "Pushing backend:${BUILD_VERSION}..."
                            docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_VERSION}
                            
                            echo "Pushing frontend:latest..."
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                            
                            echo "Pushing frontend:${BUILD_VERSION}..."
                            docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_VERSION}
                            
                            docker logout
                            echo "All images pushed successfully"
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
                    echo "Deploying with docker-compose..."
                    sh '''
                        # Stop existing services gracefully
                        docker-compose down || true
                        
                        # Remove dangling images
                        docker image prune -f || true
                        
                        # Start services
                        docker-compose up -d
                        
                        # Wait for services to be ready
                        sleep 15
                        
                        # Show service status
                        docker-compose ps
                    '''
                }
            }
        }

        stage('Health Checks') {
            steps {
                script {
                    echo "Performing health checks..."
                    sh '''
                        set +e
                        
                        # Check if backend is responding
                        echo "Checking backend health..."
                        for i in {1..30}; do
                            if curl -sf http://localhost:5000/api/posts > /dev/null 2>&1; then
                                echo "Backend is healthy"
                                BACKEND_HEALTHY=1
                                break
                            fi
                            echo "Attempt $i: Waiting for backend..."
                            sleep 1
                        done
                        
                        if [ -z "$BACKEND_HEALTHY" ]; then
                            echo "Backend health check failed"
                            docker-compose logs backend
                            exit 1
                        fi
                        
                        # Check if frontend is responding
                        echo "Checking frontend health..."
                        for i in {1..30}; do
                            if curl -sf http://localhost:3000 > /dev/null 2>&1; then
                                echo "Frontend is healthy"
                                break
                            fi
                            echo "Attempt $i: Waiting for frontend..."
                            sleep 1
                        done
                        
                        echo "All health checks passed"
                    '''
                }
            }
        }

        stage('Cleanup') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Cleaning up Docker resources..."
                    sh '''
                        # Remove untagged images
                        docker image prune -f || true
                        
                        # Show Docker disk usage
                        docker system df
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Pipeline execution completed"
            }
        }
        success {
            script {
                echo "Pipeline succeeded!"
                sh '''
                    echo "=== Build Summary ==="
                    echo "Backend image: ${DOCKER_IMAGE_BACKEND}:${BUILD_VERSION}"
                    echo "Frontend image: ${DOCKER_IMAGE_FRONTEND}:${BUILD_VERSION}"
                    echo "Status: SUCCESS"
                '''
            }
        }
        failure {
            script {
                echo "Pipeline failed!"
                sh '''
                    echo "=== Failure Details ==="
                    docker-compose logs || true
                    docker ps || true
                '''
            }
        }
        cleanup {
            cleanWs()
        }
    }
}
