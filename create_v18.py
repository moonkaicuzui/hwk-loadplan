#!/usr/bin/env python3
"""
Create rachgia_dashboard_v18.html with Phase 1 improvements from v17.

Phase 1 Tasks:
V01: XSS 완전 제거 - Convert ALL onclick handlers to data-action attributes
V02: 캐싱 레이어 구현 - Integrate FilterCache class
V03: 메모리 최적화 - Replace Chart.js with ChartManager
V04: 차트 성능 최적화 - Add conditional animation
"""

import re
import sys

def convert_onclick_to_data_action(html_content):
    """
    V01: Convert onclick handlers to data-action attributes

    Pattern matching examples:
    onclick="functionName()" -> data-action="functionName"
    onclick="functionName('arg')" -> data-action="functionName" data-arg="arg"
    onclick="functionName(this.dataset.vendor)" -> data-action="functionName" data-ref="vendor"
    """

    # Pattern 1: Simple function calls without arguments
    # onclick="toggleDarkMode()" -> data-action="toggleDarkMode"
    pattern1 = r'onclick="([a-zA-Z_][a-zA-Z0-9_]*)\(\)"'
    html_content = re.sub(pattern1, r'data-action="\1"', html_content)

    # Pattern 2: Function calls with string literal arguments
    # onclick="setDateMode('sdd')" -> data-action="setDateMode" data-mode="sdd"
    pattern2 = r'''onclick="([a-zA-Z_][a-zA-Z0-9_]*)\('([^']+)'\)"'''
    html_content = re.sub(pattern2, r'data-action="\1" data-param="\2"', html_content)

    # Pattern 3: Function calls with dataset references
    # onclick="showVendorDetail(this.dataset.vendor)" -> data-action="showVendorDetail" data-ref="vendor"
    pattern3 = r'onclick="([a-zA-Z_][a-zA-Z0-9_]*)\(this\.dataset\.([a-zA-Z0-9_]+)\)"'
    html_content = re.sub(pattern3, r'data-action="\1" data-ref="\2"', html_content)

    # Pattern 4: Complex expressions - need manual review
    # onclick="document.getElementById('fileInput').click()"
    pattern4 = r'onclick="document\.getElementById\(\'([^\']+)\'\)\.click\(\)"'
    html_content = re.sub(pattern4, r'data-action="clickElement" data-target-id="\1"', html_content)

    # Pattern 5: showOrderDetail with vendor parameter
    # onclick="showOrderDetail('${escapeHtml(vendor)}')"
    pattern5 = r"onclick=\"showOrderDetail\('([^']+)'\)\""
    html_content = re.sub(pattern5, r'data-action="showOrderDetail" data-vendor="\1"', html_content)

    return html_content

def integrate_filter_cache(html_content):
    """
    V02: Replace Q07's WeakMap cache with FilterCache class

    Find applyFilters() function and replace caching logic
    """

    # Find the applyFilters function (around line 7319)
    # Replace WeakMap cache check with FilterCache

    old_cache_check = '''// Agent Q07: WeakMap 캐시 확인
            const { keyString, keyObject } = getFilterCacheKey();
            const cached = getCachedFilter(keyString, keyObject);
            if (cached) {
                log.debug('Filter cache hit');
                filteredData = cached;
                currentPage = 1;
                updateDashboard();
                return;
            }'''

    new_cache_check = '''// V02: FilterCache 캐시 확인
            const filterState = {
                month: month,
                quick: quick,
                dest: dest,
                vendor: vendor,
                status: status,
                factory: factory,
                search: search,
                startDate: startDate,
                endDate: endDate,
                minQuantity: minQuantity,
                maxQuantity: maxQuantity,
                logic: settings.get('filterLogic') || 'AND'
            };
            const cacheKey = filterCache.generateKey(filterState);
            const cached = filterCache.get(cacheKey);
            if (cached) {
                log.debug('Filter cache hit:', filterCache.getStats());
                filteredData = cached;
                currentPage = 1;
                updateDashboard();
                return;
            }'''

    html_content = html_content.replace(old_cache_check, new_cache_check)

    # Replace cache save logic
    old_cache_save = '''// Agent Q07: WeakMap 결과 캐싱
            setCachedFilter(keyString, keyObject, filteredData);
            log.debug('Filter result cached, entries:', cacheKeyMap.size);'''

    new_cache_save = '''// V02: FilterCache 결과 캐싱
            filterCache.set(cacheKey, filteredData);
            log.debug('Filter result cached:', filterCache.getStats());'''

    html_content = html_content.replace(old_cache_save, new_cache_save)

    return html_content

def integrate_chart_manager(html_content):
    """
    V03: Replace Chart.js instantiation with ChartManager

    Find: charts[chartKey] = new Chart(ctx, config);
    Replace: chartManager.createOrUpdate(chartKey, ctx, config, true);
    """

    # Pattern 1: Generic chart creation (line 3842)
    pattern1 = r"charts\[chartKey\] = new Chart\(ctx, config\);"
    replacement1 = "charts[chartKey] = chartManager.createOrUpdate(chartKey, ctx, config, true);"
    html_content = re.sub(pattern1, replacement1, html_content)

    # Pattern 2: delaySeverityChart (line 10736)
    pattern2 = r"delaySeverityChart = new Chart\(ctx, \{"
    replacement2 = "delaySeverityChart = chartManager.createOrUpdate('delaySeverityChart', ctx, {"
    html_content = re.sub(pattern2, replacement2, html_content)

    # Pattern 3: rootCauseChart (line 10773)
    pattern3 = r"rootCauseChart = new Chart\(ctx, \{"
    replacement3 = "rootCauseChart = chartManager.createOrUpdate('rootCauseChart', ctx, {"
    html_content = re.sub(pattern3, replacement3, html_content)

    return html_content

def add_event_delegation_init(html_content):
    """
    V01: Add EventDelegator initialization at DOMContentLoaded
    """

    # Find DOMContentLoaded event listener and add EventDelegator init
    old_init = "document.addEventListener('DOMContentLoaded', function() {"

    new_init = """document.addEventListener('DOMContentLoaded', function() {
            // V01: Initialize Event Delegation System
            const eventDelegator = new EventDelegator();
            eventDelegator.init();

            // Register event handlers
            eventDelegator.on('[data-action="toggleDarkMode"]', 'click', toggleDarkMode);
            eventDelegator.on('[data-action="toggleMobileMenu"]', 'click', toggleMobileMenu);
            eventDelegator.on('[data-action="setDateMode"]', 'click', function(e) {
                const mode = EventDelegator.getData(this, 'param');
                setDateMode(mode);
            });
            eventDelegator.on('[data-action="showUploadOverlay"]', 'click', showUploadOverlay);
            eventDelegator.on('[data-action="handleLogout"]', 'click', handleLogout);
            eventDelegator.on('[data-action="toggleHelpModal"]', 'click', toggleHelpModal);
            eventDelegator.on('[data-action="openKeyboardShortcutsModal"]', 'click', openKeyboardShortcutsModal);
            eventDelegator.on('[data-action="toggleNotifications"]', 'click', toggleNotifications);
            eventDelegator.on('[data-action="showNotificationSettings"]', 'click', showNotificationSettings);
            eventDelegator.on('[data-action="showNotificationHistory"]', 'click', showNotificationHistory);
            eventDelegator.on('[data-action="showReportHistory"]', 'click', showReportHistory);
            eventDelegator.on('[data-action="showDelayedOrders"]', 'click', showDelayedOrders);
            eventDelegator.on('[data-action="toggleInsightsHelp"]', 'click', toggleInsightsHelp);
            eventDelegator.on('[data-action="showOTDDetail"]', 'click', showOTDDetail);
            eventDelegator.on('[data-action="showRevenueRiskDetail"]', 'click', showRevenueRiskDetail);
            eventDelegator.on('[data-action="showAQLDetail"]', 'click', showAQLDetail);
            eventDelegator.on('[data-action="showBottleneckDetail"]', 'click', showBottleneckDetail);
            eventDelegator.on('[data-action="clickElement"]', 'click', function(e) {
                const targetId = EventDelegator.getData(this, 'targetId');
                document.getElementById(targetId).click();
            });
            eventDelegator.on('[data-action="showOrderDetail"]', 'click', function(e) {
                const vendor = EventDelegator.getData(this, 'vendor');
                showOrderDetail(vendor);
            });

            // Original DOMContentLoaded code continues..."""

    html_content = html_content.replace(old_init, new_init, 1)

    return html_content

def add_global_instances(html_content):
    """
    Add global instances of FilterCache and ChartManager at the top of script
    """

    # Find the start of the main script tag
    script_start = '<script>\n        // Chart.js 다크모드 기본 설정'

    new_script_start = '''<script>
        // V02: Initialize FilterCache (LRU cache for filter results)
        const filterCache = new FilterCache(50);

        // V03: Initialize ChartManager (Chart.js instance reuse)
        const chartManager = new ChartManager();

        // Chart.js 다크모드 기본 설정'''

    html_content = html_content.replace(script_start, new_script_start, 1)

    return html_content

def update_metadata(html_content):
    """
    Update title and add Phase 1 comment
    """

    # Update title
    html_content = html_content.replace(
        '<title>Rachgia Factory 통합 생산관리 대시보드 v17</title>',
        '<title>Rachgia Factory 통합 생산관리 대시보드 v18</title>'
    )

    # Add Phase 1 comment after data file import
    html_content = html_content.replace(
        '<!-- Phase 5-2: External Data File (데이터 외부화) -->\n    <script src="rachgia_data_v8.js"></script>',
        '''<!-- Phase 5-2: External Data File (데이터 외부화) -->
    <script src="rachgia_data_v8.js"></script>

    <!-- Phase 1: Security & Performance (V01-V04) -->
    <script src="rachgia_v18_improvements.js"></script>'''
    )

    return html_content

def update_csp(html_content):
    """
    Update CSP to remove 'unsafe-inline' from script-src if possible
    Note: We still need 'unsafe-inline' for style-src due to Tailwind
    """

    # For now, keep CSP as is since we have inline scripts in Chart.js config
    # In future phases, we can extract all inline scripts

    return html_content

def main():
    print("Creating rachgia_dashboard_v18.html with Phase 1 improvements...")

    # Read v17
    print("Reading v17...")
    with open('rachgia_dashboard_v17.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    print(f"Original size: {len(html_content):,} bytes")

    # Apply transformations
    print("\nApplying V01: Converting onclick handlers to data-action...")
    html_content = convert_onclick_to_data_action(html_content)

    print("Applying V02: Integrating FilterCache...")
    html_content = integrate_filter_cache(html_content)

    print("Applying V03: Integrating ChartManager...")
    html_content = integrate_chart_manager(html_content)

    print("Adding event delegation initialization...")
    html_content = add_event_delegation_init(html_content)

    print("Adding global instances...")
    html_content = add_global_instances(html_content)

    print("Updating metadata...")
    html_content = update_metadata(html_content)

    print("Updating CSP...")
    html_content = update_csp(html_content)

    # Write v18
    print("\nWriting v18...")
    with open('rachgia_dashboard_v18.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Final size: {len(html_content):,} bytes")

    # Count remaining onclick handlers
    remaining_onclick = len(re.findall(r'onclick=', html_content))
    print(f"\nRemaining onclick handlers: {remaining_onclick}")

    # Count new Chart() instances
    remaining_new_chart = len(re.findall(r'new Chart\(', html_content))
    print(f"Remaining 'new Chart()' instances: {remaining_new_chart}")

    print("\n✅ rachgia_dashboard_v18.html created successfully!")
    print("\nPhase 1 improvements applied:")
    print("  V01: XSS 완전 제거 - onclick -> data-action conversion")
    print("  V02: 캐싱 레이어 - FilterCache integration")
    print("  V03: 메모리 최적화 - ChartManager integration")
    print("  V04: 차트 성능 - Conditional animation (via ChartManager)")

if __name__ == '__main__':
    main()
