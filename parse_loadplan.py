#!/usr/bin/env python3
"""
로드플랜 Excel 파싱 스크립트 (v6용)
Ground Truth 기준 BAL 컬럼 해석:
- 날짜 = 전량 완료일 (completed)
- 숫자 = 미완료 잔량 (pending)
"""

import pandas as pd
import json
import re
import time
from datetime import datetime
from pathlib import Path

# Factory별 파일 경로
FACTORY_FILES = {
    'A': 'A- LOADPLAN ASSEMBLY OF RACHGIA FACTORY A  12.20.2025.xlsx',
    'B': 'B- LOADPLAN ASSEMBLY OF RACHGIA FACTORY B  12.20.2025.xlsx',
    'C': 'C- LOADPLAN ASSEMBLY OF RACHGIA FACTORY C  12.20.2025.xlsx',
    'D': 'D- LOADPLAN ASSEMBLY OF RACHGIA FACTORY D  12.20.2025.xlsx'
}

# Factory A 컬럼 매핑 (0-indexed)
COLUMNS_A = {
    'unit': 0,
    'season': 1,
    'prod_lt': 3,
    'coop': 4,
    'crd': 5,
    'sdd_original': 6,
    'sdd_current': 7,
    'code04': 8,
    'model': 9,
    'article': 10,
    'color': 11,
    'gd': 12,
    'sales_order': 13,
    'destination': 14,
    'event': 15,
    'quantity': 17,
    'mrp_qty': 18,
    'mrp_date': 19,
    'setp': 20,
    'intertek': 25,  # AQL 검사 여부
    'osc_material': 26,
    'main_material': 27,
    'outsourcing_out_bal': 37,
    'outsourcing_in_bal': 38,
    'osc_vendor': 39,
    's_cut_bal': 40,
    'pre_sew_bal': 41,
    'sew_input_bal': 42,
    'sew_prod_scan': 43,
    'sew_bal': 44,
    'outsole_vendor': 48,
    's_fit_bal': 50,
    'ass_bal': 51,
    'wh_return_fac': 53,
    'wh_in_bal': 54,
    'wh_out_bal': 55,
    'pkg_type': 56,
    'inspection': 61
}

# Factory B 컬럼 매핑 (A와 다름)
COLUMNS_B = {
    'unit': 0,
    'season': 1,
    'prod_lt': 3,
    'coop': 4,
    'crd': 5,
    'sdd_original': 6,
    'sdd_current': 7,
    'code04': 8,
    'model': 9,
    'article': 10,
    'color': 11,
    'gd': 12,
    'sales_order': 13,
    'destination': 14,
    'event': 15,
    'quantity': 17,
    'mrp_qty': 18,
    'mrp_date': 19,
    'setp': 20,
    'intertek': 24,  # AQL 검사 여부
    'osc_material': 26,
    'main_material': 27,
    'outsourcing_out_bal': 37,
    'outsourcing_in_bal': 38,
    'osc_vendor': 39,
    's_cut_bal': 40,
    'pre_sew_bal': 41,
    'sew_input_bal': 42,
    'sew_prod_scan': 43,
    'sew_bal': 44,
    'outsole_vendor': 47,
    's_fit_bal': 49,
    'ass_bal': 50,
    'wh_return_fac': 52,
    'wh_in_bal': 53,
    'wh_out_bal': 54,
    'pkg_type': 55,
    'inspection': 60
}

# Factory C 컬럼 매핑
COLUMNS_C = {
    'unit': 0,
    'season': 1,
    'prod_lt': 3,
    'coop': 4,
    'crd': 6,
    'sdd_original': 7,
    'sdd_current': 8,
    'code04': 9,
    'model': 11,
    'article': 12,
    'color': 14,
    'gd': 15,
    'sales_order': 16,
    'destination': 17,
    'intertek': 18,  # AQL 검사 여부
    'event': 19,
    'quantity': 21,
    'mrp_qty': 22,
    'mrp_date': 23,
    'setp': 24,  # PO column (수정: 29→24)
    'osc_material': 40,
    'main_material': 41,
    'outsourcing_out_bal': 50,
    'outsourcing_in_bal': 51,
    'osc_vendor': 52,
    's_cut_bal': 53,
    'pre_sew_bal': 54,
    'sew_input_bal': 55,
    'sew_prod_scan': 56,
    'sew_bal': 57,
    'outsole_vendor': 61,
    's_fit_bal': 64,
    'ass_bal': 65,
    'wh_return_fac': 67,
    'wh_in_bal': 68,
    'wh_out_bal': 69,
    'pkg_type': 70,
    'inspection': 75
}

# Factory D 컬럼 매핑 (C와 다름)
COLUMNS_D = {
    'unit': 0,
    'season': 1,
    'prod_lt': 2,
    'coop': 3,
    'crd': 5,
    'sdd_original': 6,
    'sdd_current': 7,
    'code04': 8,
    'model': 10,
    'article': 11,
    'color': 13,
    'gd': 14,
    'sales_order': 15,
    'destination': 16,
    'intertek': 17,  # AQL 검사 여부
    'event': 18,
    'quantity': 20,
    'mrp_qty': 21,
    'mrp_date': 22,
    'setp': 23,  # PO column (수정: 28→23)
    'osc_material': 39,
    'main_material': 40,
    'outsourcing_out_bal': 49,
    'outsourcing_in_bal': 50,
    'osc_vendor': 51,
    's_cut_bal': 52,
    'pre_sew_bal': 53,
    'sew_input_bal': 54,
    'sew_prod_scan': 55,
    'sew_bal': 56,
    'outsole_vendor': 60,
    's_fit_bal': 62,
    'ass_bal': 63,
    'wh_return_fac': 65,
    'wh_in_bal': 66,
    'wh_out_bal': 67,
    'pkg_type': 68,
    'inspection': 73
}


def is_date_format(value):
    """값이 날짜 형식인지 확인"""
    if pd.isna(value) or value is None:
        return False

    val_str = str(value).strip()

    # 빈 값 또는 특수 값
    if not val_str or val_str in ['00:00:00', '#N/A', 'nan', 'NaN', 'None']:
        return False

    # 특수 문자열 (INHOUSE, NO HAPPO 등)
    if any(keyword in val_str.upper() for keyword in ['INHOUSE', 'HAPPO', 'OK', 'RACH']):
        return False

    # 날짜 패턴 확인
    date_patterns = [
        r'^\d{1,2}/\d{1,2}$',           # MM/DD or M/D
        r'^\d{4}\.\d{1,2}\.\d{1,2}$',   # YYYY.MM.DD
        r'^\d{4}-\d{1,2}-\d{1,2}$',     # YYYY-MM-DD
        r'^\d{1,2}-\d{1,2}$',           # MM-DD
    ]

    for pattern in date_patterns:
        if re.match(pattern, val_str):
            return True

    # pandas Timestamp 체크
    if isinstance(value, pd.Timestamp):
        return True

    return False


def is_numeric(value):
    """값이 숫자인지 확인"""
    if pd.isna(value) or value is None:
        return False

    try:
        val_str = str(value).strip()
        if not val_str or val_str in ['00:00:00', '#N/A', 'nan', 'NaN', 'None']:
            return False

        # 특수 문자열 제외
        if any(keyword in val_str.upper() for keyword in ['INHOUSE', 'HAPPO', 'OK', 'RACH', '/']):
            return False

        float(val_str)
        return True
    except (ValueError, TypeError):
        return False


def parse_date_to_string(value, default_year=2025):
    """날짜 값을 YYYY-MM-DD 문자열로 변환"""
    if pd.isna(value) or value is None:
        return None

    val_str = str(value).strip()

    if isinstance(value, pd.Timestamp):
        return value.strftime('%Y-%m-%d')

    # MM/DD 형식
    match = re.match(r'^(\d{1,2})/(\d{1,2})$', val_str)
    if match:
        month, day = int(match.group(1)), int(match.group(2))
        year = default_year if month >= 10 else default_year + 1  # 10월 이후는 2025, 그 전은 2026
        return f'{year}-{month:02d}-{day:02d}'

    # YYYY.MM.DD 형식
    match = re.match(r'^(\d{4})\.(\d{1,2})\.(\d{1,2})$', val_str)
    if match:
        return f'{match.group(1)}-{int(match.group(2)):02d}-{int(match.group(3)):02d}'

    # YYYY-MM-DD 형식
    match = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})$', val_str)
    if match:
        return f'{match.group(1)}-{int(match.group(2)):02d}-{int(match.group(3)):02d}'

    return val_str


def parse_bal_column(value, quantity):
    """
    BAL 컬럼 파싱 (Ground Truth 기준)
    - 날짜 = 전량 완료 (completed=qty, pending=0)
    - 숫자 = 미완료 잔량 (completed=qty-숫자, pending=숫자)
    """
    qty = int(quantity) if pd.notna(quantity) else 0

    # 빈 값 처리
    if pd.isna(value) or value is None:
        return {'completed': 0, 'pending': qty, 'status': 'pending', 'expected_date': None}

    val_str = str(value).strip()

    # 특수 값 처리
    if not val_str or val_str in ['00:00:00', '#N/A', 'nan', 'NaN', 'None']:
        return {'completed': 0, 'pending': qty, 'status': 'pending', 'expected_date': None}

    # INHOUSE = 사내 처리 (해당 외주 공정 스킵, 완료로 간주)
    if 'INHOUSE' in val_str.upper():
        return {'completed': qty, 'pending': 0, 'status': 'completed', 'expected_date': None, 'note': 'INHOUSE'}

    # 날짜 형식 = 전량 완료 (Ground Truth)
    if is_date_format(value):
        completion_date = parse_date_to_string(value)
        return {
            'completed': qty,
            'pending': 0,
            'status': 'completed',
            'expected_date': completion_date  # 완료일
        }

    # 숫자 형식 = 미완료 잔량 (Ground Truth)
    if is_numeric(value):
        try:
            remaining = int(float(val_str))
            completed = max(0, qty - remaining)

            if remaining == 0:
                status = 'completed'
            elif remaining >= qty:
                status = 'pending'
            else:
                status = 'partial'

            return {
                'completed': completed,
                'pending': remaining,
                'status': status,
                'expected_date': None
            }
        except (ValueError, TypeError):
            pass

    # 알 수 없는 형식
    return {'completed': 0, 'pending': qty, 'status': 'unknown', 'expected_date': None, 'raw_value': val_str}


def parse_sdd(original, current):
    """SDD 값 파싱 (Current 우선)"""
    # Current 값 먼저 시도
    for val in [current, original]:
        if pd.isna(val) or val is None:
            continue
        val_str = str(val).strip()
        if val_str and val_str not in ['00:00:00', '#N/A', 'nan']:
            if is_date_format(val):
                return parse_date_to_string(val)
            return val_str
    return None


def get_year_month(date_str):
    """날짜 문자열에서 YYYY-MM 추출"""
    if not date_str:
        return None
    match = re.match(r'^(\d{4})-(\d{2})', str(date_str))
    if match:
        return f'{match.group(1)}-{match.group(2)}'
    return None


def is_header_row(row, cols):
    """헤더 행인지 확인 (반복되는 헤더 행 스킵용)"""
    header_keywords = ['Q.ty', 'MRP.Qty', 'Dest', 'Season', 'Model', 'Article',
                       'Color', 'Unit', 'UNIT', 'Qty', 'SDD', 'CRD', 'No.', 'NO.']

    # 주요 컬럼들에서 헤더 키워드 체크
    check_indices = [cols.get('quantity', 0), cols.get('model', 0), cols.get('destination', 0)]

    for idx in check_indices:
        if idx < len(row):
            val = str(row.iloc[idx]).strip()
            if val in header_keywords:
                return True
    return False


def is_valid_quantity(value):
    """수량 값이 유효한 숫자인지 확인"""
    if pd.isna(value) or value is None:
        return False

    val_str = str(value).strip()

    # 헤더 텍스트 제외
    invalid_values = ['Q.ty', 'MRP.Qty', 'Qty', 'qty', 'nan', 'NaN', 'None', '',
                      'NY', 'NO', 'N/A', '#N/A', 'TBD', '-', 'Intertek']
    if val_str in invalid_values:
        return False

    try:
        num = float(val_str)
        return num > 0
    except (ValueError, TypeError):
        return False


def parse_factory_file(factory, filepath):
    """단일 공장 파일 파싱"""
    print(f'Parsing Factory {factory}: {filepath}')

    try:
        df = pd.read_excel(filepath, header=None, skiprows=4)  # 데이터는 5행부터 시작
    except Exception as e:
        print(f'Error reading {filepath}: {e}')
        return []

    records = []
    skipped_count = 0
    error_count = 0
    # 데이터 품질 카운터 (Agent #R03)
    quality_stats = {
        'empty_destinations': 0,
        'invalid_dates': 0,
        'auto_corrected': 0
    }

    # Factory별 컬럼 매핑 선택
    if factory == 'A':
        cols = COLUMNS_A
    elif factory == 'B':
        cols = COLUMNS_B
    elif factory == 'C':
        cols = COLUMNS_C
    elif factory == 'D':
        cols = COLUMNS_D
    else:
        cols = COLUMNS_A  # 기본값

    for idx, row in df.iterrows():
        try:
            # 헤더 행 스킵
            if is_header_row(row, cols):
                skipped_count += 1
                continue

            quantity = row.iloc[cols['quantity']] if cols['quantity'] < len(row) else None

            # 유효한 수량인지 확인
            if not is_valid_quantity(quantity):
                continue

            qty = int(float(str(quantity).strip()))

            # 기본 정보 체크 (model 또는 unit이 있어야 데이터 행)
            unit_val = row.iloc[cols['unit']] if cols['unit'] < len(row) else None
            model_val = row.iloc[cols['model']] if cols['model'] < len(row) else None

            unit_str = str(unit_val).strip() if pd.notna(unit_val) else ''
            model_str = str(model_val).strip() if pd.notna(model_val) else ''

            # 합계 행 스킵 (모델과 유닛이 모두 비어있으면 합계/소계 행)
            if not unit_str and not model_str:
                skipped_count += 1
                continue

            # 기본 정보
            # Destination 자동 수정 (Agent #R03: Data Quality Guardian)
            dest_raw = row.iloc[cols['destination']] if cols['destination'] < len(row) else None
            dest_str = str(dest_raw).strip() if pd.notna(dest_raw) else ''

            # 빈 destination 자동 수정
            if not dest_str or dest_str in ['nan', 'None', '#N/A']:
                dest_str = 'Unknown'
                quality_stats['empty_destinations'] += 1
                quality_stats['auto_corrected'] += 1

            record = {
                'factory': factory,
                'unit': str(row.iloc[cols['unit']]).strip() if pd.notna(row.iloc[cols['unit']]) else '',
                'season': str(row.iloc[cols['season']]).strip() if pd.notna(row.iloc[cols['season']]) else '',
                'model': str(row.iloc[cols['model']]).strip() if pd.notna(row.iloc[cols['model']]) else '',
                'article': str(row.iloc[cols['article']]).strip() if pd.notna(row.iloc[cols['article']]) else '',
                'color': str(row.iloc[cols['color']]).strip() if pd.notna(row.iloc[cols['color']]) else '',
                'destination': dest_str,
                'quantity': qty,
                'poNumber': str(row.iloc[cols['setp']]).strip() if pd.notna(row.iloc[cols['setp']]) else '',
            }

            # CRD - 잘못된 날짜 검증 (Agent #R03)
            crd_val = row.iloc[cols['crd']] if cols['crd'] < len(row) else None
            if crd_val and str(crd_val).strip() == '00:00:00':
                quality_stats['invalid_dates'] += 1
                record['crd'] = ''
            else:
                record['crd'] = parse_date_to_string(crd_val) if is_date_format(crd_val) else (str(crd_val).strip() if pd.notna(crd_val) else '')
            record['crdYearMonth'] = get_year_month(record['crd']) or ''

            # SDD (Current 우선) - 잘못된 날짜 검증
            sdd_orig = row.iloc[cols['sdd_original']] if cols['sdd_original'] < len(row) else None
            sdd_curr = row.iloc[cols['sdd_current']] if cols['sdd_current'] < len(row) else None

            # '00:00:00' 형식 필터링
            if sdd_curr and str(sdd_curr).strip() == '00:00:00':
                quality_stats['invalid_dates'] += 1
                sdd_curr = None
            if sdd_orig and str(sdd_orig).strip() == '00:00:00':
                quality_stats['invalid_dates'] += 1
                sdd_orig = None

            record['sddValue'] = parse_sdd(sdd_orig, sdd_curr) or ''
            record['sddYearMonth'] = get_year_month(record['sddValue']) or ''

            # Code 04 (지연 승인)
            code04 = row.iloc[cols['code04']] if cols['code04'] < len(row) else None
            record['code04'] = str(code04).strip() if pd.notna(code04) and str(code04).strip() not in ['nan', '-', ''] else None

            # 아웃솔 벤더
            outsole_vendor = row.iloc[cols['outsole_vendor']] if cols['outsole_vendor'] < len(row) else None
            record['outsoleVendor'] = str(outsole_vendor).strip() if pd.notna(outsole_vendor) else ''

            # MRP 정보
            mrp_qty = row.iloc[cols['mrp_qty']] if cols['mrp_qty'] < len(row) else None
            record['mrpQty'] = int(float(mrp_qty)) if pd.notna(mrp_qty) and is_numeric(mrp_qty) else None

            mrp_date = row.iloc[cols['mrp_date']] if cols['mrp_date'] < len(row) else None
            record['mrpDate'] = parse_date_to_string(mrp_date) if is_date_format(mrp_date) else None

            # W.H return Fac (불량 리턴)
            wh_return = row.iloc[cols['wh_return_fac']] if cols['wh_return_fac'] < len(row) else None
            record['whReturnFac'] = int(float(wh_return)) if pd.notna(wh_return) and is_numeric(wh_return) else 0

            # Inspection (검사 완료일)
            inspection = row.iloc[cols['inspection']] if cols['inspection'] < len(row) else None
            record['inspection'] = parse_date_to_string(inspection) if is_date_format(inspection) else None

            # Intertek (AQL 검사 여부)
            if 'intertek' in cols:
                intertek_val = row.iloc[cols['intertek']] if cols['intertek'] < len(row) else None
                intertek_str = str(intertek_val).strip().upper() if pd.notna(intertek_val) else ''
                # YES/Y/OK = AQL 검사 대상, NO/N/빈값 = 비대상
                record['aql'] = intertek_str in ['YES', 'Y', 'OK', '1', 'TRUE', 'AQL']
            else:
                record['aql'] = False

            # 생산 공정 데이터 (BAL 컬럼들)
            production = {}

            bal_columns = {
                's_cut': cols['s_cut_bal'],
                'pre_sew': cols['pre_sew_bal'],
                'sew_input': cols['sew_input_bal'],
                'sew_bal': cols['sew_bal'],
                's_fit': cols['s_fit_bal'],
                'ass_bal': cols['ass_bal'],
                'wh_in': cols['wh_in_bal'],
                'wh_out': cols['wh_out_bal']
            }

            for process_name, col_idx in bal_columns.items():
                if col_idx < len(row):
                    bal_value = row.iloc[col_idx]
                    production[process_name] = parse_bal_column(bal_value, qty)
                else:
                    production[process_name] = {'completed': 0, 'pending': qty, 'status': 'pending', 'expected_date': None}

            # sew_prod_scan은 스캔 수량일 뿐, BAL 컬럼이 정확한 잔량/완료 정보
            # sew_prod_scan으로 sew_bal을 덮어쓰지 않음

            record['production'] = production

            # 외주 잔량 (outsourcing_in_bal)
            osc_in_bal = row.iloc[cols['outsourcing_in_bal']] if cols['outsourcing_in_bal'] < len(row) else None
            osc_remaining = parse_bal_column(osc_in_bal, qty)
            record['oscRemaining'] = osc_remaining.get('pending', qty)

            # 편의용 잔량 필드들 (대시보드 표시용)
            record['remaining'] = {
                'osc': record['oscRemaining'],  # 외주 잔량
                'sew': production.get('sew_bal', {}).get('pending', qty),  # 재봉 잔량
                'ass': production.get('ass_bal', {}).get('pending', qty),  # 제화(조립) 잔량
                'whIn': production.get('wh_in', {}).get('pending', qty),  # 창고입고 잔량
                'whOut': production.get('wh_out', {}).get('pending', qty)  # 창고출고 잔량
            }
            records.append(record)

        except Exception as e:
            error_count += 1
            if error_count <= 5:  # 처음 5개 에러만 출력
                print(f'  Warning: Row {idx}: {e}')
            continue

    # 데이터 품질 리포트 (Agent #R03: Data Quality Guardian)
    print(f'  Factory {factory}: {len(records)} records parsed, {skipped_count} header rows skipped, {error_count} errors')
    if quality_stats['auto_corrected'] > 0 or quality_stats['invalid_dates'] > 0:
        print(f'  📊 Data Quality Report:')
        print(f'     - Empty destinations fixed: {quality_stats["empty_destinations"]}')
        print(f'     - Invalid dates filtered: {quality_stats["invalid_dates"]}')
        print(f'     - Total auto-corrections: {quality_stats["auto_corrected"]}')

    return records


def main():
    # Performance measurement (Agent #R04)
    start_time = time.time()

    # 환경 변수 또는 현재 스크립트 위치 기준
    base_path = Path(__file__).parent.absolute()
    all_records = []

    for factory, filename in FACTORY_FILES.items():
        filepath = base_path / filename
        if filepath.exists():
            records = parse_factory_file(factory, filepath)
            all_records.extend(records)
        else:
            print(f'File not found: {filepath}')

    print(f'\nTotal records: {len(all_records)}')

    # JSON 저장
    output_path = base_path / 'parsed_loadplan_v6.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_records, f, ensure_ascii=False, indent=2)

    # Performance measurement
    elapsed_time = time.time() - start_time
    print(f'Saved to: {output_path}')
    print(f'⚡ Performance: {elapsed_time:.2f}초 (목표: <30초)')
    if elapsed_time < 30:
        print(f'   ✅ 성능 목표 달성!')
    else:
        print(f'   ⚠️ 성능 개선 필요')

    # 샘플 출력
    print('\n=== Sample Records ===')
    if all_records:
        # 다양한 상태의 샘플 출력
        samples = []
        for r in all_records[:50]:
            wh_out = r.get('production', {}).get('wh_out', {})
            if wh_out.get('status') == 'completed' and len(samples) < 2:
                samples.append(('completed', r))
            elif wh_out.get('status') == 'pending' and len(samples) < 4:
                samples.append(('pending', r))
            if len(samples) >= 4:
                break

        for label, sample in samples[:2]:
            print(f'\n--- {label.upper()} ---')
            print(json.dumps(sample, ensure_ascii=False, indent=2))

    return all_records


if __name__ == '__main__':
    main()
