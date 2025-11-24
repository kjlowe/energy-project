#!/bin/bash

# Update package list
apt-get update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Install protobuf
apt-get install -y protobuf-compiler

# Install sqllite3
apt-get install -y sqlite3

# Install Python requirements
pip install -r requirements.txt

# Setup Python app virtual environment
echo "Setting up Python app virtual environment..."
cd /workspace/python-app

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python -m venv .venv
    echo "✅ Virtual environment created"
fi

# Install Python app dependencies from requirements.txt
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

echo "✅ Python app dependencies installed"

# Return to workspace root
cd /workspace

# Verify installations
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Python packages installed successfully"

echo "--------------------------------------"
echo "Next steps. Remove extensions that may cause conflicts with Copilot."
echo "1. CONTROL + \` (top left key) to open the terminal."
echo "2. Run the script: ./remove-extentions-causing-copilot-conflict.sh"


