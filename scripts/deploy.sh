#!/bin/bash

# Complete CI/CD Deployment Automation Script
# This script orchestrates the entire deployment process
# Usage: ./deploy.sh [environment] [build] [push] [deploy]

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="${NAMESPACE:-securesense}"
ENVIRONMENT="${1:-dev}"
BUILD="${2:-true}"
PUSH="${3:-false}"
DEPLOY="${4:-true}"
REGISTRY="${REGISTRY:-docker.io}"
PROJECT_NAME="securesense"

# Functions
print_header() {
    echo -e "${BLUE}=========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}=========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    declare -a tools=("docker" "kubectl" "git")
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            print_error "$tool is not installed"
        else
            print_success "$tool is installed"
        fi
    done
}

# Build images
build_images() {
    print_header "Building Docker Images"
    
    echo "Building Backend image..."
    docker build \
        -f Dockerfile.backend \
        -t ${PROJECT_NAME}-backend:${ENVIRONMENT} \
        -t ${PROJECT_NAME}-backend:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        . || print_error "Backend build failed"
    print_success "Backend image built"
    
    echo "Building Frontend image..."
    docker build \
        -f Dockerfile.frontend \
        -t ${PROJECT_NAME}-frontend:${ENVIRONMENT} \
        -t ${PROJECT_NAME}-frontend:latest \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        . || print_error "Frontend build failed"
    print_success "Frontend image built"
}

# Push images to registry
push_images() {
    print_header "Pushing Images to Registry"
    
    echo "Logging in to registry..."
    # Assumes credentials are already configured in ~/.docker/config.json
    # Or set REGISTRY_USERNAME and REGISTRY_PASSWORD environment variables
    
    if [ -z "$REGISTRY_USERNAME" ]; then
        print_warning "REGISTRY_USERNAME not set, assuming credentials are configured"
    fi
    
    echo "Pushing Backend image..."
    docker tag ${PROJECT_NAME}-backend:${ENVIRONMENT} ${REGISTRY}/${PROJECT_NAME}-backend:${ENVIRONMENT}
    docker tag ${PROJECT_NAME}-backend:latest ${REGISTRY}/${PROJECT_NAME}-backend:latest
    docker push ${REGISTRY}/${PROJECT_NAME}-backend:${ENVIRONMENT} || print_error "Failed to push backend image"
    docker push ${REGISTRY}/${PROJECT_NAME}-backend:latest || print_error "Failed to push backend image"
    print_success "Backend image pushed"
    
    echo "Pushing Frontend image..."
    docker tag ${PROJECT_NAME}-frontend:${ENVIRONMENT} ${REGISTRY}/${PROJECT_NAME}-frontend:${ENVIRONMENT}
    docker tag ${PROJECT_NAME}-frontend:latest ${REGISTRY}/${PROJECT_NAME}-frontend:latest
    docker push ${REGISTRY}/${PROJECT_NAME}-frontend:${ENVIRONMENT} || print_error "Failed to push frontend image"
    docker push ${REGISTRY}/${PROJECT_NAME}-frontend:latest || print_error "Failed to push frontend image"
    print_success "Frontend image pushed"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    print_header "Deploying to Kubernetes [$ENVIRONMENT]"
    
    # Verify cluster connection
    print_info "Verifying Kubernetes cluster connection..."
    kubectl cluster-info || print_error "Cannot connect to Kubernetes cluster"
    print_success "Connected to Kubernetes cluster"
    
    # Create namespace
    print_info "Setting up namespace..."
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f - || true
    kubectl label namespace ${NAMESPACE} environment=${ENVIRONMENT} --overwrite=true || true
    print_success "Namespace ready"
    
    # Apply configurations
    print_info "Applying configurations..."
    kubectl apply -f k8s/01-namespace.yaml || print_error "Failed to apply namespace config"
    kubectl apply -f k8s/02-configmap.yaml || print_error "Failed to apply configmap"
    kubectl apply -f k8s/03-secrets.yaml || print_error "Failed to apply secrets"
    print_success "Configurations applied"
    
    # Deploy backend
    print_info "Deploying backend..."
    if kubectl get deployment securesense-backend -n ${NAMESPACE} &> /dev/null; then
        kubectl set image deployment/securesense-backend \
            backend=${REGISTRY}/${PROJECT_NAME}-backend:${ENVIRONMENT} \
            -n ${NAMESPACE}
    else
        kubectl apply -f k8s/04-backend-deployment.yaml
    fi
    print_success "Backend deployment updated"
    
    # Deploy frontend
    print_info "Deploying frontend..."
    if kubectl get deployment securesense-frontend -n ${NAMESPACE} &> /dev/null; then
        kubectl set image deployment/securesense-frontend \
            frontend=${REGISTRY}/${PROJECT_NAME}-frontend:${ENVIRONMENT} \
            -n ${NAMESPACE}
    else
        kubectl apply -f k8s/05-frontend-deployment.yaml
    fi
    print_success "Frontend deployment updated"
    
    # Apply services
    print_info "Applying services..."
    kubectl apply -f k8s/06-services.yaml || print_error "Failed to apply services"
    
    # Apply HPA if exists
    if [ -f "k8s/07-hpa.yaml" ]; then
        kubectl apply -f k8s/07-hpa.yaml && print_success "HPA applied" || print_warning "HPA apply failed"
    fi
    
    # Apply Ingress if exists
    if [ -f "k8s/08-ingress.yaml" ]; then
        kubectl apply -f k8s/08-ingress.yaml && print_success "Ingress applied" || print_warning "Ingress apply failed"
    fi
    
    print_success "Services applied"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    print_info "Waiting for deployments to be ready..."
    kubectl rollout status deployment/securesense-backend -n ${NAMESPACE} --timeout=5m || true
    kubectl rollout status deployment/securesense-frontend -n ${NAMESPACE} --timeout=5m || true
    
    echo ""
    print_info "Deployment Status:"
    kubectl get all -n ${NAMESPACE}
    
    echo ""
    print_info "Pods Status:"
    kubectl get pods -n ${NAMESPACE} -o wide
    
    echo ""
    print_info "Services:"
    kubectl get svc -n ${NAMESPACE}
}

# Main execution
main() {
    print_header "SecureSense CI/CD Deployment Script"
    echo "Namespace: ${NAMESPACE}"
    echo "Environment: ${ENVIRONMENT}"
    echo "Registry: ${REGISTRY}"
    echo ""
    
    check_prerequisites
    
    if [ "$BUILD" = "true" ]; then
        build_images
    fi
    
    if [ "$PUSH" = "true" ]; then
        push_images
    fi
    
    if [ "$DEPLOY" = "true" ]; then
        deploy_to_k8s
        verify_deployment
    fi
    
    print_header "Deployment Complete!"
    print_success "All Services Deployed Successfully"
}

# Show usage
show_usage() {
    echo "Usage: $0 [environment] [build] [push] [deploy]"
    echo ""
    echo "Arguments:"
    echo "  environment: dev, staging, or production (default: dev)"
    echo "  build:       true/false - Build Docker images (default: true)"
    echo "  push:        true/false - Push to registry (default: false)"
    echo "  deploy:      true/false - Deploy to Kubernetes (default: true)"
    echo ""
    echo "Examples:"
    echo "  $0 dev true false true      # Build locally, don't push, deploy to dev"
    echo "  $0 production true true true # Build, push, deploy to production"
}

# Run main function
main
