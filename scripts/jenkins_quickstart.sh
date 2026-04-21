#!/bin/bash

# Quick Start Script for Jenkins setup
# This script helps get Jenkins running quickly for development/testing

set -e

echo "=========================================="
echo "  SecureSense Jenkins Quick Start"
echo "=========================================="
echo ""

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed"
        exit 1
    fi
    
    echo "✓ Docker is installed: $(docker --version)"
    
    if ! command -v kubectl &> /dev/null; then
        echo "Warning: kubectl is not installed (optional for dev setup)"
    else
        echo "✓ kubectl is installed: $(kubectl version --client --short 2>/dev/null || echo 'found')"
    fi
}

# Start Jenkins using Docker
start_jenkins_docker() {
    echo ""
    echo "Starting Jenkins in Docker..."
    
    # Check if Jenkins container exists
    if docker ps -a --format '{{.Names}}' | grep -q '^jenkins$'; then
        echo "Removing existing Jenkins container..."
        docker stop jenkins || true
        docker rm jenkins || true
    fi
    
    # Run Jenkins
    docker run --name jenkins \
        -d \
        -p 8080:8080 \
        -p 50000:50000 \
        -v jenkins_home:/var/jenkins_home \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -e JAVA_OPTS="-Xmx2g" \
        jenkins/jenkins:lts-jdk11
    
    echo "✓ Jenkins started in Docker"
    echo ""
    echo "Getting initial admin password (this may take a minute)..."
    sleep 10
    
    while [ ! -f "$(docker inspect -f '{{.Mounts}}' jenkins | grep jenkins_home | cut -d' ' -f3)"/secrets/initialAdminPassword 2>/dev/null ]; do
        echo "Waiting for Jenkins to fully initialize..."
        sleep 5
    done
    
    INIT_PASSWD=$(docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword)
    echo ""
    echo "=========================================="
    echo "Jenkins is running!"
    echo "=========================================="
    echo "URL: http://localhost:8080"
    echo "Initial Admin Password: $INIT_PASSWD"
    echo ""
    echo "After login:"
    echo "1. Go to Manage Jenkins → Manage Plugins"
    echo "2. Install: Docker Pipeline, Kubernetes, Pipeline Stage View"
    echo "3. Go to Manage Jenkins → Manage Credentials"
    echo "4. Add your Docker Registry and Kubernetes credentials"
    echo "=========================================="
}

# Start Kubernetes cluster (for testing)
start_k3s() {
    echo ""
    echo "Starting local Kubernetes cluster with k3s..."
    
    if ! command -v k3s &> /dev/null; then
        echo "Installing k3s..."
        curl -sfL https://get.k3s.io | sh -
    fi
    
    sudo k3s server &
    
    echo "Waiting for k3s to be ready..."
    sleep 5
    
    export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
    
    echo "✓ k3s cluster started"
    kubectl get nodes
}

# Setup script instructions
show_setup_instructions() {
    echo ""
    echo "=========================================="
    echo "  Manual Jenkins Configuration"
    echo "=========================================="
    echo ""
    echo "1. Open Jenkins UI: http://localhost:8080"
    echo ""
    echo "2. Configure Credentials:"
    echo "   - Go to Manage Jenkins → Manage Credentials"
    echo "   - Add Docker Registry credentials"
    echo "   - Add Kubernetes kubeconfig"
    echo ""
    echo "3. Create Pipeline Job:"
    echo "   - New Item → Multibranch Pipeline"
    echo "   - Set Branch Sources to your Git repo"
    echo "   - Script Path: Jenkinsfile"
    echo ""
    echo "4. Trigger Pipeline:"
    echo "   - Push to main/develop branch, or"
    echo "   - Manually build from Jenkins UI"
    echo ""
    echo "For detailed setup, see KUBERNETES_JENKINS_GUIDE.md"
}

# Cleanup function
cleanup() {
    echo ""
    echo "Cleanup function (not executed by default):"
    echo "To stop Jenkins: docker stop jenkins"
    echo "To remove Jenkins: docker rm jenkins"
    echo "To remove volume: docker volume rm jenkins_home"
}

# Main execution
main() {
    check_prerequisites
    
    echo ""
    echo "What would you like to do?"
    echo "1) Start Jenkins in Docker (Recommended for dev)"
    echo "2) Start local Kubernetes with k3s"
    echo "3) Show configuration instructions"
    echo "4) All of the above"
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            start_jenkins_docker
            show_setup_instructions
            ;;
        2)
            start_k3s
            ;;
        3)
            show_setup_instructions
            ;;
        4)
            start_jenkins_docker
            show_setup_instructions
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
    
    cleanup
}

# Run main function
main
