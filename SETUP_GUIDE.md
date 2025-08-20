# 자동매매 웹사이트 ↔ Python 코드 연결 가이드

## 개요
이 가이드는 웹사이트에서 설정한 자동매매 파라미터들을 Python 자동매매 코드에 실시간으로 전달하는 방법을 설명합니다.

## 🔗 연결 방식

### 1. Firebase 실시간 데이터베이스 방식 (추천)
- **장점**: 실시간 동기화, 안정적, 설정 간단
- **단점**: Firebase 사용료 발생 가능

### 2. REST API 방식
- **장점**: 완전한 제어, 커스터마이징 가능
- **단점**: 서버 구축 필요, 더 복잡

### 3. WebSocket 방식
- **장점**: 실시간 양방향 통신
- **단점**: 연결 관리 복잡

## 🚀 설정 단계

### 1. Firebase 프로젝트 설정

#### 1.1 Firebase 콘솔에서 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성
3. Firestore Database 활성화

#### 1.2 웹사이트 Firebase 설정
```typescript
// src/firebase/config.ts 수정
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

#### 1.3 Python 클라이언트 설정
1. Firebase 콘솔 → 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. 다운로드된 JSON 파일을 `serviceAccountKey.json`으로 저장
4. `trading_client.py`에서 경로 수정:
```python
service_account_path = "path/to/your/serviceAccountKey.json"
user_id = "your-user-id"
```

### 2. Python 환경 설정

#### 2.1 의존성 설치
```bash
pip install -r requirements.txt
```

#### 2.2 환경 변수 설정 (.env 파일)
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
USER_ID=your-user-id
BINANCE_API_KEY=your-binance-api-key
BINANCE_SECRET_KEY=your-binance-secret-key
```

### 3. 웹사이트 실행
```bash
npm start
```

### 4. Python 자동매매 봇 실행
```bash
python trading_client.py
```

## 📊 데이터 흐름

```
웹사이트 설정 변경
        ↓
    Firebase 저장
        ↓
Python 봇 실시간 감지
        ↓
    자동매매 로직 실행
        ↓
    거래 결과 Firebase 저장
        ↓
    웹사이트에서 결과 확인
```

## 🔧 주요 기능

### 웹사이트에서 설정 가능한 항목
- **API 설정**: 거래소, API Key, Secret
- **지표 설정**: RSI, MACD, 볼린저 밴드 파라미터
- **리스크 관리**: 손절/익절 비율, 최대 거래 금액
- **알림 설정**: 이메일, 푸시, 텔레그램

### Python 봇에서 처리하는 항목
- 실시간 설정 감지
- 지표 계산 (RSI, MACD 등)
- 매매 신호 생성
- 거래 실행
- 결과 로깅

## 📝 사용 예시

### 1. 웹사이트에서 설정 변경
1. 자동매매 페이지 접속
2. RSI 기간을 14에서 21로 변경
3. 손절 비율을 5%에서 3%로 변경
4. "설정 저장" 클릭

### 2. Python 봇에서 자동 적용
```python
# 설정이 자동으로 업데이트됨
def on_config_changed(self, config):
    rsi_period = config['indicators']['rsi']['period']  # 21
    stop_loss = config['riskManagement']['stopLossPercentage']  # 3.0
    
    # 새로운 설정으로 거래 로직 실행
    self.run_trading_logic()
```

## 🔒 보안 고려사항

### 1. API 키 보안
- API 키는 암호화하여 저장
- 읽기 전용 권한만 부여
- 정기적인 키 로테이션

### 2. Firebase 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tradingConfigs/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /tradeLogs/{logId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🐛 문제 해결

### 1. Firebase 연결 오류
```bash
# 서비스 계정 파일 경로 확인
ls -la serviceAccountKey.json

# Firebase 프로젝트 ID 확인
cat serviceAccountKey.json | grep project_id
```

### 2. 실시간 리스너가 작동하지 않음
```python
# 로그 레벨 확인
logging.basicConfig(level=logging.DEBUG)

# 네트워크 연결 확인
import requests
response = requests.get('https://firestore.googleapis.com')
print(response.status_code)
```

### 3. 설정이 업데이트되지 않음
- 웹사이트에서 설정 저장 확인
- Firebase 콘솔에서 데이터 확인
- Python 봇 로그 확인

## 📈 확장 가능한 기능

### 1. 추가 지표
- 이동평균선 (MA)
- 스토캐스틱 (Stochastic)
- 볼륨 지표

### 2. 고급 기능
- 백테스팅
- 포트폴리오 관리
- 다중 거래소 지원

### 3. 모니터링
- 실시간 수익률 추적
- 거래 히스토리 분석
- 성능 대시보드

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Firebase 콘솔에서 오류 로그
2. Python 봇 콘솔 출력
3. 웹사이트 개발자 도구 콘솔
4. 네트워크 연결 상태
