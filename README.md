[us-kr-stock-auto-trading README.md](https://github.com/user-attachments/files/31296163/us-kr-stock-auto-trading.README.md)
# us-kr-stock-auto-trading — 주식 자동매매 웹 플랫폼

**한국투자증권(KIS) Open API**를 연동해 미국·국내 주식을 자동매매하는 웹 서비스입니다.
코드를 몰라도 전략을 만들 수 있는 **No-Code 전략 편집기**와,
직접 작성한 파이썬 전략을 안전하게 실행하는 **샌드박스 실행기**를 함께 제공합니다.

`2025` · 개인 프로젝트 · React + Flask + Express

<br>

## 시스템 구성

```
[Frontend]  React 18 + TypeScript
              Dashboard · AutoTrading · StrategyBuilder · Community · Board · MyPage
                    ↓
[API]       Express (server.js)     인증 · 게시판 · 커뮤니티
            Flask   (app.py)        KIS 연동 · 봇 제어 · 전략 실행   ← REST API 20개
                    ↓
[Engine]    Auto-ganggang.py (96KB)  자동매매 엔진
            code_executor.py         사용자 전략 샌드박스 실행
            kis_api_client.py        한국투자증권 API 클라이언트
                    ↓
[Data]      MySQL (거래·게시판) + Firebase (인증·실시간)
[Deploy]    Docker · nginx · Vercel
```

<br>

## 주요 기능

### 한국투자증권 API 연동 (`kis_api_client.py`)
- **해외주식**(나스닥 기준, USD) 잔고 · 현재가 · 차트 조회, **주문 전송**
- 국내주식 잔고 조회
- 접속 테스트 · 연결/해제 · 계좌 정보 · 주문 내역 · 체결 내역

### 자동매매 엔진 (`Auto-ganggang.py`)
| 구성 | 역할 |
|---|---|
| `TradingBot` | 매매 사이클 실행 |
| `MarketAnalyzer` | 시장 분석 · 매수 판단 |
| `StopLossManager` | 손절 · 익절 · 포지션 관리 |
| `TradingHistory` | 거래 기록 · 성과 집계 |
| `PaperTradingManager` | **모의투자** — 실계좌 없이 전략 검증 |
| `RateLimiter` | KIS API 호출 제한 관리 |
| `FileManager` | 파일락 기반 동시 접근 보호 |

- 공포탐욕지수(Fear & Greed) 연동
- 텔레그램 실시간 알림
- 캐시 데코레이터로 반복 조회 비용 절감

### No-Code 전략 편집기 (`StrategyBuilder.tsx`)
프로그래밍 지식 없이 **화면에서 조건을 조합해 매매 전략을 생성**합니다.
지표·조건·매매 액션을 블록처럼 배치하는 방식입니다.

### 사용자 코드 실행기 (`code_executor.py`)
직접 작성한 파이썬 전략을 실행하되, **AST 파싱으로 위험한 코드를 차단**합니다.

- 허용 모듈 화이트리스트 (`math` `random` `datetime` `json` `pandas` `numpy` …)
- 실행 전 구문 검사 → 미허용 import·호출 차단
- 실행 결과와 오류를 API로 반환

### 웹 서비스
- 대시보드 — 자산 현황 · 수익률 · 봇 상태
- 자동매매 — 봇 시작/정지, 실시간 로그
- 커뮤니티 · 게시판 — 전략 공유
- 마이페이지 — KIS API 키 · 텔레그램 · 알림 설정

<br>

## API (Flask)

```
POST  /api/kis/test-connection      접속 테스트
POST  /api/kis/connect              연결
GET   /api/kis/account-info         계좌 정보
GET   /api/kis/overseas-balance     해외주식 잔고
GET   /api/kis/stock-price          현재가
GET   /api/kis/stock-chart          차트 데이터
POST  /api/kis/place-order          주문 전송
GET   /api/kis/order-history        주문 내역
GET   /api/kis/execution-history    체결 내역

POST  /api/trading/execute-code     사용자 전략 실행
GET   /api/trading/code-status      실행 상태

POST  /api/bot/start · stop         봇 제어
GET   /api/bot/status · logs        상태 · 로그
GET   /api/settings                 설정 조회/저장
```

<br>

## 기술 스택

**Frontend** `React 18` `TypeScript` `styled-components` `framer-motion` `react-beautiful-dnd`
**Backend** `Flask` `Express` `Python` `Node.js`
**Database** `MySQL` `Firebase / Firestore`
**Infra** `Docker` `nginx` `Vercel`
**External** `한국투자증권 Open API` `Telegram Bot API`

<br>

## 실행

```bash
npm install
pip install -r requirements.txt

npm run dev          # 프론트 + Express 동시 실행
python app.py        # Flask API
```

환경변수(`.env`)에 KIS API 키, Firebase 설정, MySQL 접속 정보가 필요합니다.
자세한 설정은 [`KIS_API_SETUP.md`](KIS_API_SETUP.md), [`SETUP_GUIDE.md`](SETUP_GUIDE.md),
사용자 전략 작성법은 [`CUSTOM_CODE_GUIDE.md`](CUSTOM_CODE_GUIDE.md) 참고.

<br>

## 참고

- 실제 자금이 투입되는 주문 기능을 포함합니다. **모의투자(`PaperTradingManager`)로 충분히
  검증한 뒤 사용하는 것을 권합니다.**
- 개인 학습용 프로젝트이며, 투자 손실에 대한 책임은 사용자에게 있습니다.
