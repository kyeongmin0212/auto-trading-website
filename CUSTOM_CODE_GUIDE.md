# 사용자 정의 자동매매 코드 가이드

## 🚀 개요

이 가이드는 웹사이트에서 사용자 정의 자동매매 코드를 작성하고 실행하는 방법을 설명합니다.

## 📝 지원하는 코드 형식

- **Python (.py)**: 가장 권장되는 형식
- **텍스트 (.txt)**: 간단한 로직 설명
- **JavaScript (.js)**: 웹 기반 로직
- **TypeScript (.ts)**: 타입이 있는 JavaScript

## 🔒 보안 제한사항

### ❌ 사용 불가능한 기능
- `exec()`, `eval()`, `compile()` 등 코드 실행 함수
- `open()`, `file` 등 파일 시스템 접근
- `import`, `from` 등 모듈 임포트
- `input()`, `raw_input()` 등 사용자 입력
- `class`, `def` 등 함수/클래스 정의
- `global`, `nonlocal` 등 전역 변수 수정

### ✅ 사용 가능한 기능
- 기본 수학 함수: `math.*`, `random.*`
- 시간 관련: `datetime.*`, `time.*`
- 데이터 처리: `json.*`, `logging.*`
- 거래 관련 함수: `get_stock_price()`, `place_order()`, `get_balance()`, `log_trade()`

## 💡 기본 자동매매 코드 예시

### 1. 간단한 가격 모니터링

```python
# 주식 가격 모니터링 및 로깅
symbols = ['AAPL', 'GOOGL', 'MSFT']
prices = {}

for symbol in symbols:
    price = get_stock_price(symbol)
    prices[symbol] = price
    log_trade(f"{symbol} 현재가: ${price}")

# 평균 가격 계산
avg_price = sum(prices.values()) / len(prices)
log_trade(f"평균 가격: ${avg_price:.2f}")
```

### 2. 기본 매매 로직

```python
# 간단한 매매 전략
symbols = ['AAPL', 'GOOGL', 'MSFT']
prices = {}

# 현재가 조회
for symbol in symbols:
    prices[symbol] = get_stock_price(symbol)

# 매매 로직 실행
for symbol, price in prices.items():
    if price > 500:  # $500 이상이면 매도
        order = place_order(symbol, 'SELL', 10, price)
        log_trade(f"매도 주문: {symbol} {order['order_id']}")
    elif price < 200:  # $200 이하면 매수
        order = place_order(symbol, 'BUY', 10, price)
        log_trade(f"매수 주문: {symbol} {order['order_id']}")

# 잔고 확인
balance = get_balance()
log_trade(f"현재 현금: ${balance['cash']}")
```

### 3. 이동평균 기반 전략

```python
# 이동평균 기반 매매 전략
symbols = ['AAPL', 'GOOGL', 'MSFT']
short_period = 5
long_period = 20

for symbol in symbols:
    # 현재가 조회 (실제로는 과거 데이터가 필요)
    current_price = get_stock_price(symbol)
    
    # 간단한 이동평균 계산 (실제로는 과거 데이터 필요)
    # 여기서는 예시로 랜덤 값 사용
    import random
    short_ma = current_price * random.uniform(0.95, 1.05)
    long_ma = current_price * random.uniform(0.90, 1.10)
    
    # 골든 크로스 (단기선이 장기선을 상향 돌파)
    if short_ma > long_ma:
        order = place_order(symbol, 'BUY', 10, current_price)
        log_trade(f"골든크로스 매수: {symbol} {order['order_id']}")
    
    # 데드 크로스 (단기선이 장기선을 하향 돌파)
    elif short_ma < long_ma:
        order = place_order(symbol, 'SELL', 10, current_price)
        log_trade(f"데드크로스 매도: {symbol} {order['order_id']}")
```

### 4. 볼륨 기반 전략

```python
# 거래량 기반 매매 전략
symbols = ['AAPL', 'GOOGL', 'MSFT']

for symbol in symbols:
    price = get_stock_price(symbol)
    
    # 거래량이 급증했는지 확인 (실제로는 과거 거래량 데이터 필요)
    # 여기서는 예시로 랜덤 값 사용
    import random
    volume_ratio = random.uniform(0.5, 2.0)
    
    if volume_ratio > 1.5:  # 거래량이 1.5배 이상 증가
        if price > 300:  # 가격이 $300 이상이면 매도
            order = place_order(symbol, 'SELL', 10, price)
            log_trade(f"거래량 급증 매도: {symbol} {order['order_id']}")
        else:  # 가격이 낮으면 매수
            order = place_order(symbol, 'BUY', 10, price)
            log_trade(f"거래량 급증 매수: {symbol} {order['order_id']}")
```

## 🛠️ 사용 방법

### 1. 코드 파일 업로드
1. "자동매매 설정" 페이지로 이동
2. "사용자 정의 자동매매 코드" 섹션에서 파일 업로드
3. `.py`, `.txt`, `.js`, `.ts` 파일을 드래그 앤 드롭 또는 클릭하여 업로드

### 2. 코드 편집
1. 업로드된 코드를 "보기" 또는 "수정" 버튼으로 편집
2. 코드 내용, 이름, 설명을 수정
3. "저장" 버튼으로 변경사항 저장

### 3. 코드 실행
1. "시작" 버튼을 클릭하여 코드 활성화
2. 코드가 백엔드에서 안전하게 실행됨
3. 실행 결과는 로그에 기록됨

### 4. 코드 관리
- **활성화/비활성화**: 시작/중지 버튼으로 제어
- **다운로드**: 원본 파일로 다운로드 가능
- **삭제**: 불필요한 코드 제거

## 📊 실행 결과 확인

### 로그 확인
- `log_trade()` 함수로 기록된 메시지 확인
- 실행 시간 및 처리된 심볼 수 확인
- 오류 발생 시 상세한 오류 메시지 제공

### 성능 모니터링
- 코드 실행 시간 측정
- 처리된 심볼 수 추적
- 메모리 사용량 모니터링

## ⚠️ 주의사항

### 1. 코드 안전성
- 위험한 함수나 키워드 사용 금지
- 무한 루프나 과도한 연산 방지
- 적절한 예외 처리 구현

### 2. API 제한
- 한국투자증권 API 호출 제한 준수
- 과도한 주문 전송 방지
- 적절한 딜레이 및 제한 설정

### 3. 테스트
- 실제 거래 전 충분한 테스트 진행
- 소액으로 시작하여 점진적 확대
- 백테스팅 결과 검증

## 🔧 고급 기능

### 1. 조건부 실행
```python
# 특정 시간에만 실행
import datetime
now = datetime.datetime.now()

if now.hour >= 9 and now.hour <= 16:  # 거래 시간에만 실행
    # 매매 로직 실행
    pass
```

### 2. 에러 처리
```python
try:
    price = get_stock_price('AAPL')
    if price > 500:
        order = place_order('AAPL', 'SELL', 10, price)
        log_trade(f"매도 성공: {order['order_id']}")
except Exception as e:
    log_trade(f"오류 발생: {str(e)}")
```

### 3. 데이터 저장
```python
# 거래 기록 저장
trades = []
for symbol in ['AAPL', 'GOOGL']:
    price = get_stock_price(symbol)
    trade_info = {
        'symbol': symbol,
        'price': price,
        'timestamp': datetime.datetime.now().isoformat()
    }
    trades.append(trade_info)

log_trade(f"거래 기록: {len(trades)}건")
```

## 📞 지원 및 문의

코드 작성이나 실행 중 문제가 발생하면:
1. 오류 메시지 확인
2. 코드 구문 검증
3. 보안 제한사항 준수 여부 확인
4. 필요시 개발팀에 문의

## 🎯 모범 사례

1. **명확한 주석**: 코드의 목적과 로직을 명확히 설명
2. **적절한 로깅**: 중요한 단계마다 로그 기록
3. **에러 처리**: 예외 상황에 대한 적절한 처리
4. **성능 최적화**: 불필요한 연산 최소화
5. **테스트**: 다양한 시나리오에 대한 테스트 진행

이 가이드를 참고하여 안전하고 효율적인 자동매매 코드를 작성하세요! 🚀
