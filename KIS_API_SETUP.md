# 한국투자증권 해외주식 API 설정 가이드

## 1. 한국투자증권 API 키 발급

### 1.1 Open API 신청
1. 한국투자증권 홈페이지 (https://www.koreainvestment.com) 접속
2. 로그인 후 "Open API" 메뉴 접속
3. "해외주식" API 신청
4. 신청서 작성 및 제출

### 1.2 API 키 확인
- App Key (앱 키)
- App Secret (앱 시크릿)
- 계좌번호 (해외주식 계좌)
- 계좌 코드 (보통 "01")

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# 한국투자증권 API 설정
KIS_APP_KEY=your_app_key_here
KIS_APP_SECRET=your_app_secret_here
KIS_ACCOUNT_NUMBER=your_account_number_here
KIS_ACCOUNT_CODE=01

# 서버 설정
PORT=5000
FLASK_ENV=development
```

## 3. Python 의존성 설치

```bash
pip install -r requirements.txt
```

## 4. 백엔드 서버 실행

```bash
python app.py
```

서버가 포트 5000에서 실행됩니다.

## 5. 프론트엔드에서 API 사용

웹사이트의 "자동매매 설정" 페이지에서 한국투자증권 API 정보를 입력하고 연결할 수 있습니다.

## 6. API 엔드포인트

### 6.1 연결 테스트
- **POST** `/api/kis/test-connection`
- API 연결 상태를 테스트합니다.

### 6.2 API 연결
- **POST** `/api/kis/connect`
- 한국투자증권 API에 연결합니다.

### 6.3 연결 해제
- **POST** `/api/kis/disconnect`
- API 연결을 해제합니다.

### 6.4 계좌 정보 조회
- **GET** `/api/kis/account-info`
- 계좌 정보를 조회합니다.

### 6.5 해외주식 잔고 조회
- **GET** `/api/kis/overseas-balance`
- 해외주식 잔고를 조회합니다.

### 6.6 주식 현재가 조회
- **GET** `/api/kis/stock-price?symbol=AAPL&exchange=NASD`
- 특정 주식의 현재가를 조회합니다.

### 6.7 주식 차트 데이터 조회
- **GET** `/api/kis/stock-chart?symbol=AAPL&exchange=NASD&interval=D&period=30`
- 주식 차트 데이터를 조회합니다.

### 6.8 주문 전송
- **POST** `/api/kis/place-order`
- 해외주식 주문을 전송합니다.

### 6.9 주문 내역 조회
- **GET** `/api/kis/order-history?startDate=20240101&endDate=20240131`
- 주문 내역을 조회합니다.

### 6.10 체결 내역 조회
- **GET** `/api/kis/execution-history?startDate=20240101&endDate=20240131`
- 체결 내역을 조회합니다.

## 7. 지원하는 거래소

- **NASD**: NASDAQ (나스닥)
- **NYSE**: NYSE (뉴욕증권거래소)
- **AMEX**: AMEX (아메리칸증권거래소)
- **LSE**: LSE (런던증권거래소)
- **TSE**: TSE (도쿄증권거래소)
- **HKEX**: HKEX (홍콩증권거래소)
- **SSE**: SSE (상해증권거래소)
- **SZSE**: SZSE (심천증권거래소)

## 8. 주의사항

1. **API 키 보안**: API 키는 절대 공개하지 마세요.
2. **거래 제한**: 실제 거래 전에 충분한 테스트를 진행하세요.
3. **API 호출 제한**: 한국투자증권의 API 호출 제한을 확인하세요.
4. **에러 처리**: API 응답의 에러 코드를 확인하고 적절히 처리하세요.

## 9. 문제 해결

### 9.1 연결 실패
- API 키와 시크릿이 올바른지 확인
- 계좌번호와 계좌 코드가 정확한지 확인
- 네트워크 연결 상태 확인

### 9.2 인증 오류
- 액세스 토큰이 만료되었는지 확인
- API 키 권한 설정 확인

### 9.3 주문 오류
- 주문 파라미터가 올바른지 확인
- 계좌 잔고 확인
- 거래 시간 확인

## 10. 개발자 정보

이 API 클라이언트는 한국투자증권의 공식 API 문서를 기반으로 개발되었습니다.
추가 기능이나 수정이 필요한 경우 이슈를 등록해 주세요.
