#!/usr/bin/env python3
"""
v7 대시보드 생성 스크립트
- parsed_loadplan_v6.json 데이터 임베딩
- isDelayed 로직 수정: SDD > CRD
- isWarning 로직 수정: SDD가 CRD에 근접 (3일 이내 차이)
- 날짜 범위 필터 추가 (1주일/1달/전체 + SDD/CRD 선택)
- AQL 상태 표시
- 잔량 표시 (외주/재봉/제화/창고입고/창고출고)
"""

import json
import re
from pathlib import Path

base_path = Path('/Users/ksmoon/Coding/오더 현황 분석')

# v5 대시보드 읽기
with open(base_path / 'rachgia_dashboard_v5.html', 'r', encoding='utf-8') as f:
    content = f.read()

# v6 JSON 데이터 읽기
with open(base_path / 'parsed_loadplan_v6.json', 'r', encoding='utf-8') as f:
    v6_data = json.load(f)

print(f"Loaded {len(v6_data)} records from parsed_loadplan_v6.json")

# 1. EMBEDDED_DATA 교체
old_data_pattern = r'const EMBEDDED_DATA = \[.*?\];'
new_data_js = f'const EMBEDDED_DATA = {json.dumps(v6_data, ensure_ascii=False)};'
content = re.sub(old_data_pattern, new_data_js, content, flags=re.DOTALL)

# 2. isDelayed 함수 수정 (Ground Truth: SDD > CRD)
old_isDelayed = '''function isDelayed(d) {
            const dateVal = getDateValue(d);
            if (!dateVal || dateVal === '00:00:00') return false;
            const whInCompleted = d.production?.wh_in?.completed || 0;
            const qty = d.quantity || 0;
            if (whInCompleted >= qty) return false;
            try {
                const targetDate = new Date(dateVal.replace(/\\./g, '-'));
                return targetDate < new Date();
            } catch { return false; }
        }'''

new_isDelayed = '''function isDelayed(d) {
            // Ground Truth: 지연 = SDD > CRD (출고예정일이 고객요구일보다 늦음)
            const sdd = d.sddValue;
            const crd = d.crd;
            if (!sdd || !crd || sdd === '00:00:00' || crd === '00:00:00') return false;

            // 이미 출고 완료된 경우 지연 아님
            const whOutCompleted = d.production?.wh_out?.completed || 0;
            const qty = d.quantity || 0;
            if (whOutCompleted >= qty) return false;

            // Code04 승인 있는 경우 지연 아님 (공식 승인된 SDD 변경)
            if (d.code04) return false;

            try {
                const sddDate = new Date(sdd.replace(/\\./g, '-'));
                const crdDate = new Date(crd.replace(/\\./g, '-'));
                return sddDate > crdDate;  // SDD가 CRD보다 늦으면 지연
            } catch { return false; }
        }'''

content = content.replace(old_isDelayed, new_isDelayed)

# 3. isWarning 함수 수정 (CRD 기준 3일 이내 접근)
old_isWarning = '''function isWarning(d) {
            const dateVal = getDateValue(d);
            if (!dateVal || dateVal === '00:00:00') return false;
            const whInCompleted = d.production?.wh_in?.completed || 0;
            const qty = d.quantity || 0;
            if (whInCompleted >= qty) return false;
            try {
                const targetDate = new Date(dateVal.replace(/\\./g, '-'));
                const diffDays = (targetDate - new Date()) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 3;
            } catch { return false; }
        }'''

new_isWarning = '''function isWarning(d) {
            // Warning: 아직 지연은 아니지만 SDD가 CRD에 근접 (3일 이내 차이)
            const sdd = d.sddValue;
            const crd = d.crd;
            if (!sdd || !crd || sdd === '00:00:00' || crd === '00:00:00') return false;

            // 이미 출고 완료된 경우 경고 아님
            const whOutCompleted = d.production?.wh_out?.completed || 0;
            const qty = d.quantity || 0;
            if (whOutCompleted >= qty) return false;

            // 이미 지연인 경우 경고 아님
            if (isDelayed(d)) return false;

            try {
                const sddDate = new Date(sdd.replace(/\\./g, '-'));
                const crdDate = new Date(crd.replace(/\\./g, '-'));
                const diffDays = (crdDate - sddDate) / (1000 * 60 * 60 * 24);
                return diffDays >= 0 && diffDays <= 3;  // CRD와 SDD 차이가 3일 이내
            } catch { return false; }
        }'''

content = content.replace(old_isWarning, new_isWarning)

# 4. 날짜 범위 필터 UI 추가 (헤더 영역에)
old_header_section = '''<!-- Date Mode Toggle (SDD/CRD) -->
                    <div class="date-mode-toggle">
                        <div class="date-mode-btn active" data-mode="sdd" onclick="setDateMode('sdd')">SDD</div>
                        <div class="date-mode-btn" data-mode="crd" onclick="setDateMode('crd')">CRD</div>
                    </div>'''

new_header_section = '''<!-- Date Mode Toggle (SDD/CRD) -->
                    <div class="date-mode-toggle">
                        <div class="date-mode-btn active" data-mode="sdd" onclick="setDateMode('sdd')">SDD</div>
                        <div class="date-mode-btn" data-mode="crd" onclick="setDateMode('crd')">CRD</div>
                    </div>
                    <!-- Date Range Filter -->
                    <div class="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                        <label class="text-sm">기간:</label>
                        <select id="dateRangeFilter" class="bg-white/20 text-white border-none rounded px-2 py-1 text-sm cursor-pointer" onchange="applyDateRangeFilter()">
                            <option value="all" style="color: #000;">전체</option>
                            <option value="week" style="color: #000;">1주일 이내</option>
                            <option value="month" style="color: #000;">1달 이내</option>
                        </select>
                    </div>'''

content = content.replace(old_header_section, new_header_section)

# 5. 날짜 범위 필터 함수 추가 (스크립트 섹션에)
old_filter_init = "let dateMode = 'sdd'; // 'sdd' or 'crd'"
new_filter_init = '''let dateMode = 'sdd'; // 'sdd' or 'crd'
        let dateRangeFilter = 'all'; // 'all', 'week', 'month'

        function applyDateRangeFilter() {
            dateRangeFilter = document.getElementById('dateRangeFilter').value;
            applyFilters();
        }'''

content = content.replace(old_filter_init, new_filter_init)

# 6. applyFilters 함수 수정 - 날짜 범위 필터 적용
old_filter_logic = '''filteredData = allData.filter(d => {'''
new_filter_logic = '''filteredData = allData.filter(d => {
            // Date Range Filter (1주일/1달/전체)
            if (dateRangeFilter !== 'all') {
                const dateField = dateMode === 'sdd' ? d.sddValue : d.crd;
                if (dateField && dateField !== '00:00:00') {
                    const targetDate = new Date(dateField.replace(/\\./g, '-'));
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let maxDate = new Date(today);
                    if (dateRangeFilter === 'week') {
                        maxDate.setDate(maxDate.getDate() + 7);
                    } else if (dateRangeFilter === 'month') {
                        maxDate.setMonth(maxDate.getMonth() + 1);
                    }

                    // 선택한 날짜 범위 내의 오더만 표시
                    if (targetDate > maxDate) return false;
                }
            }'''

content = content.replace(old_filter_logic, new_filter_logic)

# 7. 모달에서 AQL 및 잔량 표시 추가
old_modal_info = '''<div><div class="text-secondary text-xs">시즌</div><div class="font-bold">${d.season || '-'}</div></div>
                <div><div class="text-secondary text-xs">단위</div><div class="font-bold">${d.unit || '-'}</div></div>'''

new_modal_info = '''<div><div class="text-secondary text-xs">시즌</div><div class="font-bold">${d.season || '-'}</div></div>
                <div><div class="text-secondary text-xs">단위</div><div class="font-bold">${d.unit || '-'}</div></div>
                <div><div class="text-secondary text-xs">AQL 검사</div><div class="font-bold ${d.aql ? 'text-blue-600' : 'text-gray-400'}">${d.aql ? '✅ 필요' : '불필요'}</div></div>
            </div>

            <h4 class="font-semibold mb-3 mt-4">📦 잔량 현황</h4>
            <div class="grid grid-cols-5 gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="text-center p-2 rounded ${(d.remaining?.osc || 0) > 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'}">
                    <div class="text-xs text-secondary">외주 잔량</div>
                    <div class="font-bold ${(d.remaining?.osc || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}">${formatNumber(d.remaining?.osc || 0)}</div>
                </div>
                <div class="text-center p-2 rounded ${(d.remaining?.sew || 0) > 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'}">
                    <div class="text-xs text-secondary">재봉 잔량</div>
                    <div class="font-bold ${(d.remaining?.sew || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}">${formatNumber(d.remaining?.sew || 0)}</div>
                </div>
                <div class="text-center p-2 rounded ${(d.remaining?.ass || 0) > 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'}">
                    <div class="text-xs text-secondary">제화 잔량</div>
                    <div class="font-bold ${(d.remaining?.ass || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}">${formatNumber(d.remaining?.ass || 0)}</div>
                </div>
                <div class="text-center p-2 rounded ${(d.remaining?.whIn || 0) > 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'}">
                    <div class="text-xs text-secondary">입고 잔량</div>
                    <div class="font-bold ${(d.remaining?.whIn || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}">${formatNumber(d.remaining?.whIn || 0)}</div>
                </div>
                <div class="text-center p-2 rounded ${(d.remaining?.whOut || 0) > 0 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-green-100 dark:bg-green-900'}">
                    <div class="text-xs text-secondary">출고 잔량</div>
                    <div class="font-bold ${(d.remaining?.whOut || 0) > 0 ? 'text-yellow-700' : 'text-green-700'}">${formatNumber(d.remaining?.whOut || 0)}</div>
                </div>'''

content = content.replace(old_modal_info, new_modal_info)

# 8. 버전 정보 업데이트
content = content.replace('v5: BAL 로직 개선 + 스탁핏', 'v7: Ground Truth + 날짜필터 + AQL + 잔량')
content = content.replace('rachgia_dashboard_v5', 'rachgia_dashboard_v7')
content = content.replace('<span class="text-sm font-normal bg-white/20 px-2 py-1 rounded">v5</span>', '<span class="text-sm font-normal bg-white/20 px-2 py-1 rounded">v7</span>')

# 9. 저장
output_path = base_path / 'rachgia_dashboard_v7.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Created: {output_path}")
print(f"File size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")

# 10. 검증: 주요 통계 출력
total_qty = sum(r.get('quantity', 0) for r in v6_data)
completed_wh_out = sum(r.get('production', {}).get('wh_out', {}).get('completed', 0) for r in v6_data)

# AQL 통계
aql_count = sum(1 for r in v6_data if r.get('aql'))
aql_qty = sum(r.get('quantity', 0) for r in v6_data if r.get('aql'))

print(f"\n=== v7 데이터 통계 ===")
print(f"총 오더 건수: {len(v6_data):,}건")
print(f"총 주문 수량: {total_qty:,}족")
print(f"창고출고 완료: {completed_wh_out:,}족 ({completed_wh_out/total_qty*100:.1f}%)")
print(f"\nAQL 검사 필요: {aql_count:,}건 ({aql_qty:,}족)")

# 지연/경고 계산 (간단 검증)
delayed_count = 0
for r in v6_data:
    sdd = r.get('sddValue', '')
    crd = r.get('crd', '')
    wh_out = r.get('production', {}).get('wh_out', {}).get('completed', 0)
    qty = r.get('quantity', 0)

    if not sdd or not crd or wh_out >= qty:
        continue
    if r.get('code04'):
        continue
    try:
        from datetime import datetime
        sdd_date = datetime.strptime(sdd, '%Y-%m-%d')
        crd_date = datetime.strptime(crd, '%Y-%m-%d')
        if sdd_date > crd_date:
            delayed_count += 1
    except:
        pass

print(f"\n지연 오더 (SDD>CRD): {delayed_count}건")
