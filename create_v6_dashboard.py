#!/usr/bin/env python3
"""
v6 대시보드 생성 스크립트
- parsed_loadplan_v6.json 데이터 임베딩
- isDelayed 로직 수정: SDD > CRD
- isWarning 로직 수정: SDD가 CRD에 근접 (3일 이내 차이)
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
# 기존 데이터 패턴 찾기
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
                const targetDate = new Date(dateVal.replace(/\./g, '-'));
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
                const targetDate = new Date(dateVal.replace(/\./g, '-'));
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

# 4. 버전 정보 업데이트
content = content.replace('v5: BAL 로직 개선 + 스탁핏', 'v6: Ground Truth 기준 BAL 재파싱 + 지연 로직 수정 (SDD>CRD)')
content = content.replace('rachgia_dashboard_v5', 'rachgia_dashboard_v6')

# 5. 저장
output_path = base_path / 'rachgia_dashboard_v6.html'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Created: {output_path}")
print(f"File size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")

# 6. 검증: 주요 통계 출력
total_qty = sum(r.get('quantity', 0) for r in v6_data)
completed_wh_out = sum(r.get('production', {}).get('wh_out', {}).get('completed', 0) for r in v6_data)

factories = {}
for r in v6_data:
    f = r.get('factory', 'Unknown')
    factories[f] = factories.get(f, 0) + 1

destinations = {}
for r in v6_data:
    dest = r.get('destination', 'Unknown')
    destinations[dest] = destinations.get(dest, 0) + r.get('quantity', 0)

print(f"\n=== v6 데이터 통계 ===")
print(f"총 오더 건수: {len(v6_data):,}건")
print(f"총 주문 수량: {total_qty:,}족")
print(f"창고출고 완료: {completed_wh_out:,}족 ({completed_wh_out/total_qty*100:.1f}%)")
print(f"\n공장별 건수:")
for f, cnt in sorted(factories.items()):
    print(f"  Factory {f}: {cnt:,}건")

print(f"\n상위 5개 행선지:")
top_dests = sorted(destinations.items(), key=lambda x: -x[1])[:5]
for dest, qty in top_dests:
    print(f"  {dest}: {qty:,}족")

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
