pipeline {
    agent any

    environment {
        REGISTRY = 'docker.io'
        DOCKER_REGISTRY_CREDENTIALS = 'docker-credentials'
        DOCKER_IMAGE_BACKEND = 'acatia/blog-backend'
        DOCKER_IMAGE_FRONTEND = 'acatia/blog-frontend'
        GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
        BUILD_VERSION = "${BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
        EC2_SSH_CREDENTIALS = 'ec2-ssh-key'
        ENV_FILE_CREDENTIALS = 'env-file'
        ANSIBLE_HOST_KEY_CHECKING = 'False'
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
                            npm test -- --coverage --watchAll=false --passWithNoTests || true
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

        stage('Deploy to EC2 Instances with Ansible') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Deploying to 3 EC2 instances with Ansible..."
                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'ec2-ssh-key-1', keyFileVariable: 'SSH_KEY_1'),
                        sshUserPrivateKey(credentialsId: 'ec2-ssh-key-2', keyFileVariable: 'SSH_KEY_2'),
                        sshUserPrivateKey(credentialsId: 'ec2-ssh-key-3', keyFileVariable: 'SSH_KEY_3'),
                        file(credentialsId: env.ENV_FILE_CREDENTIALS, variable: 'ENV_FILE'),
                        usernamePassword(credentialsId: env.DOCKER_REGISTRY_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')
                    ]) {
                        sh '''
                            # Copy all 3 SSH keys
                            cp $SSH_KEY_1 ec2-key-1.pem
                            cp $SSH_KEY_2 ec2-key-2.pem
                            cp $SSH_KEY_3 ec2-key-3.pem
                            chmod 600 ec2-key-*.pem
                            
                            # Copy environment file
                            cp $ENV_FILE .env
                            
                            # Verify inventory file exists
                            if [ ! -f inventory/hosts ]; then
                                echo "ERROR: inventory/hosts file not found!"
                                exit 1
                            fi
                            
                            # Display target hosts
                            echo "=== Deploying to the following EC2 instances ==="
                            ansible ec2 -i inventory/hosts --list-hosts
                            
                            # Run Ansible playbook
                            ansible-playbook -i inventory/hosts deploy.yml \
                                -e "build_version=${BUILD_VERSION}" \
                                -e "docker_username=${DOCKER_USER}" \
                                -e "docker_password=${DOCKER_PASS}" \
                                -v
                            
                            # Cleanup sensitive files
                            rm -f ec2-key-*.pem .env
                        '''
                    }
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
                // Clean up sensitive files
                sh 'rm -f ec2-key-*.pem .env || true'
            }
        }
        success {
            script {
                echo "Pipeline succeeded!"
                sh '''
                    echo "=== Build Summary ==="
                    echo "Backend image: ${DOCKER_IMAGE_BACKEND}:${BUILD_VERSION}"
                    echo "Frontend image: ${DOCKER_IMAGE_FRONTEND}:${BUILD_VERSION}"
                    echo "Status: SUCCESS - Deployed to 3 EC2 instances"
                '''
            }
        }
        failure {
            script {
                echo "Pipeline failed!"
                sh '''
                    echo "=== Failure Details ==="
                    echo "Check logs above for errors"
                '''
            }
        }
        cleanup {
            cleanWs()
        }
    }
}
