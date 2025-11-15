#!/bin/bash

set -e

echo "Removing unwanted Python extensions..."

code --uninstall-extension ms-python.vscode-pylance --force || true
code --uninstall-extension ms-python.debugpy --force || true

echo "--------------------------------------"
echo "Next steps. Reload the window to remove the extensions that may cause conflicts with Copilot."
echo "1. CMD + SHIFT + P."
echo "2. Reload Window."