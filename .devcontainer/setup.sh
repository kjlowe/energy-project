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

echo "--------------------------------------"
echo "Next steps. Remove extensions that may cause conflicts with Copilot."
echo "1. CONTROL + \` (top left key) to open the terminal."
echo "2. Run the script: ./remove-extentions-causing-copilot-conflict.sh"


