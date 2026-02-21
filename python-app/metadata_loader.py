"""
Metadata loader module for billing structure metadata.

This module provides simple loading and caching of the billing metadata JSON file.
The metadata describes units and sources for all billing fields.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

# Module-level cache for metadata
_metadata_cache: Optional[Dict[str, Any]] = None


def load_metadata() -> Dict[str, Any]:
    """
    Load and cache metadata from JSON file.

    The metadata is loaded once per process and cached for subsequent calls.
    Contains metadata for GENERATION_METER and BENEFIT_METER with field units
    and source information.

    Returns:
        Dictionary with metadata structure:
        {
            "GENERATION_METER": {
                "field_name": {
                    "unit": "kWh" or "$",
                    "where_found": [...]
                },
                ...
            },
            "BENEFIT_METER": {...}
        }

    Raises:
        FileNotFoundError: If metadata file doesn't exist
        json.JSONDecodeError: If metadata file is invalid JSON
    """
    global _metadata_cache

    if _metadata_cache is not None:
        return _metadata_cache

    # Determine metadata file path
    current_dir = Path(__file__).parent
    metadata_path = current_dir / 'data' / 'billing_structure_metadata.json.new'

    if not metadata_path.exists():
        raise FileNotFoundError(
            f"Metadata file not found: {metadata_path}. "
            "Run transform_metadata.py to create it."
        )

    # Load metadata
    with open(metadata_path, 'r') as f:
        _metadata_cache = json.load(f)

    return _metadata_cache


def clear_cache():
    """
    Clear the metadata cache.

    Useful for testing or if metadata file is updated during runtime.
    """
    global _metadata_cache
    _metadata_cache = None
