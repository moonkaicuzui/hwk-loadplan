# Rachgia Dashboard Security Checklist

보안 검증 체크리스트 (v19.0.0)

## XSS (Cross-Site Scripting) 방지

### 완료 항목 ✅
- [x] `escapeHtml()` 함수 구현 및 사용
- [x] 사용자 입력 데이터 이스케이프 처리
- [x] innerHTML 대신 textContent 사용 권장
- [x] CSP (Content Security Policy) 헤더 설정

### 검증 항목
```javascript
// escapeHtml 함수 위치: rachgia_v18_improvements.js
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
```

## CSP (Content Security Policy)

### 현재 설정 (rachgia_dashboard_v19.html:6)
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval'
        https://cdn.tailwindcss.com
        https://cdn.jsdelivr.net
        https://cdnjs.cloudflare.com
        https://accounts.google.com
        https://apis.google.com
        https://www.gstatic.com
        https://*.firebasedatabase.app;
    style-src 'self' 'unsafe-inline'
        https://cdn.tailwindcss.com
        https://accounts.google.com;
    img-src 'self' data: blob:;
    font-src 'self' data:;
    connect-src 'self'
        https://www.googleapis.com
        https://accounts.google.com
        https://drive.google.com
        https://*.firebaseio.com
        wss://*.firebaseio.com
        https://*.firebasedatabase.app
        wss://*.firebasedatabase.app
        https://identitytoolkit.googleapis.com
        https://securetoken.googleapis.com;
    frame-src
        https://accounts.google.com
        https://*.firebaseapp.com;
">
```

### 향후 개선 권장사항
- [ ] `'unsafe-inline'` 제거 및 nonce/hash 기반 스크립트 허용
- [ ] `'unsafe-eval'` 제거 (가능한 경우)
- [ ] 외부 CDN을 서브리소스 무결성(SRI) 해시로 검증

## 인증 및 권한

### Firebase Authentication
- [x] Firebase Auth 초기화
- [x] Google OAuth 연동
- [x] 로그인 상태 확인

### 권한 검증
- [x] 로그인 오버레이 (loginOverlay)
- [ ] 역할 기반 접근 제어 (RBAC) - 향후 구현

## 데이터 보호

### 민감 데이터 처리
- [x] 환경 변수 분리 (.env 파일)
- [x] API 키 노출 최소화
- [x] 클라이언트 사이드 데이터 검증

### 저장소 보안
- [ ] localStorage 데이터 암호화 검토
- [x] 세션 만료 처리

## 네트워크 보안

### HTTPS
- [x] 프로덕션 환경 HTTPS 강제
- [x] 안전하지 않은 콘텐츠 차단

### API 통신
- [x] Firebase Realtime Database 규칙 설정
- [x] Google Sheets API 인증

## 입력 검증

### 클라이언트 사이드
- [x] 숫자 입력 검증 (minQty, maxQty)
- [x] 날짜 입력 검증 (startDate, endDate)
- [x] 검색어 sanitization

### 서버 사이드 (Firebase)
- [x] Database Rules 설정
- [ ] Cloud Functions 입력 검증 (향후)

## 종속성 보안

### npm 패키지
```bash
# 취약점 검사
npm audit

# 취약점 자동 수정
npm audit fix
```

### CDN 라이브러리
| 라이브러리 | 버전 | SRI 해시 |
|-----------|------|---------|
| Chart.js | latest | - |
| XLSX | 0.18.5 | - |
| jsPDF | 2.5.1 | - |
| Firebase | 10.7.1 | - |
| Tailwind CSS | latest | - |

## 보안 테스트

### 수동 테스트
1. XSS 페이로드 테스트
   ```
   <script>alert('xss')</script>
   <img onerror="alert('xss')" src="x">
   javascript:alert('xss')
   ```

2. CSRF 테스트
   - Firebase Auth 토큰 검증

3. 인젝션 테스트
   - 필터 입력 필드 검증

### 자동화 테스트
```bash
# Lighthouse 보안 감사
npm run lighthouse
```

## 보안 헤더 (.htaccess)

```apache
# 보안 헤더 추가 권장
Header always set X-Content-Type-Options "nosniff"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

## 정기 점검 일정

- **월간**: npm audit 실행
- **분기별**: 보안 체크리스트 검토
- **반기별**: 침투 테스트 (필요시)

---

*마지막 검토: 2026-02-02*
*담당자: Development Team*
