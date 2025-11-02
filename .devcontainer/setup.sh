#!/bin/bash

# Update package list
apt-get update

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Install Python requirements
pip install -r requirements.txt

# Verify installations
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "Python packages installed successfully"
