#!/usr/bin/env python3
"""
Fix remaining 14 onclick handlers in v18
These are complex cases that need special handling
"""

import re

def fix_remaining_onclick(html_content):
    """Fix all remaining onclick handlers"""

    # 1. Line 1440: Multiple function calls
    html_content = html_content.replace(
        'onclick="resetAllFilters(); closeMobileFilters();"',
        'data-action="resetAndCloseMobileFilters"'
    )

    # 2. Line 7581: loadFilterPreset with dynamic name + close modal
    pattern = r"onclick=\"loadFilterPreset\('([^']+)'\); document\.getElementById\('presetModal'\)\.remove\(\);\""
    replacement = r'data-action="loadFilterPresetAndClose" data-preset-name="\1"'
    html_content = re.sub(pattern, replacement, html_content)

    # 3. Line 7596: Close preset modal
    html_content = html_content.replace(
        'onclick="document.getElementById(\'presetModal\').remove();"',
        'data-action="removeModal" data-modal-id="presetModal"'
    )

    # 4. Line 8433: showCalendarDayDetail with year, month, day parameters
    pattern = r'onclick="showCalendarDayDetail\((\d+), (\d+), (\d+)\)"'
    replacement = r'data-action="showCalendarDayDetail" data-year="\1" data-month="\2" data-day="\3"'
    html_content = re.sub(pattern, replacement, html_content)

    # 5. Line 8994: Order card click with filteredData.indexOf(d)
    # This is complex - need to add data-index attribute during rendering
    pattern = r'onclick="showOrderProcessDetail\((\$\{filteredData\.indexOf\(d\)\})\)"'
    replacement = r'data-action="showOrderProcessDetail" data-index="${filteredData.indexOf(d)}"'
    html_content = re.sub(pattern, replacement, html_content)

    # 6. Line 9057: Table row onclick with index parameter
    pattern = r'onclick="showOrderProcessDetail\((\$\{index\})\)"'
    replacement = r'data-action="showOrderProcessDetail" data-index="${index}"'
    html_content = re.sub(pattern, replacement, html_content)

    # 7. Line 9360: Table row with closeOrderModal + showOrderProcessDetail
    pattern = r'onclick="closeOrderModal\(\); showOrderProcessDetail\((\$\{globalIndex\})\)"'
    replacement = r'data-action="closeAndShowOrderDetail" data-index="${globalIndex}"'
    html_content = re.sub(pattern, replacement, html_content)

    # 8. Line 10115: exportToExcel + remove modal
    html_content = html_content.replace(
        'onclick="exportToExcel(); document.getElementById(\'exportModal\').remove();"',
        'data-action="exportToExcelAndClose"'
    )

    # 9. Line 10123: exportToExcelMultiSheet('month') + remove modal
    html_content = html_content.replace(
        'onclick="exportToExcelMultiSheet(\'month\'); document.getElementById(\'exportModal\').remove();"',
        'data-action="exportToExcelMultiSheetAndClose" data-sheet-type="month"'
    )

    # 10. Line 10131: exportToExcelMultiSheet('factory') + remove modal
    html_content = html_content.replace(
        'onclick="exportToExcelMultiSheet(\'factory\'); document.getElementById(\'exportModal\').remove();"',
        'data-action="exportToExcelMultiSheetAndClose" data-sheet-type="factory"'
    )

    # 11. Line 10144: remove modal + showColumnSelection
    html_content = html_content.replace(
        'onclick="document.getElementById(\'exportModal\').remove(); showColumnSelection();"',
        'data-action="closeModalAndShowColumnSelection" data-modal-id="exportModal"'
    )

    # 12. Line 10155: exportToCSV + remove modal
    html_content = html_content.replace(
        'onclick="exportToCSV(); document.getElementById(\'exportModal\').remove();"',
        'data-action="exportToCSVAndClose"'
    )

    # 13. Line 10159: exportToPDF + remove modal
    html_content = html_content.replace(
        'onclick="exportToPDF(); document.getElementById(\'exportModal\').remove();"',
        'data-action="exportToPDFAndClose"'
    )

    # 14. Line 10163: Close export modal
    html_content = html_content.replace(
        'onclick="document.getElementById(\'exportModal\').remove();"',
        'data-action="removeModal" data-modal-id="exportModal"'
    )

    return html_content

def add_event_handlers(html_content):
    """Add event handlers for the newly created data-action attributes"""

    # Find the event delegation initialization section
    old_handlers = """            eventDelegator.on('[data-action="showOrderDetail"]', 'click', function(e) {
                const vendor = EventDelegator.getData(this, 'vendor');
                showOrderDetail(vendor);
            });

            // Original DOMContentLoaded code continues..."""

    new_handlers = """            eventDelegator.on('[data-action="showOrderDetail"]', 'click', function(e) {
                const vendor = EventDelegator.getData(this, 'vendor');
                showOrderDetail(vendor);
            });

            // V01: Additional event handlers for complex onclick scenarios
            eventDelegator.on('[data-action="resetAndCloseMobileFilters"]', 'click', function(e) {
                resetAllFilters();
                closeMobileFilters();
            });

            eventDelegator.on('[data-action="loadFilterPresetAndClose"]', 'click', function(e) {
                const presetName = EventDelegator.getData(this, 'presetName');
                loadFilterPreset(presetName);
                document.getElementById('presetModal').remove();
            });

            eventDelegator.on('[data-action="removeModal"]', 'click', function(e) {
                const modalId = EventDelegator.getData(this, 'modalId');
                document.getElementById(modalId).remove();
            });

            eventDelegator.on('[data-action="showCalendarDayDetail"]', 'click', function(e) {
                const year = parseInt(EventDelegator.getData(this, 'year'));
                const month = parseInt(EventDelegator.getData(this, 'month'));
                const day = parseInt(EventDelegator.getData(this, 'day'));
                showCalendarDayDetail(year, month, day);
            });

            eventDelegator.on('[data-action="showOrderProcessDetail"]', 'click', function(e) {
                const index = parseInt(EventDelegator.getData(this, 'index'));
                showOrderProcessDetail(index);
            });

            eventDelegator.on('[data-action="closeAndShowOrderDetail"]', 'click', function(e) {
                const index = parseInt(EventDelegator.getData(this, 'index'));
                closeOrderModal();
                showOrderProcessDetail(index);
            });

            eventDelegator.on('[data-action="exportToExcelAndClose"]', 'click', function(e) {
                exportToExcel();
                document.getElementById('exportModal').remove();
            });

            eventDelegator.on('[data-action="exportToExcelMultiSheetAndClose"]', 'click', function(e) {
                const sheetType = EventDelegator.getData(this, 'sheetType');
                exportToExcelMultiSheet(sheetType);
                document.getElementById('exportModal').remove();
            });

            eventDelegator.on('[data-action="closeModalAndShowColumnSelection"]', 'click', function(e) {
                const modalId = EventDelegator.getData(this, 'modalId');
                document.getElementById(modalId).remove();
                showColumnSelection();
            });

            eventDelegator.on('[data-action="exportToCSVAndClose"]', 'click', function(e) {
                exportToCSV();
                document.getElementById('exportModal').remove();
            });

            eventDelegator.on('[data-action="exportToPDFAndClose"]', 'click', function(e) {
                exportToPDF();
                document.getElementById('exportModal').remove();
            });

            // Original DOMContentLoaded code continues..."""

    html_content = html_content.replace(old_handlers, new_handlers)

    return html_content

def main():
    print("Fixing remaining 14 onclick handlers in v18...")

    # Read v18
    with open('rachgia_dashboard_v18.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    # Count before
    before_count = len(re.findall(r'onclick=', html_content))
    print(f"onclick handlers before: {before_count}")

    # Apply fixes
    html_content = fix_remaining_onclick(html_content)
    html_content = add_event_handlers(html_content)

    # Count after
    after_count = len(re.findall(r'onclick=', html_content))
    print(f"onclick handlers after: {after_count}")

    # Write back
    with open('rachgia_dashboard_v18.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"\n✅ Fixed {before_count - after_count} onclick handlers")
    print(f"Remaining: {after_count} (expected: 0)")

if __name__ == '__main__':
    main()
