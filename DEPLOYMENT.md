# Rachgia Dashboard 배포 가이드

## 📋 사전 요구사항

1. **Firebase CLI** 설치
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Firebase 프로젝트** (Blaze 플랜 - Cloud Functions 사용 시 필요)

3. **Google Cloud Console** 설정
   - Google Sheets API 활성화
   - API Key 생성

---

## 🔧 환경 설정

### 1. React 앱 환경변수

```bash
cd react-app
cp .env.example .env.local
```

`.env.local` 파일 수정:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_GOOGLE_API_KEY=your_google_api_key
VITE_GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
```

### 2. Cloud Functions 환경변수

**방법 A: Firebase Config (권장)**
```bash
firebase functions:config:set \
  google.spreadsheet_id="YOUR_SPREADSHEET_ID" \
  google.api_key="YOUR_GOOGLE_API_KEY"
```

**방법 B: .env 파일**
```bash
cd react-app/functions
cp .env.example .env
# .env 파일 수정
```

---

## 📊 Google Sheets 구조

Cloud Functions가 읽을 수 있도록 시트를 구성하세요:

### 시트 이름
- `Factory A Data`
- `Factory B Data`
- `Factory C Data`
- `Factory D Data`

### 필수 컬럼 (첫 번째 행이 헤더)

| 컬럼명 | 설명 | 예시 |
|--------|------|------|
| `PO` | Purchase Order 번호 | PO-2024-001 |
| `Style` 또는 `Model` | 스타일/모델 코드 | ABC-123 |
| `Quantity` | 주문 수량 | 10000 |
| `CRD` | Customer Required Date | 2024-03-15 |
| `SDD` | Scheduled Delivery Date | 2024-03-10 |
| `Destination` | 배송지 | USA |
| `Factory` | 공장 코드 | A |
| `S_CUT` | 재단 완료 수량 | 8000 |
| `PRE_SEW` | 선봉 완료 수량 | 7500 |
| `SEW_INPUT` | 재봉 투입 수량 | 7000 |
| `SEW_BAL` | 재봉 완료 수량 | 6500 |
| `S_FIT` | 핏팅 완료 수량 | 6000 |
| `ASS_BAL` | 조립 완료 수량 | 5500 |
| `WH_IN` | 입고 수량 | 5000 |
| `WH_OUT` | 출고 수량 | 4500 |
| `Code04` | SDD 변경 승인 | Y/N |

### 지원되는 컬럼명 변형

```
PO: po, po_no, po#, purchase order
Quantity: qty, ttl_qty, total qty, order qty
CRD: customer required date, req date
SDD: scheduled delivery date, ship date, delivery date
등...
```

---

## 🚀 배포

### 전체 배포 (권장)
```bash
./deploy.sh --all
```

### 개별 배포
```bash
# Firestore 규칙만
./deploy.sh --firestore

# Cloud Functions만
./deploy.sh --functions

# React 앱만
./deploy.sh --hosting
```

### 수동 배포
```bash
# 1. React 앱 빌드
cd react-app
npm install
npm run build

# 2. Firebase 배포
cd ..
firebase deploy
```

---

## ⏰ Cloud Scheduler (자동 동기화)

Cloud Functions 배포 후 자동으로 설정됩니다:

| 함수 | 스케줄 | 설명 |
|------|--------|------|
| `syncProductionData` | 매 30분 | Sheets → Firestore 동기화 |
| `saveMonthlySnapshot` | 매월 1일 00:30 | 월별 히스토리 저장 |

### 수동 트리거
Firebase Console → Functions → 함수 선택 → "Run" 클릭

---

## 🔒 Firestore 보안 규칙

`firestore.rules`에 정의된 주요 규칙:

| 컬렉션 | 읽기 | 쓰기 | 설명 |
|--------|------|------|------|
| `productionCache` | 인증된 사용자 | Cloud Functions만 | 캐시 데이터 |
| `productionHistory` | 인증된 사용자 | Cloud Functions만 | 히스토리 |
| `userSettings` | 본인만 | 본인만 | 알림 설정 |
| `users` | 본인/관리자 | 관리자만 | 사용자 프로필 |

---

## 🐛 문제 해결

### Cloud Functions 로그 확인
```bash
firebase functions:log
```

### 로컬 테스트
```bash
cd react-app/functions
npm run serve
```

### 일반적인 문제

**1. Sheets API 오류**
- API가 활성화되어 있는지 확인
- API Key 권한 확인 (Sheets API 읽기 권한 필요)
- Spreadsheet가 "Anyone with link" 또는 서비스 계정과 공유되어 있는지 확인

**2. Functions 배포 실패**
- Blaze 플랜인지 확인
- `npm install` 실행 확인
- Node.js 버전 확인 (22.x 필요)

**3. CORS 오류**
- `getSyncStatus` 함수는 CORS 활성화됨
- 다른 함수는 `httpsCallable`로 호출해야 함

---

## 📈 모니터링

### Firebase Console
- Functions: 실행 횟수, 오류율, 실행 시간
- Firestore: 읽기/쓰기 횟수, 데이터 크기
- Hosting: 대역폭, 요청 수

### 알림 설정
Firebase Console → Cloud Monitoring → 알림 정책 생성

---

## 📁 프로젝트 구조

```
오더 현황 분석/
├── react-app/
│   ├── src/                    # React 소스
│   ├── functions/              # Cloud Functions
│   │   ├── index.js            # 함수 정의
│   │   ├── package.json
│   │   └── .env.example
│   ├── dist/                   # 빌드 출력
│   └── .env.local              # 환경변수
├── firebase.json               # Firebase 설정
├── firestore.rules             # Firestore 보안 규칙
├── firestore.indexes.json      # Firestore 인덱스
├── deploy.sh                   # 배포 스크립트
└── DEPLOYMENT.md               # 이 문서
```
