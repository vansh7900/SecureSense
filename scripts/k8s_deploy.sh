#!/bin/bash

# Kubernetes Initial Deployment Script
# This script sets up the Kubernetes cluster with all necessary resources

set -e

NAMESPACE="${NAMESPACE:-securesense}"
DEPLOYMENT_ENV="${DEPLOYMENT_ENV:-dev}"
REGISTRY="${REGISTRY:-docker.io}"

echo "=========================================="
echo "  Kubernetes Initial Deployment Script"
echo "=========================================="
echo "Namespace: $NAMESPACE"
echo "Environment: $DEPLOYMENT_ENV"
echo "Registry: $REGISTRY"
echo ""

# Check kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check cluster connection
echo "Checking Kubernetes cluster connection..."
kubectl cluster-info
echo ""

# Create namespace
echo "Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Label namespace
kubectl label namespace $NAMESPACE environment=$DEPLOYMENT_ENV --overwrite=true

# Apply base configurations
echo "Applying namespace configuration..."
kubectl apply -f k8s/01-namespace.yaml

echo "Applying ConfigMaps..."
kubectl apply -f k8s/02-configmap.yaml

echo "Applying Secrets..."
kubectl apply -f k8s/03-secrets.yaml

# Create service accounts
echo "Creating service accounts..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: securesense-backend
  namespace: $NAMESPACE
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: securesense-frontend
  namespace: $NAMESPACE
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins-deployer
  namespace: $NAMESPACE
EOF

# Create RBAC roles
echo "Creating RBAC roles..."
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: deployment-role
  namespace: $NAMESPACE
rules:
- apiGroups: ["apps"]
  resources: ["deployments", "statefulsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: jenkins-deployer-binding
  namespace: $NAMESPACE
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: deployment-role
subjects:
- kind: ServiceAccount
  name: jenkins-deployer
  namespace: $NAMESPACE
EOF

# Apply deployments
echo "Applying Backend Deployment..."
kubectl apply -f k8s/04-backend-deployment.yaml

echo "Applying Frontend Deployment..."
kubectl apply -f k8s/05-frontend-deployment.yaml

# Apply services
echo "Applying Services..."
kubectl apply -f k8s/06-services.yaml

# Apply HPA if exists
if [ -f "k8s/07-hpa.yaml" ]; then
    echo "Applying Horizontal Pod Autoscaler..."
    kubectl apply -f k8s/07-hpa.yaml
fi

# Apply Ingress if exists
if [ -f "k8s/08-ingress.yaml" ]; then
    echo "Applying Ingress..."
    kubectl apply -f k8s/08-ingress.yaml
fi

# Wait for deployments
echo ""
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/securesense-backend -n $NAMESPACE --timeout=5m || true
kubectl rollout status deployment/securesense-frontend -n $NAMESPACE --timeout=5m || true

# Print deployment status
echo ""
echo "=========================================="
echo "  Deployment Status"
echo "=========================================="
kubectl get all -n $NAMESPACE
echo ""
echo "Services:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Pods:"
kubectl get pods -n $NAMESPACE -o wide
echo ""
echo "=========================================="
echo "Deployment complete!"
echo "=========================================="
