# 🔒 Firebase 보안 설정 가이드

## 🚨 현재 보안 상태
- Firebase 프로젝트는 생성되어 있음
- **보안 규칙이 설정되지 않음** (위험!)
- 누구나 데이터에 접근 가능한 상태

## 🛡️ 보안 강화 단계

### 1단계: Firebase 콘솔에서 보안 규칙 적용

#### A. Firebase 콘솔 접속
1. https://console.firebase.google.com/project/auto-trading-app-53d4d 접속
2. 왼쪽 메뉴에서 **Firestore Database** 클릭
3. **규칙** 탭 클릭

#### B. 보안 규칙 적용
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 자동매매 설정 - 사용자 본인의 데이터만 접근 가능
    match /autoTradingConfigs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 거래 설정 - 사용자 본인의 데이터만 접근 가능
    match /tradingConfigs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 거래 로그 - 사용자 본인의 데이터만 접근 가능
    match /tradeLogs/{logId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // 기본 규칙: 인증된 사용자만 접근 가능
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### C. 규칙 게시
1. 위 규칙을 복사하여 붙여넣기
2. **게시** 버튼 클릭

### 2단계: 사용자 인증 활성화

#### A. Authentication 설정
1. Firebase 콘솔에서 **Authentication** 클릭
2. **로그인 방법** 탭 클릭
3. **이메일/비밀번호** 활성화
4. **사용자 등록** 활성화

#### B. 추가 보안 설정
- **이메일 확인** 활성화
- **비밀번호 재설정** 활성화
- **계정 삭제** 설정

### 3단계: 환경 변수 설정

#### A. .env 파일 생성
프로젝트 루트에 `.env` 파일 생성:

```env
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=AIzaSyDfUEfy03I3J5SMNUMhiT7TYdj6U3xRojo
REACT_APP_FIREBASE_AUTH_DOMAIN=auto-trading-app-53d4d.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=auto-trading-app-53d4d
REACT_APP_FIREBASE_STORAGE_BUCKET=auto-trading-app-53d4d.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=204528585884
REACT_APP_FIREBASE_APP_ID=1:204528585884:web:e62f7336748230d5f9f159
REACT_APP_FIREBASE_MEASUREMENT_ID=G-7ZZLEWR3G1
```

#### B. .env 파일 보호
- `.env` 파일을 `.gitignore`에 추가 (완료됨)
- Git에 커밋하지 않음

### 4단계: 보안 테스트

#### A. 인증 테스트
1. 웹사이트에서 회원가입/로그인 테스트
2. 로그인하지 않은 상태에서 데이터 접근 시도
3. 다른 사용자의 데이터 접근 시도

#### B. 권한 테스트
1. 본인의 데이터만 접근 가능한지 확인
2. 다른 사용자의 데이터는 접근 불가능한지 확인

## 🔐 추가 보안 권장사항

### 1. 2단계 인증 (2FA)
- SMS 인증
- Google Authenticator
- 이메일 인증

### 2. 세션 관리
- 자동 로그아웃 설정
- 세션 타임아웃 설정
- 동시 로그인 제한

### 3. 로그 모니터링
- Firebase 콘솔에서 접근 로그 확인
- 비정상적인 접근 패턴 모니터링

### 4. 정기적인 보안 점검
- API 키 정기 교체
- 보안 규칙 정기 검토
- 사용자 권한 정기 점검

## ⚠️ 중요 주의사항

1. **API 키를 절대 공개하지 마세요**
2. **.env 파일을 Git에 커밋하지 마세요**
3. **보안 규칙을 반드시 설정하세요**
4. **정기적으로 보안 점검을 하세요**

## 🎯 보안 체크리스트

- [ ] Firebase 보안 규칙 설정
- [ ] 사용자 인증 활성화
- [ ] 환경 변수 설정
- [ ] .gitignore 업데이트
- [ ] 보안 테스트 완료
- [ ] 2단계 인증 설정 (선택사항)

## 📞 문제 해결

보안 설정 중 문제가 발생하면:
1. Firebase 콘솔 오류 메시지 확인
2. 브라우저 개발자 도구 콘솔 확인
3. Firebase 문서 참조: https://firebase.google.com/docs/firestore/security

---

**보안은 한 번 설정하면 끝이 아닙니다. 정기적인 점검과 업데이트가 필요합니다!** 🔒
