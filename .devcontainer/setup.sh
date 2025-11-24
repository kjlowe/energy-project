#!/bin/bash

# Update package list
apt-get update

# Instead some command line tools in addition to the base python image
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs
apt-get install -y protobuf-compiler
apt-get install -y sqlite3

# Verify installations
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "protobuf version: $(protoc --version)"
echo "SQLite version: $(sqlite3 --version)"

###### PYTHON APP VENV #########################################

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

###### PYTHON APP VENV #########################################

# Setup Python notebooks virtual environment
echo "Setting up Python notebooks virtual environment..."
cd /workspace/python-notebooks

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    python -m venv .venv
    echo "✅ Notebooks virtual environment created"
fi

# Install Python notebook dependencies
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

echo "✅ Python notebook dependencies installed"

# Return to workspace root
cd /workspace
