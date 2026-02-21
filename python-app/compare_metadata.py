"""
Verify that billing_structure_metadata.json and billing_structure_metadata.json.new
have the same content (accounting for structural differences).

This script compares the old array format with the new dict format:
- Old: "GenerationMeter" array with field_name keys
- New: "GENERATION_METER" dict with field_name as keys
- Verifies all units, where_found arrays, and TOU fields preserved
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / 'data'
OLD_FILE = DATA_DIR / 'billing_structure_metadata.json'
NEW_FILE = DATA_DIR / 'billing_structure_metadata.json.new'


def verify_contents_match(old_metadata: Dict[str, Any], new_metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verify that old and new metadata files contain the same data.

    Args:
        old_metadata: Original metadata (array format with GenerationMeter/BenefitMeter)
        new_metadata: New metadata (dict format with GENERATION_METER/BENEFIT_METER)

    Returns:
        Dictionary with verification results
    """
    results = {
        'passed': True,
        'checks': [],
        'errors': []
    }

    def add_check(description: str, passed: bool):
        results['checks'].append({'description': description, 'passed': passed})
        if not passed:
            results['passed'] = False
            results['errors'].append(description)

    # Check 1: Both files have 2 meter types
    old_has_two = len(old_metadata) == 2
    new_has_two = len(new_metadata) == 2
    add_check('Both files have 2 meter types', old_has_two and new_has_two)

    # Check 2: Old has GenerationMeter, new has GENERATION_METER
    old_has_gen = 'GenerationMeter' in old_metadata
    new_has_gen = 'GENERATION_METER' in new_metadata
    add_check('GenerationMeter -> GENERATION_METER mapping exists', old_has_gen and new_has_gen)

    # Check 3: Old has BenefitMeter, new has BENEFIT_METER
    old_has_ben = 'BenefitMeter' in old_metadata
    new_has_ben = 'BENEFIT_METER' in new_metadata
    add_check('BenefitMeter -> BENEFIT_METER mapping exists', old_has_ben and new_has_ben)

    if not (old_has_gen and new_has_gen and old_has_ben and new_has_ben):
        return results

    # Track statistics
    unit_preserved = 0
    unit_total = 0
    where_found_preserved = 0
    where_found_total = 0
    tou_preserved = 0
    tou_total = 0
    kevins_code_preserved = 0
    kevins_code_total = 0
    kevins_code_mismatches = []
    where_found_mismatches = []

    # Verify GENERATION_METER
    old_gen = old_metadata['GenerationMeter']
    new_gen = new_metadata['GENERATION_METER']

    old_gen_count = len(old_gen)
    new_gen_count = len(new_gen)
    add_check(f'Same number of fields in GENERATION_METER: {old_gen_count}', old_gen_count == new_gen_count)

    # Check each field in GENERATION_METER
    for old_field in old_gen:
        field_name = old_field['field_name']

        # Field exists in new format
        if field_name not in new_gen:
            add_check(f'Field exists in new format: {field_name}', False)
            continue

        new_field = new_gen[field_name]

        # Verify where_found preserved - check explicitly
        if 'where_found' in old_field:
            where_found_total += 1

            # Check if new field has where_found
            if 'where_found' not in new_field:
                where_found_mismatches.append(
                    f"GENERATION_METER.{field_name}: missing where_found in new format"
                )
            else:
                # Check array lengths match
                old_sources = old_field['where_found']
                new_sources = new_field['where_found']

                if len(old_sources) != len(new_sources):
                    where_found_mismatches.append(
                        f"GENERATION_METER.{field_name}: where_found array length mismatch "
                        f"(old: {len(old_sources)}, new: {len(new_sources)})"
                    )

                # Check each source explicitly
                all_sources_match = True
                for idx, old_source in enumerate(old_sources):
                    # Find matching source in new field
                    source_found = False
                    for new_source in new_sources:
                        if (new_source.get('where_from') == old_source.get('where_from') and
                            new_source.get('where_on_pdf') == old_source.get('where_on_pdf') and
                            new_source.get('kevins_number_code') == old_source.get('kevins_number_code')):
                            source_found = True
                            break

                    if not source_found:
                        all_sources_match = False
                        where_found_mismatches.append(
                            f"GENERATION_METER.{field_name}: source[{idx}] not found - "
                            f"where_from={old_source.get('where_from')}, "
                            f"where_on_pdf={old_source.get('where_on_pdf')}, "
                            f"code={old_source.get('kevins_number_code')}"
                        )
                    else:
                        # Track kevins_number_code if present
                        if 'kevins_number_code' in old_source:
                            kevins_code_total += 1
                            kevins_code_preserved += 1

                if all_sources_match and len(old_sources) == len(new_sources):
                    where_found_preserved += 1

        # Verify unit preserved
        if 'unit' in old_field:
            unit_total += 1
            if 'unit' in new_field and old_field['unit'] == new_field['unit']:
                unit_preserved += 1

        # Verify TOU subfields preserved
        for tou_key in ['peak', 'off_peak', 'total']:
            if tou_key in old_field:
                tou_total += 1
                if tou_key in new_field:
                    old_tou = old_field[tou_key]
                    new_tou = new_field[tou_key]

                    tou_match = True

                    # Check unit
                    if 'unit' in old_tou and old_tou.get('unit') != new_tou.get('unit'):
                        tou_match = False

                    # Check where_found explicitly for TOU fields
                    if 'where_found' in old_tou:
                        if 'where_found' not in new_tou:
                            tou_match = False
                            where_found_mismatches.append(
                                f"GENERATION_METER.{field_name}.{tou_key}: missing where_found in new format"
                            )
                        else:
                            old_sources = old_tou['where_found']
                            new_sources = new_tou['where_found']

                            if len(old_sources) != len(new_sources):
                                tou_match = False
                                where_found_mismatches.append(
                                    f"GENERATION_METER.{field_name}.{tou_key}: where_found array length mismatch "
                                    f"(old: {len(old_sources)}, new: {len(new_sources)})"
                                )

                            # Check each source
                            for idx, old_source in enumerate(old_sources):
                                source_found = False
                                for new_source in new_sources:
                                    if (new_source.get('where_from') == old_source.get('where_from') and
                                        new_source.get('where_on_pdf') == old_source.get('where_on_pdf') and
                                        new_source.get('kevins_number_code') == old_source.get('kevins_number_code')):
                                        source_found = True
                                        break

                                if not source_found:
                                    tou_match = False
                                    where_found_mismatches.append(
                                        f"GENERATION_METER.{field_name}.{tou_key}: source[{idx}] not found - "
                                        f"where_from={old_source.get('where_from')}, "
                                        f"where_on_pdf={old_source.get('where_on_pdf')}, "
                                        f"code={old_source.get('kevins_number_code')}"
                                    )
                                else:
                                    # Track kevins_number_code if present
                                    if 'kevins_number_code' in old_source:
                                        kevins_code_total += 1
                                        kevins_code_preserved += 1

                    if tou_match:
                        tou_preserved += 1

    # Verify BENEFIT_METER
    old_ben = old_metadata['BenefitMeter']
    new_ben = new_metadata['BENEFIT_METER']

    old_ben_count = len(old_ben)
    new_ben_count = len(new_ben)
    add_check(f'Same number of fields in BENEFIT_METER: {old_ben_count}', old_ben_count == new_ben_count)

    # Check each field in BENEFIT_METER
    for old_field in old_ben:
        field_name = old_field['field_name']

        if field_name not in new_ben:
            add_check(f'Field exists in new format: {field_name} (BENEFIT_METER)', False)
            continue

        new_field = new_ben[field_name]

        # Verify where_found preserved - check explicitly
        if 'where_found' in old_field:
            where_found_total += 1

            # Check if new field has where_found
            if 'where_found' not in new_field:
                where_found_mismatches.append(
                    f"BENEFIT_METER.{field_name}: missing where_found in new format"
                )
            else:
                # Check array lengths match
                old_sources = old_field['where_found']
                new_sources = new_field['where_found']

                if len(old_sources) != len(new_sources):
                    where_found_mismatches.append(
                        f"BENEFIT_METER.{field_name}: where_found array length mismatch "
                        f"(old: {len(old_sources)}, new: {len(new_sources)})"
                    )

                # Check each source explicitly
                all_sources_match = True
                for idx, old_source in enumerate(old_sources):
                    # Find matching source in new field
                    source_found = False
                    for new_source in new_sources:
                        if (new_source.get('where_from') == old_source.get('where_from') and
                            new_source.get('where_on_pdf') == old_source.get('where_on_pdf') and
                            new_source.get('kevins_number_code') == old_source.get('kevins_number_code')):
                            source_found = True
                            break

                    if not source_found:
                        all_sources_match = False
                        where_found_mismatches.append(
                            f"BENEFIT_METER.{field_name}: source[{idx}] not found - "
                            f"where_from={old_source.get('where_from')}, "
                            f"where_on_pdf={old_source.get('where_on_pdf')}, "
                            f"code={old_source.get('kevins_number_code')}"
                        )
                    else:
                        # Track kevins_number_code if present
                        if 'kevins_number_code' in old_source:
                            kevins_code_total += 1
                            kevins_code_preserved += 1

                if all_sources_match and len(old_sources) == len(new_sources):
                    where_found_preserved += 1

        if 'unit' in old_field:
            unit_total += 1
            if 'unit' in new_field and old_field['unit'] == new_field['unit']:
                unit_preserved += 1

        for tou_key in ['peak', 'off_peak', 'total']:
            if tou_key in old_field:
                tou_total += 1
                if tou_key in new_field:
                    old_tou = old_field[tou_key]
                    new_tou = new_field[tou_key]

                    tou_match = True

                    # Check unit
                    if 'unit' in old_tou and old_tou.get('unit') != new_tou.get('unit'):
                        tou_match = False

                    # Check where_found explicitly for TOU fields
                    if 'where_found' in old_tou:
                        if 'where_found' not in new_tou:
                            tou_match = False
                            where_found_mismatches.append(
                                f"BENEFIT_METER.{field_name}.{tou_key}: missing where_found in new format"
                            )
                        else:
                            old_sources = old_tou['where_found']
                            new_sources = new_tou['where_found']

                            if len(old_sources) != len(new_sources):
                                tou_match = False
                                where_found_mismatches.append(
                                    f"BENEFIT_METER.{field_name}.{tou_key}: where_found array length mismatch "
                                    f"(old: {len(old_sources)}, new: {len(new_sources)})"
                                )

                            # Check each source
                            for idx, old_source in enumerate(old_sources):
                                source_found = False
                                for new_source in new_sources:
                                    if (new_source.get('where_from') == old_source.get('where_from') and
                                        new_source.get('where_on_pdf') == old_source.get('where_on_pdf') and
                                        new_source.get('kevins_number_code') == old_source.get('kevins_number_code')):
                                        source_found = True
                                        break

                                if not source_found:
                                    tou_match = False
                                    where_found_mismatches.append(
                                        f"BENEFIT_METER.{field_name}.{tou_key}: source[{idx}] not found - "
                                        f"where_from={old_source.get('where_from')}, "
                                        f"where_on_pdf={old_source.get('where_on_pdf')}, "
                                        f"code={old_source.get('kevins_number_code')}"
                                    )
                                else:
                                    # Track kevins_number_code if present
                                    if 'kevins_number_code' in old_source:
                                        kevins_code_total += 1
                                        kevins_code_preserved += 1

                    if tou_match:
                        tou_preserved += 1

    # Calculate percentages
    unit_pct = (unit_preserved / unit_total * 100) if unit_total > 0 else 100
    where_found_pct = (where_found_preserved / where_found_total * 100) if where_found_total > 0 else 100
    tou_pct = (tou_preserved / tou_total * 100) if tou_total > 0 else 100
    kevins_code_pct = (kevins_code_preserved / kevins_code_total * 100) if kevins_code_total > 0 else 100

    add_check(f'All unit values preserved: {unit_pct:.0f}%', unit_pct == 100)
    add_check(f'All where_found arrays preserved: {where_found_pct:.0f}%', where_found_pct == 100)
    add_check(f'All TOU subfields preserved: {tou_pct:.0f}%', tou_pct == 100)
    add_check(f'All kevins_number_code values preserved: {kevins_code_pct:.0f}% ({kevins_code_preserved}/{kevins_code_total})',
              kevins_code_pct == 100)

    # Add mismatch details to results
    results['kevins_code_mismatches'] = kevins_code_mismatches
    results['where_found_mismatches'] = where_found_mismatches

    return results


def main():
    """Run the metadata comparison."""
    print("=" * 60)
    print("Billing Metadata Comparison Script")
    print("=" * 60)
    print()

    # Check files exist
    if not OLD_FILE.exists():
        print(f"❌ Error: File not found: {OLD_FILE}")
        return False

    if not NEW_FILE.exists():
        print(f"❌ Error: File not found: {NEW_FILE}")
        return False

    # Load both files
    with open(OLD_FILE, 'r') as f:
        old_metadata = json.load(f)

    with open(NEW_FILE, 'r') as f:
        new_metadata = json.load(f)

    print(f"✓ Loaded {OLD_FILE.name}")
    print(f"  - GenerationMeter: {len(old_metadata.get('GenerationMeter', []))} fields")
    print(f"  - BenefitMeter: {len(old_metadata.get('BenefitMeter', []))} fields")
    print()

    print(f"✓ Loaded {NEW_FILE.name}")
    print(f"  - GENERATION_METER: {len(new_metadata.get('GENERATION_METER', {}))} fields")
    print(f"  - BENEFIT_METER: {len(new_metadata.get('BENEFIT_METER', {}))} fields")
    print()

    # Verify
    print("Running verification...")
    print()
    verification = verify_contents_match(old_metadata, new_metadata)

    for check in verification['checks']:
        symbol = "✓" if check['passed'] else "❌"
        print(f"  {symbol} {check['description']}")

    print()

    if not verification['passed']:
        print("=" * 60)
        print("❌ VERIFICATION FAILED")
        print("=" * 60)
        print()
        print("Errors found:")
        for error in verification['errors']:
            print(f"  - {error}")
        print()

        # Report where_found mismatches if any
        if verification.get('where_found_mismatches'):
            print("Where Found Mismatches:")
            for mismatch in verification['where_found_mismatches']:
                print(f"  - {mismatch}")
            print()

        # Report kevins_number_code mismatches if any
        if verification.get('kevins_code_mismatches'):
            print("Kevin's Number Code Mismatches:")
            for mismatch in verification['kevins_code_mismatches']:
                print(f"  - {mismatch}")
            print()

        return False

    print("=" * 60)
    print("✓ VERIFICATION PASSED")
    print("=" * 60)
    print()
    print("Both files contain the same data!")

    # Report kevins_number_code summary
    if verification.get('kevins_code_mismatches') is not None:
        # Count total codes found
        total_codes = sum(1 for check in verification['checks']
                         if 'kevins_number_code values preserved' in check['description'])
        if total_codes > 0:
            print()
            # Extract the count from the check description
            for check in verification['checks']:
                if 'kevins_number_code values preserved' in check['description']:
                    print(f"✓ {check['description']}")
    print()

    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
