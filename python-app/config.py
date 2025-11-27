from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

# Database paths
BILLING_DB = DATA_DIR / "billing.db"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)