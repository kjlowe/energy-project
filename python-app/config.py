"""Application configuration and shared setup."""
import sys
from pathlib import Path

# Project paths
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
