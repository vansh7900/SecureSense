#!/bin/bash

# Jenkins Setup Script for SecureSense Pipeline
# This script configures Jenkins with necessary credentials and plugins

set -e

JENKINS_URL="${JENKINS_URL:-http://localhost:8080}"
JENKINS_USER="${JENKINS_USER:-admin}"
JENKINS_TOKEN="${JENKINS_TOKEN}"

echo "=========================================="
echo "  SecureSense Jenkins Configuration Script"
echo "=========================================="
echo "Jenkins URL: $JENKINS_URL"
echo "Jenkins User: $JENKINS_USER"
echo ""

# Check if Jenkins CLI is available
if ! command -v jenkins-cli &> /dev/null; then
    echo "Downloading Jenkins CLI..."
    wget -q "$JENKINS_URL/jnlpJars/jenkins-cli.jar" -O jenkins-cli.jar
fi

JENKINS_CLI="java -jar jenkins-cli.jar -s $JENKINS_URL -auth $JENKINS_USER:$JENKINS_TOKEN"

echo "Installing required plugins..."

# Install plugins
PLUGINS=(
    "docker-plugin"
    "docker-workflow"
    "kubernetes"
    "kubernetes-cli"
    "pipeline-model-definition"
    "pipeline-stage-view"
    "git"
    "github"
    "slack"
    "cobertura"
    "junit"
    "htmlpublisher"
    "timestamper"
    "log-parser"
    "email-ext"
    "artifactory"
    "sonar"
)

for plugin in "${PLUGINS[@]}"; do
    echo "Installing plugin: $plugin"
    $JENKINS_CLI install-plugin "$plugin" -deploy || echo "Plugin $plugin already installed or failed"
done

echo ""
echo "Creating credentials..."

# Create Docker Registry Credential (requires XML file)
cat > docker-registry-cred.xml <<EOF
<com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>docker-registry-credentials</id>
  <description>Docker Registry Credentials</description>
  <username>your-registry-username</username>
  <password>your-registry-password</password>
</com.cloudbees.plugins.credentials.impl.UsernamePasswordCredentialsImpl>
EOF

# Create Docker Registry URL Credential
cat > docker-registry-url-cred.xml <<EOF
<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>docker-registry-url</id>
  <description>Docker Registry URL</description>
  <secret>your-registry-url.com</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
EOF

# Create Kubernetes Cluster Credential
cat > k8s-cluster-cred.xml <<EOF
<org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>k8s-cluster-url</id>
  <description>Kubernetes Cluster URL</description>
  <secret>https://your-k8s-cluster:6443</secret>
</org.jenkinsci.plugins.plaincredentials.impl.StringCredentialsImpl>
EOF

# Create Kubeconfig Credential (requires file)
cat > kubeconfig-cred.xml <<'EOF'
<com.cloudbees.plugins.credentials.impl.FileCredentialsImpl>
  <scope>GLOBAL</scope>
  <id>kubeconfig</id>
  <description>Kubernetes Config</description>
  <fileName>kubeconfig</fileName>
  <secretBytes></secretBytes>
</com.cloudbees.plugins.credentials.impl.FileCredentialsImpl>
EOF

echo ""
echo "To complete the setup, follow these steps:"
echo ""
echo "1. Copy your kubeconfig file:"
echo "   kubectl config view --raw > /tmp/kubeconfig"
echo ""
echo "2. Add credentials via Jenkins UI at:"
echo "   $JENKINS_URL/credentials/store/system/domain/_/newCredentials"
echo ""
echo "3. Create a Multibranch Pipeline job pointing to your Git repository"
echo ""
echo "4. Set environment variables in Jenkins:"
echo "   - DOCKER_REGISTRY_URL"
echo "   - DOCKER_REGISTRY_USERNAME"
echo "   - DOCKER_REGISTRY_PASSWORD"
echo "   - K8S_CLUSTER_URL"
echo ""
echo "=========================================="
echo "Setup script completed!"
echo "=========================================="
