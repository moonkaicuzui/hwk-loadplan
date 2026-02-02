#!/usr/bin/env python3
"""
Google Drive 자동 다운로드 스크립트
Rachgia Dashboard v19 - 자동화 빌드 시스템

사용법:
    python scripts/download_from_drive.py

환경 변수:
    GOOGLE_SERVICE_ACCOUNT_KEY: 서비스 계정 JSON 키 (GitHub Secrets에서 제공)
    GOOGLE_DRIVE_FOLDER_ID: Google Drive 폴더 ID
"""

import os
import sys
import json
import io
from pathlib import Path

# Google API 라이브러리
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
except ImportError:
    print("Installing required packages...")
    os.system("pip install google-auth google-auth-oauthlib google-api-python-client")
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload

# 설정
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
DATA_DIR = Path(__file__).parent.parent / 'data'

# 파일 매핑 (Google Drive 파일명 → 로컬 파일명)
FILE_MAPPING = {
    'LOADPLAN ASSEMBLY OF RACHGIA FACTORY A': 'Factory_A.xlsx',
    'LOADPLAN ASSEMBLY OF RACHGIA FACTORY B': 'Factory_B.xlsx',
    'LOADPLAN ASSEMBLY OF RACHGIA FACTORY C': 'Factory_C.xlsx',
    'LOADPLAN ASSEMBLY OF RACHGIA FACTORY D': 'Factory_D.xlsx',
}


def get_credentials():
    """서비스 계정 인증 정보 가져오기"""
    # GitHub Actions에서 환경 변수로 제공
    service_account_key = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY')

    if service_account_key:
        # JSON 문자열에서 직접 로드
        key_dict = json.loads(service_account_key)
        return service_account.Credentials.from_service_account_info(key_dict, scopes=SCOPES)

    # 로컬 개발용: 파일에서 로드
    key_file = Path(__file__).parent.parent / 'credentials' / 'service-account.json'
    if key_file.exists():
        return service_account.Credentials.from_service_account_file(str(key_file), scopes=SCOPES)

    raise ValueError(
        "서비스 계정 키를 찾을 수 없습니다.\n"
        "1. GOOGLE_SERVICE_ACCOUNT_KEY 환경 변수 설정, 또는\n"
        "2. credentials/service-account.json 파일 생성"
    )


def list_files_in_folder(service, folder_id):
    """폴더 내 파일 목록 조회"""
    query = f"'{folder_id}' in parents and mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'"

    results = service.files().list(
        q=query,
        pageSize=100,
        fields="files(id, name, modifiedTime)"
    ).execute()

    return results.get('files', [])


def download_file(service, file_id, local_path):
    """파일 다운로드"""
    request = service.files().get_media(fileId=file_id)

    with io.FileIO(local_path, 'wb') as fh:
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
            if status:
                print(f"  다운로드 진행: {int(status.progress() * 100)}%")

    print(f"  ✅ 저장 완료: {local_path}")


def main():
    """메인 실행 함수"""
    print("=" * 60)
    print("🚀 Google Drive 자동 다운로드 시작")
    print("=" * 60)

    # 폴더 ID 확인
    folder_id = os.environ.get('GOOGLE_DRIVE_FOLDER_ID')
    if not folder_id:
        print("❌ GOOGLE_DRIVE_FOLDER_ID 환경 변수가 설정되지 않았습니다.")
        sys.exit(1)

    # 인증
    print("\n📝 Google 인증 중...")
    try:
        credentials = get_credentials()
        service = build('drive', 'v3', credentials=credentials)
        print("  ✅ 인증 성공")
    except Exception as e:
        print(f"  ❌ 인증 실패: {e}")
        sys.exit(1)

    # 데이터 디렉토리 생성
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 파일 목록 조회
    print(f"\n📂 폴더 조회 중: {folder_id}")
    try:
        files = list_files_in_folder(service, folder_id)
        print(f"  발견된 파일: {len(files)}개")
    except Exception as e:
        print(f"  ❌ 폴더 조회 실패: {e}")
        sys.exit(1)

    if not files:
        print("  ⚠️ 폴더에 Excel 파일이 없습니다.")
        sys.exit(1)

    # 파일 다운로드
    print("\n📥 파일 다운로드 시작...")
    downloaded = 0

    for file in files:
        file_name = file['name']
        file_id = file['id']
        modified = file.get('modifiedTime', 'Unknown')

        print(f"\n  📄 {file_name}")
        print(f"     수정: {modified}")

        # 파일명 매핑
        local_name = None
        for pattern, mapped_name in FILE_MAPPING.items():
            if pattern in file_name:
                local_name = mapped_name
                break

        if not local_name:
            print(f"     ⏭️ 스킵 (매핑 없음)")
            continue

        local_path = DATA_DIR / local_name

        try:
            download_file(service, file_id, str(local_path))
            downloaded += 1
        except Exception as e:
            print(f"     ❌ 다운로드 실패: {e}")

    # 결과 요약
    print("\n" + "=" * 60)
    print(f"✅ 다운로드 완료: {downloaded}개 파일")
    print(f"📂 저장 위치: {DATA_DIR}")
    print("=" * 60)

    # 다운로드된 파일 목록
    print("\n📋 다운로드된 파일:")
    for f in DATA_DIR.glob("*.xlsx"):
        size = f.stat().st_size / 1024
        print(f"  - {f.name} ({size:.1f} KB)")

    return 0 if downloaded > 0 else 1


if __name__ == '__main__':
    sys.exit(main())
