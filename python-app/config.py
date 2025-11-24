"""Application configuration and shared setup."""
import sys
import os
from pathlib import Path

# Project paths
# Check if running in Docker container
if os.path.exists('/generated/python'):
    # Docker environment
    GENERATED_PYTHON = Path('/generated/python')
    WORKSPACE_ROOT = Path('/app').parent
else:
    # Dev container or local environment
    WORKSPACE_ROOT = Path(__file__).parent.parent
    GENERATED_PYTHON = WORKSPACE_ROOT / "generated" / "python"

DATA_DIR = Path(__file__).parent / "data"

# Add generated code to path
if str(GENERATED_PYTHON) not in sys.path:
    sys.path.insert(0, str(GENERATED_PYTHON))

# Database paths
PEOPLE_DB = DATA_DIR / "people.db"
BILLING_DB = DATA_DIR / "energy_billing.db"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)
