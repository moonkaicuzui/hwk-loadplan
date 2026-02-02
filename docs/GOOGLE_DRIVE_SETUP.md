# Google Drive 자동화 설정 가이드

## 개요

이 가이드는 Google Drive에서 자동으로 Excel 파일을 다운로드하고 대시보드에 임베드하는 시스템을 설정하는 방법을 설명합니다.

## 필요한 것

1. Google Cloud 프로젝트
2. Google Service Account
3. GitHub Secrets 설정

---

## 1단계: Google Cloud 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID 기록

## 2단계: Google Drive API 활성화

1. Google Cloud Console → **APIs & Services** → **Library**
2. "Google Drive API" 검색
3. **Enable** 클릭

## 3단계: Service Account 생성

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **Service Account**
3. 이름 입력: `rachgia-dashboard-automation`
4. **Create and Continue**
5. Role 선택: **Viewer** (또는 Skip)
6. **Done**

## 4단계: Service Account 키 생성

1. 생성된 Service Account 클릭
2. **Keys** 탭
3. **Add Key** → **Create new key**
4. **JSON** 선택 → **Create**
5. JSON 파일 다운로드 (안전하게 보관!)

## 5단계: Google Drive 폴더 공유

1. Google Drive에서 Excel 파일이 있는 폴더 열기
2. 폴더 우클릭 → **공유**
3. Service Account 이메일 추가:
   - 형식: `rachgia-dashboard-automation@YOUR-PROJECT.iam.gserviceaccount.com`
   - 권한: **뷰어**
4. **공유** 클릭

## 6단계: 폴더 ID 확인

Google Drive 폴더 URL에서 ID 추출:
```
https://drive.google.com/drive/folders/1ABC123xyz456
                                        ↑↑↑↑↑↑↑↑↑↑↑↑↑
                                        이 부분이 폴더 ID
```

## 7단계: GitHub Secrets 설정

GitHub 레포지토리 → **Settings** → **Secrets and variables** → **Actions**

### 필수 Secrets:

| Secret 이름 | 값 |
|------------|-----|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service Account JSON 파일 전체 내용 |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive 폴더 ID |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Service Account JSON |

### GOOGLE_SERVICE_ACCOUNT_KEY 설정 방법:

1. 다운로드한 JSON 파일 열기
2. 전체 내용 복사 (중괄호 포함)
3. GitHub Secret에 붙여넣기

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  ...
}
```

---

## 테스트

### 로컬 테스트

```bash
# 환경 변수 설정
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
export GOOGLE_DRIVE_FOLDER_ID='your-folder-id'

# 다운로드 테스트
python scripts/download_from_drive.py

# 임베드 테스트
python scripts/embed_data.py
```

### GitHub Actions 테스트

1. GitHub → **Actions** 탭
2. **Auto Build & Deploy** 워크플로우 선택
3. **Run workflow** 클릭

---

## 자동 실행 스케줄

- **매일 오전 6시 (KST)** 자동 실행
- Google Drive 파일 변경 시 자동 감지
- 새 데이터가 있을 때만 배포

---

## 문제 해결

### "Permission denied" 오류
- Service Account가 폴더에 공유되었는지 확인
- 이메일 주소가 정확한지 확인

### "File not found" 오류
- 폴더 ID가 올바른지 확인
- Excel 파일이 폴더에 있는지 확인
- 파일명에 "FACTORY A", "FACTORY B" 등이 포함되어 있는지 확인

### "Invalid credentials" 오류
- JSON 키가 완전히 복사되었는지 확인
- 줄바꿈이 제대로 처리되었는지 확인

---

## 파일 명명 규칙

Google Drive의 Excel 파일명에 다음 키워드가 포함되어야 합니다:

| 파일 키워드 | 대시보드 이름 |
|------------|--------------|
| `FACTORY A` | Factory_A.xlsx |
| `FACTORY B` | Factory_B.xlsx |
| `FACTORY C` | Factory_C.xlsx |
| `FACTORY D` | Factory_D.xlsx |

예: `A- LOADPLAN ASSEMBLY OF RACHGIA FACTORY A 12.20.2025.xlsx`

---

## 보안 주의사항

⚠️ **절대로 하지 말 것:**
- Service Account JSON을 코드에 커밋하지 마세요
- JSON 키를 공개 저장소에 공유하지 마세요
- 불필요한 권한을 부여하지 마세요

✅ **권장사항:**
- GitHub Secrets만 사용
- 최소 권한 원칙 (Viewer만 부여)
- 정기적인 키 로테이션
