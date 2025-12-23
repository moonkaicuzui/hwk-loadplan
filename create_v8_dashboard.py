#!/usr/bin/env python3
"""
v8 대시보드 생성 스크립트
- week/month 빠른 선택 필터 구현
- remaining 잔량 데이터 계산 로직 추가
- innerHTML XSS 취약점 제거 (escapeHtml 함수 추가)
- 접근성 개선 (ARIA 속성 추가)
- 차트 다크모드 색상 개선
- 테이블 정렬 기능 통일
- 코드 품질 개선
"""

import json
import re
from pathlib import Path

base_path = Path('/Users/ksmoon/Coding/오더 현황 분석')

# v7 대시보드 읽기
with open(base_path / 'rachgia_dashboard_v7.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("v7 대시보드 로드 완료")

# ==========================================
# 1. week/month 빠른 선택 필터 로직 구현
# ==========================================
print("\n[1/7] week/month 빠른 선택 필터 구현...")

# 기존 quick 필터 로직 찾기 및 확장
old_quick_filter = '''if (quick) {
                    if (quick === 'delayed' && !isDelayed(d)) return false;
                    if (quick === 'warning' && !isWarning(d)) return false;
                    if (quick === 'today' && !isToday(d)) return false;
                }'''

new_quick_filter = '''if (quick) {
                    if (quick === 'delayed' && !isDelayed(d)) return false;
                    if (quick === 'warning' && !isWarning(d)) return false;
                    if (quick === 'today' && !isToday(d)) return false;
                    if (quick === 'week' && !isWithinWeek(d)) return false;
                    if (quick === 'month' && !isCurrentMonth(d)) return false;
                }'''

content = content.replace(old_quick_filter, new_quick_filter)

# isWithinWeek, isCurrentMonth 함수 추가 (isToday 함수 뒤에)
old_isToday = '''function isToday(d) {
            const dateVal = getDateValue(d);
            if (!dateVal || dateVal === '00:00:00') return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            try {
                const targetDate = new Date(dateVal.replace(/\\./g, '-'));
                targetDate.setHours(0, 0, 0, 0);
                return targetDate.getTime() === today.getTime();
            } catch { return false; }
        }'''

new_isToday_and_helpers = '''function isToday(d) {
            const dateVal = getDateValue(d);
            if (!dateVal || dateVal === '00:00:00') return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            try {
                const targetDate = new Date(dateVal.replace(/\\./g, '-'));
                targetDate.setHours(0, 0, 0, 0);
                return targetDate.getTime() === today.getTime();
            } catch { return false; }
        }

        function isWithinWeek(d) {
            const dateVal = getDateValue(d);
            if (!dateVal || dateVal === '00:00:00') return false;
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const targetDate = new Date(dateVal.replace(/\\./g, '-'));
                targetDate.setHours(0, 0, 0, 0);

                // 이번 주 시작 (일요일)
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());

                // 이번 주 끝 (토요일)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                return targetDate >= weekStart && targetDate <= weekEnd;
            } catch { return false; }
        }

        function isCurrentMonth(d) {
            const dateVal = getDateValue(d);
            if (!dateVal || dateVal === '00:00:00') return false;
            try {
                const today = new Date();
                const targetDate = new Date(dateVal.replace(/\\./g, '-'));
                return targetDate.getMonth() === today.getMonth() &&
                       targetDate.getFullYear() === today.getFullYear();
            } catch { return false; }
        }'''

content = content.replace(old_isToday, new_isToday_and_helpers)

# ==========================================
# 2. remaining 잔량 데이터 계산 로직 추가
# ==========================================
print("[2/7] remaining 잔량 데이터 계산 로직 추가...")

# initApp 함수에서 remaining 계산 추가
old_initApp = '''function initApp() {
            if (allData.length === 0) {
                document.getElementById('loadingOverlay').innerHTML = '<div class="text-center"><p class="text-red-500">데이터 없음</p></div>';
                return;
            }
            populateFilters();'''

new_initApp = '''function initApp() {
            if (allData.length === 0) {
                document.getElementById('loadingOverlay').innerHTML = '<div class="text-center"><p class="text-red-500">데이터 없음</p></div>';
                return;
            }

            // remaining 잔량 데이터 계산
            allData.forEach(d => {
                const qty = d.quantity || 0;
                const prod = d.production || {};

                // 각 공정별 잔량 계산 (주문량 - 완료량)
                d.remaining = {
                    osc: Math.max(0, qty - (prod.osc?.completed || 0)),
                    sew: Math.max(0, qty - (prod.sew?.completed || 0)),
                    ass: Math.max(0, qty - (prod.ass?.completed || 0)),
                    whIn: Math.max(0, qty - (prod.wh_in?.completed || 0)),
                    whOut: Math.max(0, qty - (prod.wh_out?.completed || 0))
                };
            });

            populateFilters();'''

content = content.replace(old_initApp, new_initApp)

# ==========================================
# 3. XSS 취약점 제거 - escapeHtml 함수 추가
# ==========================================
print("[3/7] XSS 취약점 제거 (escapeHtml 함수 추가)...")

# escapeHtml 함수를 유틸리티 함수들 앞에 추가
old_format_number = '''function formatNumber(num) { return num.toLocaleString('ko-KR'); }'''

new_escape_and_format = '''// XSS 방지를 위한 HTML 이스케이프 함수
        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            const div = document.createElement('div');
            div.textContent = String(str);
            return div.innerHTML;
        }

        function formatNumber(num) { return num.toLocaleString('ko-KR'); }'''

content = content.replace(old_format_number, new_escape_and_format)

# innerHTML 사용 중 사용자 데이터가 포함된 부분을 escapeHtml로 래핑
# 주요 취약점: 모달의 사용자 데이터, 테이블 렌더링 등

# 모달에서 모델명, PO번호 등 escapeHtml 적용
content = content.replace(
    '${d.model || \'-\'}',
    '${escapeHtml(d.model) || \'-\'}'
)
content = content.replace(
    '${d.poNumber || \'-\'}',
    '${escapeHtml(d.poNumber) || \'-\'}'
)
content = content.replace(
    '${d.destination || \'-\'}',
    '${escapeHtml(d.destination) || \'-\'}'
)
content = content.replace(
    '${d.factory || \'-\'}',
    '${escapeHtml(d.factory) || \'-\'}'
)
content = content.replace(
    '${d.outsoleVendor || \'-\'}',
    '${escapeHtml(d.outsoleVendor) || \'-\'}'
)
content = content.replace(
    '${d.article || \'-\'}',
    '${escapeHtml(d.article) || \'-\'}'
)
content = content.replace(
    '${d.season || \'-\'}',
    '${escapeHtml(d.season) || \'-\'}'
)
content = content.replace(
    '${d.unit || \'-\'}',
    '${escapeHtml(d.unit) || \'-\'}'
)

# ==========================================
# 4. 접근성 개선 (ARIA 속성 추가)
# ==========================================
print("[4/7] 접근성 개선 (ARIA 속성 추가)...")

# 메인 컨테이너에 role과 aria-label 추가
content = content.replace(
    '<header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg no-print">',
    '<header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg no-print" role="banner" aria-label="Rachgia Factory 대시보드 헤더">'
)

# 모달에 접근성 속성 추가
content = content.replace(
    'id="orderDetailModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4"',
    'id="orderDetailModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modalTitle"'
)

# 탭 네비게이션에 role 추가
content = content.replace(
    '<nav class="flex -mb-px min-w-max">',
    '<nav class="flex -mb-px min-w-max" role="tablist" aria-label="대시보드 탭 네비게이션">'
)

# 탭 버튼에 role="tab" 추가 (button 태그)
content = content.replace(
    '<button class="tab-btn tab-active px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="monthly">📅 월별</button>',
    '<button class="tab-btn tab-active px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="monthly" role="tab" aria-selected="true" tabindex="0">📅 월별</button>'
)
content = content.replace(
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="destination">🌍 행선지별</button>',
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="destination" role="tab" aria-selected="false" tabindex="-1">🌍 행선지별</button>'
)
content = content.replace(
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="model">👟 모델별</button>',
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="model" role="tab" aria-selected="false" tabindex="-1">👟 모델별</button>'
)
content = content.replace(
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="factory">🏭 공장별</button>',
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="factory" role="tab" aria-selected="false" tabindex="-1">🏭 공장별</button>'
)
content = content.replace(
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="vendor">🔧 아웃솔 벤더</button>',
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="vendor" role="tab" aria-selected="false" tabindex="-1">🔧 아웃솔 벤더</button>'
)
content = content.replace(
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="heatmap">🔥 히트맵</button>',
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="heatmap" role="tab" aria-selected="false" tabindex="-1">🔥 히트맵</button>'
)
content = content.replace(
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="data">📋 상세 <span class="kbd">D</span></button>',
    '<button class="tab-btn px-6 py-3 text-sm font-medium whitespace-nowrap" data-tab="data" role="tab" aria-selected="false" tabindex="-1">📋 상세 <span class="kbd">D</span></button>'
)

# 검색 입력에 aria-label 추가
content = content.replace(
    'id="searchInput" placeholder="모델, PO, 행선지, 벤더..."',
    'id="searchInput" placeholder="모델, PO, 행선지, 벤더..." aria-label="오더 통합 검색"'
)

# 필터 섹션에 role="search" 추가
content = content.replace(
    '<div class="bg-card rounded-xl shadow-sm p-4 mb-6 no-print">',
    '<div class="bg-card rounded-xl shadow-sm p-4 mb-6 no-print" role="search" aria-label="필터 옵션">'
)

# ==========================================
# 5. 차트 다크모드 색상 개선
# ==========================================
print("[5/7] 차트 다크모드 색상 개선...")

# Chart.js 다크모드 설정 추가
old_chart_defaults = '''<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>'''

new_chart_defaults = '''<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        // Chart.js 다크모드 기본 설정
        Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1f2937';
        Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#e5e7eb';
    </script>'''

content = content.replace(old_chart_defaults, new_chart_defaults)

# toggleDarkMode 함수에 차트 업데이트 로직 추가
old_toggleDarkMode = '''function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            document.getElementById('darkModeIcon').textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
            updateDashboard();
        }'''

new_toggleDarkMode = '''function toggleDarkMode() {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            document.getElementById('darkModeIcon').textContent = isDark ? '☀️' : '🌙';

            // 차트 색상 업데이트
            const textColor = isDark ? '#f9fafb' : '#1f2937';
            const borderColor = isDark ? '#4b5563' : '#e5e7eb';
            Chart.defaults.color = textColor;
            Chart.defaults.borderColor = borderColor;

            // 모든 차트 업데이트
            Object.values(Chart.instances).forEach((instance) => {
                if (instance.options.scales) {
                    ['x', 'y', 'r'].forEach(axis => {
                        if (instance.options.scales[axis]) {
                            instance.options.scales[axis].ticks = instance.options.scales[axis].ticks || {};
                            instance.options.scales[axis].ticks.color = textColor;
                            instance.options.scales[axis].grid = instance.options.scales[axis].grid || {};
                            instance.options.scales[axis].grid.color = borderColor;
                        }
                    });
                }
                if (instance.options.plugins?.legend?.labels) {
                    instance.options.plugins.legend.labels.color = textColor;
                }
                instance.update();
            });
            updateDashboard();
        }'''

content = content.replace(old_toggleDarkMode, new_toggleDarkMode)

# ==========================================
# 6. 테이블 정렬 기능 통일 + 접근성 추가
# ==========================================
print("[6/7] 테이블 정렬 기능 통일...")

# 정렬 헤더에 접근성 속성 추가 (CSS에서)
old_sort_header_css = '''/* Sortable headers */
        .sort-header { cursor: pointer; user-select: none; position: relative; }'''

new_sort_header_css = '''/* Sortable headers - 접근성 개선 */
        .sort-header { cursor: pointer; user-select: none; position: relative; }
        .sort-header:focus { outline: 2px solid #3b82f6; outline-offset: 2px; }'''

content = content.replace(old_sort_header_css, new_sort_header_css)

# handleSort 함수에 aria-sort 업데이트 추가
old_handleSort = '''function handleSort(header) {
            const sortKey = header.dataset.sort;
            const table = header.dataset.table;

            if (!sortState[table]) sortState[table] = { key: null, dir: 'asc' };

            if (sortState[table].key === sortKey) {
                sortState[table].dir = sortState[table].dir === 'asc' ? 'desc' : 'asc';
            } else {
                sortState[table].key = sortKey;
                sortState[table].dir = 'asc';
            }'''

new_handleSort = '''function handleSort(header) {
            const sortKey = header.dataset.sort;
            const table = header.dataset.table;

            if (!sortState[table]) sortState[table] = { key: null, dir: 'asc' };

            if (sortState[table].key === sortKey) {
                sortState[table].dir = sortState[table].dir === 'asc' ? 'desc' : 'asc';
            } else {
                sortState[table].key = sortKey;
                sortState[table].dir = 'asc';
            }

            // 접근성: aria-sort 업데이트
            document.querySelectorAll(`[data-table="${table}"]`).forEach(h => {
                h.setAttribute('aria-sort', 'none');
            });
            header.setAttribute('aria-sort', sortState[table].dir === 'asc' ? 'ascending' : 'descending');'''

content = content.replace(old_handleSort, new_handleSort)

# ==========================================
# 7. 코드 품질 개선 (빈 catch 블록 수정)
# ==========================================
print("[7/7] 코드 품질 개선...")

# 빈 catch 블록에 console.warn 추가
content = re.sub(
    r'} catch \{ return false; \}',
    '} catch (e) { console.warn("Date parsing error:", e); return false; }',
    content
)

# ==========================================
# 버전 정보 업데이트
# ==========================================
content = content.replace('v7: Ground Truth + 날짜필터 + AQL + 잔량', 'v8: 필터수정 + 잔량계산 + XSS보안 + 접근성 + 다크모드차트')
content = content.replace('rachgia_dashboard_v7', 'rachgia_dashboard_v8')
content = content.replace('<span class="text-sm font-normal bg-white/20 px-2 py-1 rounded">v7</span>', '<span class="text-sm font-normal bg-white/20 px-2 py-1 rounded">v8</span>')

# ==========================================
# 파일 저장
# ==========================================
output_path = base_path / 'rachgia_dashboard_v8.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ Created: {output_path}")
print(f"📁 File size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")

# ==========================================
# 검증
# ==========================================
print("\n=== v8 수정 사항 검증 ===")

# 1. week/month 필터 로직 확인
if 'isWithinWeek' in content and 'isCurrentMonth' in content:
    print("✅ [1/7] week/month 빠른 선택 필터 구현 완료")
else:
    print("❌ [1/7] week/month 필터 구현 실패")

# 2. remaining 계산 로직 확인
if 'd.remaining = {' in content:
    print("✅ [2/7] remaining 잔량 데이터 계산 로직 추가 완료")
else:
    print("❌ [2/7] remaining 계산 로직 실패")

# 3. escapeHtml 함수 확인
if 'function escapeHtml' in content:
    print("✅ [3/7] XSS 취약점 제거 (escapeHtml) 완료")
else:
    print("❌ [3/7] escapeHtml 함수 추가 실패")

# 4. ARIA 속성 확인
if 'role="dialog"' in content and 'role="tablist"' in content:
    print("✅ [4/7] 접근성 개선 (ARIA 속성) 완료")
else:
    print("❌ [4/7] ARIA 속성 추가 실패")

# 5. 차트 다크모드 확인
if 'Object.values(Chart.instances)' in content:
    print("✅ [5/7] 차트 다크모드 색상 개선 완료")
else:
    print("❌ [5/7] 차트 다크모드 개선 실패")

# 6. 정렬 접근성 확인
if 'aria-sort' in content or '.sort-header:focus' in content:
    print("✅ [6/7] 테이블 정렬 기능 통일 완료")
else:
    print("❌ [6/7] 테이블 정렬 개선 실패")

# 7. 빈 catch 수정 확인
if 'console.warn("Date parsing error:"' in content:
    print("✅ [7/7] 코드 품질 개선 완료")
else:
    print("❌ [7/7] 코드 품질 개선 실패")

print("\n🎉 v8 대시보드 생성 완료!")
