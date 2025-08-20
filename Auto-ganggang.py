import os
import sys
from dotenv import load_dotenv
import pandas as pd
import json
try:
    from openai import OpenAI
except ImportError:
    # OpenAI 라이브러리가 없는 경우를 위한 대체
    class OpenAI:
        def __init__(self, api_key=None):
            self.api_key = api_key
            print("Warning: OpenAI library not available. AI features will be limited.")
import ta
import time
import requests
from datetime import datetime, timedelta
import telegram
import numpy as np
from concurrent.futures import ThreadPoolExecutor
import logging
from tenacity import retry, stop_after_attempt, wait_exponential
import threading
import hashlib
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import pytz
import signal

# Firebase 설정을 위한 추가 라이브러리
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Warning: Firebase library not available. Using .env file instead.")


# Windows 콘솔에서 유니코드 지원
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_trading_bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# TensorFlow 경고 메시지 숨기기
import warnings
warnings.filterwarnings('ignore', category=UserWarning, module='keras')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # TensorFlow 로그 레벨 조정

# 환경 변수 로드 (백업용)
load_dotenv()

# Firebase 설정 로드 함수
def load_firebase_config():
    """Firebase에서 자동매매 설정을 로드합니다."""
    if not FIREBASE_AVAILABLE:
        logger.warning("Firebase를 사용할 수 없습니다. .env 파일을 사용합니다.")
        return None
    
    try:
        # Firebase 초기화 (이미 초기화되어 있지 않은 경우)
        if not firebase_admin._apps:
            # 서비스 계정 키 파일이 있는지 확인
            service_account_path = "firebase-service-account.json"
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)
            else:
                logger.warning("Firebase 서비스 계정 키 파일을 찾을 수 없습니다. .env 파일을 사용합니다.")
                return None
        
        db = firestore.client()
        
        # 사용자 이메일을 환경변수에서 가져오기 (또는 기본값 사용)
        user_email = os.getenv("USER_EMAIL", "default@example.com")
        
        # autoTradingConfigs 컬렉션에서 설정 가져오기
        config_doc = db.collection('autoTradingConfigs').document(user_email).get()
        
        if config_doc.exists:
            config_data = config_doc.to_dict()
            logger.info(f"Firebase에서 설정을 성공적으로 로드했습니다: {user_email}")
            return config_data
        else:
            logger.warning(f"Firebase에서 설정을 찾을 수 없습니다: {user_email}")
            return None
            
    except Exception as e:
        logger.error(f"Firebase 설정 로드 중 오류 발생: {e}")
        return None

# 상수 정의
STOCKS_FILE = "purchased_stocks.json"
TRADE_HISTORY_FILE = "trade_history.json"
POSITIONS_FILE = "positions.json"
CACHE_DIR = "api_cache"
TOKEN_FILE = "kis_token.json"

# 캐시 디렉토리 생성
os.makedirs(CACHE_DIR, exist_ok=True)

# 설정 로드 함수
def load_trading_config():
    """Firebase 또는 .env 파일에서 자동매매 설정을 로드합니다."""
    # Firebase에서 설정 시도
    firebase_config = load_firebase_config()
    
    if firebase_config:
        # Firebase 설정 사용
        config = {
            'TELEGRAM_TOKEN': firebase_config.get('telegramToken', ''),
            'TELEGRAM_CHAT_ID': firebase_config.get('telegramChatId', ''),
            'OPENAI_API_KEY': firebase_config.get('openaiApiKey', ''),
            'KIS_APP_KEY': firebase_config.get('kisAppKey', ''),
            'KIS_APP_SECRET': firebase_config.get('kisAppSecret', ''),
            'KIS_ACCOUNT_NUMBER': firebase_config.get('kisAccountNumber', ''),
            'PAPER_TRADING': firebase_config.get('paperTrading', True),
            'PAPER_TRADING_BALANCE': int(firebase_config.get('paperTradingBalance', 1000000)),
            'MAX_STOCKS': int(firebase_config.get('maxStocks', 5)),
            'STOP_LOSS_PERCENTAGE': float(firebase_config.get('stopLossPercentage', 5)),
            'TAKE_PROFIT_PERCENTAGE': float(firebase_config.get('takeProfitPercentage', 10)),
            'DCA_PERCENTAGE': float(firebase_config.get('dcaPercentage', 10)),
            'AI_SCORE_THRESHOLD': int(firebase_config.get('aiScoreThreshold', 50)),
            'INVESTMENT_RATIO': float(firebase_config.get('investmentRatio', 5)),
            'TARGET_MARKET': firebase_config.get('targetMarket', 'NASDAQ'),
            'TRADING_HOURS_START': int(firebase_config.get('tradingHoursStart', 17)),
            'TRADING_HOURS_END': int(firebase_config.get('tradingHoursEnd', 2)),
            'RSI_PERIOD': int(firebase_config.get('rsiPeriod', 14)),
            'MACD_FAST': int(firebase_config.get('macdFast', 12)),
            'MACD_SLOW': int(firebase_config.get('macdSlow', 26)),
            'MACD_SIGNAL': int(firebase_config.get('macdSignal', 9)),
            'BOLLINGER_PERIOD': int(firebase_config.get('bollingerPeriod', 20)),
            'BOLLINGER_STD': float(firebase_config.get('bollingerStd', 2)),
            'VOLUME_MA_PERIOD': int(firebase_config.get('volumeMaPeriod', 20)),
            'IS_ACTIVE': firebase_config.get('isActive', False)
        }
        logger.info("Firebase 설정을 사용합니다.")
    else:
        # .env 파일 설정 사용 (백업)
        config = {
            'TELEGRAM_TOKEN': os.getenv("TELEGRAM_TOKEN", ''),
            'TELEGRAM_CHAT_ID': os.getenv("TELEGRAM_CHAT_ID", ''),
            'OPENAI_API_KEY': os.getenv("OPENAI_API_KEY", ''),
            'KIS_APP_KEY': os.getenv("KIS_APP_KEY", ''),
            'KIS_APP_SECRET': os.getenv("KIS_APP_SECRET", ''),
            'KIS_ACCOUNT_NUMBER': os.getenv("KIS_ACCOUNT_NUMBER", ''),
            'PAPER_TRADING': os.getenv("PAPER_TRADING", "True").lower() == "true",
            'PAPER_TRADING_BALANCE': int(os.getenv("PAPER_TRADING_BALANCE", "1000000")),
            'MAX_STOCKS': int(os.getenv("MAX_STOCKS", "5")),
            'STOP_LOSS_PERCENTAGE': float(os.getenv("STOP_LOSS_PERCENTAGE", "5")),
            'TAKE_PROFIT_PERCENTAGE': float(os.getenv("TAKE_PROFIT_PERCENTAGE", "10")),
            'DCA_PERCENTAGE': float(os.getenv("DCA_PERCENTAGE", "10")),
            'AI_SCORE_THRESHOLD': int(os.getenv("AI_SCORE_THRESHOLD", "50")),
            'INVESTMENT_RATIO': float(os.getenv("INVESTMENT_RATIO", "5")),
            'TARGET_MARKET': os.getenv("TARGET_MARKET", "NASDAQ"),
            'TRADING_HOURS_START': int(os.getenv("TRADING_HOURS_START", "17")),
            'TRADING_HOURS_END': int(os.getenv("TRADING_HOURS_END", "2")),
            'RSI_PERIOD': int(os.getenv("RSI_PERIOD", "14")),
            'MACD_FAST': int(os.getenv("MACD_FAST", "12")),
            'MACD_SLOW': int(os.getenv("MACD_SLOW", "26")),
            'MACD_SIGNAL': int(os.getenv("MACD_SIGNAL", "9")),
            'BOLLINGER_PERIOD': int(os.getenv("BOLLINGER_PERIOD", "20")),
            'BOLLINGER_STD': float(os.getenv("BOLLINGER_STD", "2")),
            'VOLUME_MA_PERIOD': int(os.getenv("VOLUME_MA_PERIOD", "20")),
            'IS_ACTIVE': os.getenv("IS_ACTIVE", "False").lower() == "true"
        }
        logger.info(".env 파일 설정을 사용합니다.")
    
    return config

# 설정 로드
TRADING_CONFIG = load_trading_config()

# API 키 설정
TELEGRAM_TOKEN = TRADING_CONFIG['TELEGRAM_TOKEN']
TELEGRAM_CHAT_ID = TRADING_CONFIG['TELEGRAM_CHAT_ID']
OPENAI_API_KEY = TRADING_CONFIG['OPENAI_API_KEY']
KIS_APP_KEY = TRADING_CONFIG['KIS_APP_KEY']
KIS_APP_SECRET = TRADING_CONFIG['KIS_APP_SECRET']
KIS_ACCOUNT_NUMBER = TRADING_CONFIG['KIS_ACCOUNT_NUMBER']

# 자동매매 설정
PAPER_TRADING = TRADING_CONFIG['PAPER_TRADING']
PAPER_TRADING_BALANCE = TRADING_CONFIG['PAPER_TRADING_BALANCE']
MAX_STOCKS = TRADING_CONFIG['MAX_STOCKS']
STOP_LOSS_PERCENTAGE = TRADING_CONFIG['STOP_LOSS_PERCENTAGE']
TAKE_PROFIT_PERCENTAGE = TRADING_CONFIG['TAKE_PROFIT_PERCENTAGE']
DCA_PERCENTAGE = TRADING_CONFIG['DCA_PERCENTAGE']
AI_SCORE_THRESHOLD = TRADING_CONFIG['AI_SCORE_THRESHOLD']
INVESTMENT_RATIO = TRADING_CONFIG['INVESTMENT_RATIO']
TARGET_MARKET = TRADING_CONFIG['TARGET_MARKET']
TRADING_HOURS_START = TRADING_CONFIG['TRADING_HOURS_START']
TRADING_HOURS_END = TRADING_CONFIG['TRADING_HOURS_END']
RSI_PERIOD = TRADING_CONFIG['RSI_PERIOD']
MACD_FAST = TRADING_CONFIG['MACD_FAST']
MACD_SLOW = TRADING_CONFIG['MACD_SLOW']
MACD_SIGNAL = TRADING_CONFIG['MACD_SIGNAL']
BOLLINGER_PERIOD = TRADING_CONFIG['BOLLINGER_PERIOD']
BOLLINGER_STD = TRADING_CONFIG['BOLLINGER_STD']
VOLUME_MA_PERIOD = TRADING_CONFIG['VOLUME_MA_PERIOD']
IS_ACTIVE = TRADING_CONFIG['IS_ACTIVE']

# 실시간 설정 업데이트 함수
def update_trading_config():
    """Firebase에서 최신 설정을 가져와서 현재 설정을 업데이트합니다."""
    global TRADING_CONFIG, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, OPENAI_API_KEY, KIS_APP_KEY, KIS_APP_SECRET, KIS_ACCOUNT_NUMBER
    global PAPER_TRADING, PAPER_TRADING_BALANCE, MAX_STOCKS, STOP_LOSS_PERCENTAGE, TAKE_PROFIT_PERCENTAGE
    global DCA_PERCENTAGE, AI_SCORE_THRESHOLD, INVESTMENT_RATIO, TARGET_MARKET, TRADING_HOURS_START, TRADING_HOURS_END
    global RSI_PERIOD, MACD_FAST, MACD_SLOW, MACD_SIGNAL, BOLLINGER_PERIOD, BOLLINGER_STD, VOLUME_MA_PERIOD, IS_ACTIVE
    
    try:
        new_config = load_firebase_config()
        if new_config:
            # 설정 업데이트
            TRADING_CONFIG = new_config
            TELEGRAM_TOKEN = new_config.get('telegramToken', TELEGRAM_TOKEN)
            TELEGRAM_CHAT_ID = new_config.get('telegramChatId', TELEGRAM_CHAT_ID)
            OPENAI_API_KEY = new_config.get('openaiApiKey', OPENAI_API_KEY)
            KIS_APP_KEY = new_config.get('kisAppKey', KIS_APP_KEY)
            KIS_APP_SECRET = new_config.get('kisAppSecret', KIS_APP_SECRET)
            KIS_ACCOUNT_NUMBER = new_config.get('kisAccountNumber', KIS_ACCOUNT_NUMBER)
            PAPER_TRADING = new_config.get('paperTrading', PAPER_TRADING)
            PAPER_TRADING_BALANCE = int(new_config.get('paperTradingBalance', PAPER_TRADING_BALANCE))
            MAX_STOCKS = int(new_config.get('maxStocks', MAX_STOCKS))
            STOP_LOSS_PERCENTAGE = float(new_config.get('stopLossPercentage', STOP_LOSS_PERCENTAGE))
            TAKE_PROFIT_PERCENTAGE = float(new_config.get('takeProfitPercentage', TAKE_PROFIT_PERCENTAGE))
            DCA_PERCENTAGE = float(new_config.get('dcaPercentage', DCA_PERCENTAGE))
            AI_SCORE_THRESHOLD = int(new_config.get('aiScoreThreshold', AI_SCORE_THRESHOLD))
            INVESTMENT_RATIO = float(new_config.get('investmentRatio', INVESTMENT_RATIO))
            TARGET_MARKET = new_config.get('targetMarket', TARGET_MARKET)
            TRADING_HOURS_START = int(new_config.get('tradingHoursStart', TRADING_HOURS_START))
            TRADING_HOURS_END = int(new_config.get('tradingHoursEnd', TRADING_HOURS_END))
            RSI_PERIOD = int(new_config.get('rsiPeriod', RSI_PERIOD))
            MACD_FAST = int(new_config.get('macdFast', MACD_FAST))
            MACD_SLOW = int(new_config.get('macdSlow', MACD_SLOW))
            MACD_SIGNAL = int(new_config.get('macdSignal', MACD_SIGNAL))
            BOLLINGER_PERIOD = int(new_config.get('bollingerPeriod', BOLLINGER_PERIOD))
            BOLLINGER_STD = float(new_config.get('bollingerStd', BOLLINGER_STD))
            VOLUME_MA_PERIOD = int(new_config.get('volumeMaPeriod', VOLUME_MA_PERIOD))
            IS_ACTIVE = new_config.get('isActive', IS_ACTIVE)
            
            logger.info("설정이 성공적으로 업데이트되었습니다.")
            return True
    except Exception as e:
        logger.error(f"설정 업데이트 중 오류 발생: {e}")
    
    return False

logger.info("Checking API keys...")
missing_keys = []
if not TELEGRAM_TOKEN: missing_keys.append("TELEGRAM_TOKEN")
if not TELEGRAM_CHAT_ID: missing_keys.append("TELEGRAM_CHAT_ID")
if not OPENAI_API_KEY: missing_keys.append("OPENAI_API_KEY")
if not KIS_APP_KEY: missing_keys.append("KIS_APP_KEY")
if not KIS_APP_SECRET: missing_keys.append("KIS_APP_SECRET")
if not KIS_ACCOUNT_NUMBER: missing_keys.append("KIS_ACCOUNT_NUMBER")
if missing_keys:
    logger.error(f"Missing API keys: {', '.join(missing_keys)}")
    logger.warning("웹사이트 설정에서 API 키를 설정하거나 .env 파일을 확인하세요.")
    # 개발 모드에서는 경고만 출력하고 계속 진행
    if not PAPER_TRADING:
        logger.error("실제 거래 모드에서는 모든 API 키가 필요합니다.")
        raise ValueError("One or more API keys are missing from .env file")

# 한국투자증권 API 설정
KIS_BASE_URL = "https://openapi.koreainvestment.com:9443"
KIS_TOKEN_URL = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"

# 해외 주식 API 설정 (웹사이트 설정에서 로드)
OVERSEAS_BASE_URL = "https://openapi.koreainvestment.com:9443"
OVERSEAS_MARKET_CODE = "NAS" if TARGET_MARKET == "NASDAQ" else "NYS"  # NASDAQ 또는 NYSE

# 페이퍼 트레이딩 설정 (웹사이트 설정에서 로드)
# PAPER_TRADING = True  # True: 페이퍼 트레이딩, False: 실제 거래
# PAPER_TRADING_BALANCE = 1000000  # 페이퍼 트레이딩 초기 자금 (백만원)

# 프로그램 종료 플래그
SHUTDOWN_REQUESTED = False

# 웹사이트 설정 로그 출력
logger.info("=== 웹사이트 설정 로드 완료 ===")
logger.info(f"페이퍼 트레이딩: {PAPER_TRADING}")
logger.info(f"페이퍼 트레이딩 초기 자금: {PAPER_TRADING_BALANCE:,}원")
logger.info(f"최대 보유 종목: {MAX_STOCKS}개")
logger.info(f"손절 비율: {STOP_LOSS_PERCENTAGE}%")
logger.info(f"익절 비율: {TAKE_PROFIT_PERCENTAGE}%")
logger.info(f"DCA 실행 비율: {DCA_PERCENTAGE}%")
logger.info(f"AI 점수 임계값: {AI_SCORE_THRESHOLD}/100")
logger.info(f"기본 투자 비율: {INVESTMENT_RATIO}%")
logger.info(f"대상 시장: {TARGET_MARKET}")
logger.info(f"거래 시간: {TRADING_HOURS_START}시 ~ {TRADING_HOURS_END}시")
logger.info("================================")

# 종료 모니터링 스레드
def exit_monitor():
    """별도 스레드에서 종료 신호 모니터링"""
    global SHUTDOWN_REQUESTED
    while not SHUTDOWN_REQUESTED:
        try:
            # Windows에서 키보드 입력 체크
            if os.name == 'nt':  # Windows
                try:
                    import msvcrt
                    if msvcrt.kbhit():
                        key = msvcrt.getch()
                        if key == b'\x1b':  # ESC 키
                            logger.info("🛑 ESC 키를 눌렀습니다. 프로그램을 종료합니다.")
                            SHUTDOWN_REQUESTED = True
                            os._exit(0)
                        elif key == b'\x03':  # Ctrl+C
                            logger.info("🛑 Ctrl+C를 눌렀습니다. 프로그램을 종료합니다.")
                            SHUTDOWN_REQUESTED = True
                            os._exit(0)
                except ImportError:
                    pass
            time.sleep(0.1)  # 0.1초마다 체크
        except:
            pass

def signal_handler(sig, frame):
    global SHUTDOWN_REQUESTED
    logger.info("🛑 프로그램 종료 신호를 받았습니다. 안전하게 종료합니다...")
    try:
        # 텔레그램으로 종료 알림
        send_telegram_message("🛑 자동매매 봇이 종료되었습니다.")
    except:
        pass
    SHUTDOWN_REQUESTED = True
    # 강제 종료 (Windows에서 확실히 작동)
    os._exit(0)

# Windows와 Unix 모두에서 작동하는 시그널 핸들러 등록
try:
    signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
except (AttributeError, ValueError):
    # Windows에서는 일부 시그널이 지원되지 않을 수 있음
    pass

# Windows에서 Ctrl+C를 더 잘 처리하기 위한 추가 설정
if hasattr(signal, 'CTRL_C_EVENT'):
    try:
        signal.signal(signal.CTRL_C_EVENT, signal_handler)
    except (AttributeError, ValueError):
        pass

# Unix 시스템에서만 SIGTERM 등록
if hasattr(signal, 'SIGTERM'):
    try:
        signal.signal(signal.SIGTERM, signal_handler)
    except (AttributeError, ValueError):
        pass

# 간단한 종료 체크 함수
def check_for_exit():
    """종료 플래그만 체크"""
    return SHUTDOWN_REQUESTED

class KISClient:
    def __init__(self):
        self.access_token = None
        self.token_expiry = 0
        self.load_or_refresh_token()

    def load_or_refresh_token(self):
        try:
            if os.path.exists(TOKEN_FILE):
                with open(TOKEN_FILE, 'r', encoding='utf-8') as f:
                    token_data = json.load(f)
                    self.access_token = token_data.get("access_token")
                    self.token_expiry = token_data.get("expires_at", 0)
            
            if time.time() > self.token_expiry - 300:  # 5분 여유
                self.refresh_token()
        except Exception as e:
            logger.error(f"Token load failed: {e}")
            self.refresh_token()

    def refresh_token(self):
        try:
            body = {
                "grant_type": "client_credentials",
                "appkey": KIS_APP_KEY,
                "appsecret": KIS_APP_SECRET
            }
            response = requests.post(KIS_TOKEN_URL, json=body)
            data = response.json()
            if "access_token" in data:
                self.access_token = data["access_token"]
                self.token_expiry = time.time() + int(data.get("expires_in", 86400))
                token_data = {
                    "access_token": self.access_token,
                    "expires_at": self.token_expiry
                }
                with open(TOKEN_FILE, 'w', encoding='utf-8') as f:
                    json.dump(token_data, f)
                logger.info("Access token refreshed")
            else:
                raise Exception(f"Token refresh failed: {data}")
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise

    def get_headers(self):
        if time.time() > self.token_expiry - 300:
            self.refresh_token()
        return {
            "content-type": "application/json",
            "authorization": f"Bearer {self.access_token}",
            "appkey": KIS_APP_KEY,
            "appsecret": KIS_APP_SECRET
        }

kis_client = KISClient()
logger.info("KIS client initialized")

# 텔레그램 봇 초기화 (연결 풀 문제 해결)
telegram_bot = None  # 전역 변수로 선언만 하고 나중에 초기화
logger.info("Telegram bot will be initialized on demand")

# API 호출 제한 Rate limiting 설정
class RateLimiter:
    def __init__(self):
        self.order_lock = threading.Lock()
        self.api_lock = threading.Lock()
        self.order_count = 0
        self.api_count = 0
        self.last_reset = time.time()
        
    def _reset_if_needed(self):
        current_time = time.time()
        if current_time - self.last_reset >= 1:
            with self.order_lock:
                self.order_count = 0
            with self.api_lock:
                self.api_count = 0
            self.last_reset = current_time
            
    def can_make_order(self):
        self._reset_if_needed()
        with self.order_lock:
            if self.order_count < 5:
                self.order_count += 1
                return True
            return False
            
    def can_make_api_call(self, max_wait=10):
        self._reset_if_needed()
        start_time = time.time()
        with self.api_lock:
            while self.api_count >= 10:
                if time.time() - start_time > max_wait:
                    logger.warning("Max wait time exceeded for API call")
                    return False
                time.sleep(0.1)
                self._reset_if_needed()
            self.api_count += 1
            return True

rate_limiter = RateLimiter()
#함수 결과를 캐싱해 반복 호출을 줄이고, 실패 시 자동 재시도하는 효율적인 데코레이터
def cache_result(expiry_seconds=3600):
    def decorator(func):
        @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
        def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}_{hashlib.md5(str(args).encode() + str(kwargs).encode()).hexdigest()}"
            cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")
            
            try:
                if os.path.exists(cache_file):
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        cache_data = json.load(f)
                        if time.time() - cache_data.get('timestamp', 0) < expiry_seconds:
                            logger.info(f"Using cached result for {func.__name__}")
                            return cache_data['result']
            except Exception as e:
                logger.error(f"Failed to read cache for {func.__name__}: {e}")
            
            result = func(*args, **kwargs)
            
            try:
                cache_data = {
                    'timestamp': time.time(),
                    'result': result
                }
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(cache_data, f)
                logger.info(f"Cached result for {func.__name__}")
            except Exception as e:
                logger.error(f"Failed to write cache for {func.__name__}: {e}")
            
            return result
        return wrapper
    return decorator

class TradingError(Exception):
    pass
#API 요청 시 캐싱, 재시도, 속도 제한을 모두 고려해 안정적이고 효율적인 외부 데이터 요청
@cache_result(expiry_seconds=7200)
def get_fear_and_greed():
    if not rate_limiter.can_make_api_call():
        time.sleep(0.1)
        return get_fear_and_greed()
    try:
        response = requests.get("https://api.alternative.me/fng/")
        data = response.json()
        logger.info("Fetched Fear and Greed index")
        return int(data['data'][0]['value'])
    except Exception as e:
        logger.error(f"Fear and Greed index fetch failed: {e}")
        return 50

@cache_result(expiry_seconds=300)
def get_current_price(ticker):
    if PAPER_TRADING:
        # 페이퍼 트레이딩에서는 더미 가격 사용
        import random
        base_prices = {
            "AAPL": 150, "MSFT": 300, "GOOGL": 2500, "AMZN": 3000, "TSLA": 200,
            "ROKU": 80, "SNAP": 15, "PINS": 25, "DOCU": 60, "FSLY": 20,
            "FVRR": 30, "UPWK": 40, "TTD": 70, "TTWO": 120, "EA": 130,
            "ATVI": 90, "MTCH": 100, "GRUB": 50, "BYND": 25, "PTON": 15,
            "WORK": 20, "SLACK": 30, "TWTR": 40, "ZM": 200, "TEAM": 300,
            "SNOW": 150, "PLTR": 20, "DDOG": 80, "MDB": 200, "OKTA": 100,
            "ZS": 150, "CRWD": 200, "NET": 50, "SQ": 100, "SHOP": 150,
            "TWLO": 80, "RNG": 200, "SPOT": 200, "UBER": 40, "LYFT": 20
        }
        base_price = base_prices.get(ticker, 100)
        # ±5% 랜덤 변동
        price_change = random.uniform(-0.05, 0.05)
        return base_price * (1 + price_change)
        
    if not rate_limiter.can_make_api_call():
        time.sleep(0.1)
        return get_current_price(ticker)
    try:
        url = f"{OVERSEAS_BASE_URL}/uapi/overseas-price/v1/quotations/price"
        params = {
            "fid_cond_mrkt_div_code": OVERSEAS_MARKET_CODE,
            "fid_input_iscd": ticker
        }
        response = requests.get(url, headers=kis_client.get_headers(), params=params)
        data = response.json()
        if data.get("rt_cd") == "0":
            return float(data["output"]["last"])
        logger.error(f"Failed to fetch price for {ticker}: {data}")
        return None
    except Exception as e:
        logger.error(f"Price fetch failed for {ticker}: {e}")
        return None
#텔레그램 메시지 길이 제한
class FileManager:
    @staticmethod
    def load_json(filename, default=None):
        try:
            if os.path.exists(filename):
                with open(filename, "r", encoding='utf-8') as f:
                    return json.load(f)
            return default if default is not None else {}
        except Exception as e:
            logger.error(f"Failed to load {filename}: {e}")
            return default if default is not None else {}

    @staticmethod
    def save_json(filename, data):
        try:
            with open(filename, "w", encoding='utf-8') as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to save {filename}: {e}")
#텔레그램 메시지 길이 제한
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def send_telegram_message(message):
    try:
        max_length = 4096
        if len(message) > max_length:
            message = message[:max_length] + "..."
        
        logger.info(f"Sending telegram message: {message[:100]}...")
        
        # HTTP 요청을 직접 사용하여 연결 풀 문제 완전 해결
        import urllib.parse
        import urllib.request
        
        # 텔레그램 API URL
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        
        # 메시지 데이터 준비
        data = {
            'chat_id': TELEGRAM_CHAT_ID,
            'text': message,
            'parse_mode': 'Markdown',
            'disable_web_page_preview': True
        }
        
        # URL 인코딩
        data = urllib.parse.urlencode(data).encode('utf-8')
        
        # HTTP 요청
        req = urllib.request.Request(url, data=data)
        req.add_header('Content-Type', 'application/x-www-form-urlencoded')
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = response.read().decode('utf-8')
            logger.info("Telegram message sent successfully")
            return result
            
    except Exception as e:
        logger.error(f"Telegram message sending failed: {e}")
        return None
#텔레그램 메시지
class TradingHistory:
    def __init__(self):
        self.history = FileManager.load_json(TRADE_HISTORY_FILE, {"trades": [], "performance": {}})
    
    def add_trade(self, ticker, action, price, amount, reason):
        trade = {
            "timestamp": datetime.now().isoformat(),
            "ticker": ticker,
            "action": action,
            "price": price,
            "amount": amount,
            "reason": reason
        }
        self.history["trades"].append(trade)
        FileManager.save_json(TRADE_HISTORY_FILE, self.history)
        
        message = (
            f"🔄 거래 실행: {ticker}\n"
            f"유형: {'매수' if action == 'buy' else '매도'}\n"
            f"가격: {price:,.0f}\n"
            f"수량: {amount:,}\n"
            f"사유: {reason}"
        )
        send_telegram_message(message)
    #주어진 종목에 대해 총 투자금, 회수금, 현재 가치 및 수익률을 종합적으로 계산해주는 투자 성과 평가 함수
    def calculate_performance(self, ticker):
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.calculate_performance(ticker)
        try:
            trades = [t for t in self.history["trades"] if t["ticker"] == ticker]
            if not trades:
                return None
            
            total_invested = sum(t["amount"] * t["price"] for t in trades if t["action"] == "buy")
            total_returned = sum(t["amount"] * t["price"] for t in trades if t["action"] == "sell")
            current_price = get_current_price(ticker)
            if current_price is None:
                logger.error(f"Failed to get current price for {ticker}")
                return None
            
            current_holdings = sum(t["amount"] for t in trades if t["action"] == "buy") - \
                             sum(t["amount"] for t in trades if t["action"] == "sell")
            current_value = current_holdings * current_price if current_holdings > 0 else 0
            
            return {
                "total_invested": total_invested,
                "total_returned": total_returned,
                "current_holdings": current_holdings,
                "current_value": current_value,
                "total_value": total_returned + current_value,
                "roi": ((total_returned + current_value - total_invested) / total_invested * 100) \
                    if total_invested > 0 else 0
            }
        except Exception as e:
            logger.error(f"Performance calculation failed for {ticker}: {e}")
            return None
#종목별 진입 가격, 수량, 손절/익절 조건을 등록·수정·삭제하며 파일로 저장하는 손익관리 도우미
class StopLossManager:
    def __init__(self, default_stop_loss=None, default_take_profit=None):
        # 웹사이트 설정에서 기본값 로드
        self.default_stop_loss = default_stop_loss or STOP_LOSS_PERCENTAGE
        self.default_take_profit = default_take_profit or TAKE_PROFIT_PERCENTAGE
        self.positions = FileManager.load_json(POSITIONS_FILE, {})

    def add_position(self, ticker, entry_price, amount, stop_loss=None, take_profit=None):
        self.positions[ticker] = {
            "entry_price": entry_price,
            "amount": amount,
            "stop_loss": stop_loss or self.default_stop_loss,
            "take_profit": take_profit or self.default_take_profit,
            "timestamp": datetime.now().isoformat()
        }
        FileManager.save_json(POSITIONS_FILE, self.positions)
        
    def update_position(self, ticker, amount=None, stop_loss=None, take_profit=None, entry_price=None):
        if ticker in self.positions:
            if amount is not None:
                self.positions[ticker]["amount"] = amount
            if entry_price is not None:
                self.positions[ticker]["entry_price"] = entry_price
            if stop_loss is not None:
                self.positions[ticker]["stop_loss"] = stop_loss
            if take_profit is not None:
                self.positions[ticker]["take_profit"] = take_profit
            self.positions[ticker]["updated_at"] = datetime.now().isoformat()
            FileManager.save_json(POSITIONS_FILE, self.positions)
            
    def remove_position(self, ticker):
        if ticker in self.positions:
            del self.positions[ticker]
            FileManager.save_json(POSITIONS_FILE, self.positions)
#주가 데이터를 기반으로 LSTM 딥러닝 모델을 학습·예측할 수 있도록 구성된 주식 시장 분석
class MarketAnalyzer:
    def __init__(self):
        try:
            self.client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        except:
            self.client = None
        self.scaler = MinMaxScaler(feature_range=(0, 1))
        self.model = self._build_lstm_model()

    def _build_lstm_model(self):
        model = Sequential()
        model.add(LSTM(50, return_sequences=True, input_shape=(30, 5)))
        model.add(Dropout(0.2))
        model.add(LSTM(50))
        model.add(Dropout(0.2))
        model.add(Dense(1))
        model.compile(optimizer='adam', loss='mse')
        return model
    
    def prepare_data(self, df):
        # 간단한 데이터 준비 (LSTM 대신)
        data = df[['close']].values  # 종가만 사용
        X = []
        for i in range(30, len(data)):
            X.append(data[i-30:i])
        return np.array(X)
# LSTM 모델을 활용해 특정 종목(ticker)의 다음 날 종가를 예측
    @cache_result(expiry_seconds=7200)
    def predict_next_price(self, ticker):
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.predict_next_price(ticker)
        try:
            df = self.get_ohlcv(ticker, count=60)
            if df is None or len(df) < 30:
                logger.warning(f"Insufficient data for {ticker}: {len(df) if df is not None else 0} days")
                return None

            X = self.prepare_data(df)
            if len(X) == 0:
                logger.warning(f"No valid sequences for {ticker}")
                return None

            # 가격 예측을 위한 간단한 방법 사용 (LSTM 대신)
            if len(df) >= 5:
                # 최근 5일 평균 가격 변화율로 다음 가격 예측
                recent_prices = df['close'].tail(5).values
                price_changes = [(recent_prices[i] - recent_prices[i-1]) / recent_prices[i-1] for i in range(1, len(recent_prices))]
                avg_change = sum(price_changes) / len(price_changes)
                predicted_price = recent_prices[-1] * (1 + avg_change)
                logger.info(f"Predicted next price for {ticker}: {predicted_price:.2f}")
                return predicted_price
            return None
        except Exception as e:
            logger.error(f"Price prediction failed for {ticker}: {e}")
            return None
    #한국투자증권에서 주식 고르는거?
    def test_minute_data_api(self, ticker="AAPL"):
        """1분봉 데이터 API 테스트"""
        try:
            logger.info(f"Testing 1-minute data API for {ticker}...")
            
            url = f"{OVERSEAS_BASE_URL}/uapi/overseas-price/v1/quotations/inquire-time"
            params = {
                "fid_cond_mrkt_div_code": OVERSEAS_MARKET_CODE,
                "fid_input_iscd": ticker,
                "fid_period_div_code": "1",  # 1분봉
                "fid_org_adj_prc": "1"
            }
            
            logger.info(f"API URL: {url}")
            logger.info(f"API Params: {params}")
            logger.info(f"Headers: {kis_client.get_headers()}")
            
            response = requests.get(url, headers=kis_client.get_headers(), params=params)
            
            logger.info(f"API Response Status: {response.status_code}")
            logger.info(f"API Response Headers: {dict(response.headers)}")
            
            # 응답 내용 확인
            response_text = response.text
            logger.info(f"API Response Text (first 500 chars): {response_text[:500]}")
            
            if response.status_code != 200:
                logger.error(f"HTTP Error: {response.status_code}")
                return False
            
            if not response_text.strip():
                logger.error("Empty response received")
                return False
            
            try:
                data = response.json()
                logger.info(f"API Response JSON: {data}")
                
                if data.get("rt_cd") == "0":
                    logger.info("✅ 1-minute data API test successful!")
                    if "output" in data and len(data["output"]) > 0:
                        logger.info(f"Sample data: {data['output'][0]}")
                    return True
                else:
                    logger.error(f"❌ 1-minute data API test failed: {data.get('msg1', 'Unknown error')}")
                    return False
                    
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON parsing failed: {e}")
                logger.error(f"Response text: {response_text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ API test failed with exception: {e}")
            return False

    def test_alternative_timeframes(self, ticker="AAPL"):
        """다른 시간대 데이터 API 테스트 (5분봉, 15분봉 등)"""
        timeframes = [
            ("5", "5분봉"),
            ("15", "15분봉"), 
            ("30", "30분봉"),
            ("60", "1시간봉")
        ]
        
        results = {}
        
        for period_code, period_name in timeframes:
            try:
                logger.info(f"Testing {period_name} data API for {ticker}...")
                
                url = f"{OVERSEAS_BASE_URL}/uapi/overseas-price/v1/quotations/inquire-time"
                params = {
                    "fid_cond_mrkt_div_code": OVERSEAS_MARKET_CODE,
                    "fid_input_iscd": ticker,
                    "fid_period_div_code": period_code,
                    "fid_org_adj_prc": "1"
                }
                
                response = requests.get(url, headers=kis_client.get_headers(), params=params)
                
                logger.info(f"{period_name} Response Status: {response.status_code}")
                
                if response.status_code != 200:
                    logger.error(f"{period_name} HTTP Error: {response.status_code}")
                    results[period_name] = False
                    continue
                
                response_text = response.text
                if not response_text.strip():
                    logger.error(f"{period_name} Empty response received")
                    results[period_name] = False
                    continue
                
                try:
                    data = response.json()
                    if data.get("rt_cd") == "0":
                        logger.info(f"✅ {period_name} API test successful!")
                        results[period_name] = True
                    else:
                        logger.error(f"❌ {period_name} API test failed: {data.get('msg1', 'Unknown error')}")
                        results[period_name] = False
                        
                except json.JSONDecodeError as e:
                    logger.error(f"❌ {period_name} JSON parsing failed: {e}")
                    logger.error(f"{period_name} Response text: {response_text[:200]}")
                    results[period_name] = False
                    
            except Exception as e:
                logger.error(f"❌ {period_name} API test failed with exception: {e}")
                results[period_name] = False
        
        return results

    def detect_custom_buy_signal(self, ticker):
        """일봉 데이터를 사용한 매수 신호 감지 (1분봉 대신)"""
        try:
            # 최근 3일간 일봉 데이터 조회
            df = self.get_ohlcv(ticker, count=3)
            if df is None or len(df) < 3:
                return False
            
            # 전일 대비 오늘 가격 변화율
            yesterday_close = df['close'].iloc[-2]
            today_close = df['close'].iloc[-1]
            price_change = (today_close - yesterday_close) / yesterday_close * 100
            
            # 전일 대비 오늘 거래량 변화율
            yesterday_volume = df['volume'].iloc[-2]
            today_volume = df['volume'].iloc[-1]
            volume_change = (today_volume - yesterday_volume) / yesterday_volume * 100
            
            # 5일 이동평균선 계산 (최근 5일 데이터)
            df_5days = self.get_ohlcv(ticker, count=5)
            if df_5days is not None and len(df_5days) >= 5:
                df_5days['5ma'] = df_5days['close'].rolling(window=5).mean()
                last_5ma = df_5days['5ma'].iloc[-1]
                
                # 매수 조건:
                # 1. 전일 대비 가격이 5% 이상 상승 (급등 조건)
                # 2. 전일 대비 거래량이 50% 이상 증가
                # 3. 현재가가 5일 이동평균선 ±3% 범위 내
                if (price_change >= 5 and 
                    volume_change >= 50 and 
                    last_5ma * 0.97 <= today_close <= last_5ma * 1.03):
                    
                    logger.info(f"Buy signal detected for {ticker}: price_change={price_change:.2f}%, volume_change={volume_change:.2f}%")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error in detect_custom_buy_signal for {ticker}: {e}")
            return False

    def get_minute_ohlcv(self, ticker, count=6):
        """일봉 데이터 사용 (1분봉 API가 존재하지 않으므로)"""
        logger.warning(f"1-minute data API not available, using daily data for {ticker}")
        return self.get_ohlcv(ticker, count=count)

    def get_5min_ohlcv(self, ticker, count=6):
        """일봉 데이터 사용 (5분봉 API가 존재하지 않으므로)"""
        logger.warning(f"5-minute data API not available, using daily data for {ticker}")
        return self.get_ohlcv(ticker, count=count)

    def get_yesterday_volume(self, ticker):
        """전일 거래량 조회 (해외 주식 일봉 데이터 활용)"""
        df = self.get_ohlcv(ticker, count=2)
        if df is not None and len(df) >= 2:
            return df['volume'].iloc[-2]
        return None

    def get_ohlcv(self, ticker, count=10):
        """해외 주식 일봉 데이터 조회"""
        if PAPER_TRADING:
            # 페이퍼 트레이딩에서는 더미 데이터 사용
            import random
            base_price = 100 + random.randint(-20, 50)  # 80-150 범위
            dates = pd.date_range(end=datetime.now(), periods=count, freq='D')
            data = []
            for i in range(count):
                price_change = random.uniform(-0.05, 0.08)  # -5% ~ +8%
                base_price *= (1 + price_change)
                volume = random.randint(1000000, 5000000)
                data.append({
                    'open': base_price * random.uniform(0.98, 1.02),
                    'high': base_price * random.uniform(1.0, 1.05),
                    'low': base_price * random.uniform(0.95, 1.0),
                    'close': base_price,
                    'volume': volume
                })
            df = pd.DataFrame(data)
            df['date'] = dates
            return df
            
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.get_ohlcv(ticker, count)
        try:
            url = f"{OVERSEAS_BASE_URL}/uapi/overseas-price/v1/quotations/dailyprice"
            params = {
                "fid_cond_mrkt_div_code": OVERSEAS_MARKET_CODE,
                "fid_input_iscd": ticker,
                "fid_period_div_code": "D",
                "fid_org_adj_prc": "1"
            }
            response = requests.get(url, headers=kis_client.get_headers(), params=params)
            data = response.json()
            if data.get("rt_cd") != "0":
                logger.error(f"Failed to fetch OHLCV for {ticker}: {data}")
                return None
            df = pd.DataFrame(data["output"])
            df = df.rename(columns={
                "ovrs_oprc": "open",
                "ovrs_hgpr": "high",
                "ovrs_lwpr": "low", 
                "ovrs_clpr": "close",
                "acml_vol": "volume"
            })
            df = df.astype({"open": float, "high": float, "low": float, "close": float, "volume": float})
            return df.tail(count)
        except Exception as e:
            logger.error(f"OHLCV fetch failed for {ticker}: {e}")
            return None

    def get_all_nasdaq_stocks_from_kis(self):
        """KIS API에서 나스닥 전체 종목 리스트 받아오기"""
        try:
            # KIS API에서 나스닥 전체 종목 마스터 조회
            # 실제 KIS API 문서를 참고하여 구현해야 합니다.
            # 예시: 종목 마스터 조회 API 등
            
            # 임시로 더 많은 종목들을 포함 (실제로는 API에서 받아와야 함)
            # 실제 구현 시에는 KIS API의 나스닥 전체 종목 조회 엔드포인트 사용 필요
            
            logger.warning("Using extended stock list - replace with actual KIS API call for full NASDAQ stocks")
            
            # 중소형 기술주/바이오 중심 종목 리스트 (성장주/가치주 제외)
            extended_stocks = [
                # 중소형 기술주
                "ROKU", "SNAP", "PINS", "DOCU", "FSLY", "FVRR", "UPWK", "TTD", "TTWO",
                "EA", "ATVI", "MTCH", "GRUB", "BYND", "PTON", "WORK", "SLACK", "TWTR",
                "ZM", "TEAM", "SNOW", "PLTR", "DDOG", "MDB", "OKTA", "ZS", "CRWD", "NET",
                "SQ", "SHOP", "TWLO", "RNG", "SPOT", "UBER", "LYFT", "ZM", "TEAM", "WORK",
                
                # 중소형 바이오/헬스케어
                "GILD", "REGN", "VRTX", "BIIB", "AMGN", "ILMN", "DXCM", "ALGN", "IDXX", "ISRG",
                "ABMD", "AGN", "TEVA", "HUM", "AET", "CNC", "MOH", "WCG", "ANTM", "CI",
                "AFL", "BEN", "IVZ", "TROW", "LM", "AMG", "SEIC", "WDR", "JHG", "APAM",
                
                # 중소형 기술주 추가
                "INTU", "ADP", "PAYX", "WDAY", "VEEV", "HUBS", "ESTC", "SPLK", "DT", "FTNT",
                "CHKP", "CYBR", "QLYS", "TENB", "RPD", "SMAR", "ASAN", "ORCL", "CSCO", "PYPL",
                "INTC", "AMD", "QCOM", "AVGO", "TXN", "MU", "ADI", "MRVL", "KLAC", "LRCX",
                
                # 중소형 바이오/헬스케어 추가
                "ABBV", "BMY", "LLY", "NVO", "NVS", "AZN", "GSK", "SNY", "SAN", "NVS",
                "ROG", "NOVN", "BAYRY", "BAYRY", "PFE", "MRK", "ABT", "JNJ", "TMO", "DHR",
                "UNH", "ANTM", "CI", "HUM", "AET", "CNC", "MOH", "WCG", "AGN", "TEVA",
                
                # 추가 중소형 기술주들
                "CG", "KKR", "BX", "APO", "ARES", "OWL", "STEP", "PJT", "HLI", "LAZ",
                "VIAC", "PARA", "LGF.A", "LGF.B", "NWSA", "NWS", "GCI", "MEG", "GTN", "SSP",
                "FOXA", "CMCSA", "DIS", "NFLX", "SPOT", "ROKU", "SNAP", "PINS", "TWTR", "SLACK"
            ]
            
            logger.info(f"Loaded {len(extended_stocks)} mid/small-cap tech/bio NASDAQ stocks for volume analysis")
            return extended_stocks
            
        except Exception as e:
            logger.error(f"Failed to get NASDAQ stocks from KIS: {e}")
            # 에러 시 기본 중소형 기술주 종목들 반환
            return ["ROKU", "SNAP", "PINS", "DOCU", "FSLY", "FVRR", "UPWK", "TTD", "TTWO"]

    def get_volume_increase_stocks(self):
        """나스닥 전체 종목 중에서 전날 대비 거래량이 50% 이상 증가한 종목들만 필터링"""
        try:
            # 나스닥 전체 종목 리스트 받아오기 (실제로는 API에서 받아와야 함)
            all_stocks = self.get_all_nasdaq_stocks_from_kis()
            
            volume_increase_stocks = []
            
            logger.info(f"Checking volume increase for {len(all_stocks)} NASDAQ stocks...")
            
            for ticker in all_stocks:
                try:
                    # 최근 2일간 거래량 데이터 조회
                    df = self.get_ohlcv(ticker, count=2)
                    if df is None or len(df) < 2:
                        continue
                    
                    yesterday_volume = df['volume'].iloc[-2]  # 전일 거래량
                    today_volume = df['volume'].iloc[-1]      # 오늘 거래량
                    
                    if yesterday_volume > 0:  # 0으로 나누기 방지
                        volume_increase = ((today_volume - yesterday_volume) / yesterday_volume) * 100
                        
                        # 거래량이 50% 이상 증가한 종목만 추가
                        if volume_increase >= 50:
                            volume_increase_stocks.append({
                                'ticker': ticker,
                                'volume_increase': volume_increase,
                                'yesterday_volume': yesterday_volume,
                                'today_volume': today_volume
                            })
                            logger.info(f"Volume increase detected: {ticker} (+{volume_increase:.1f}%)")
                
                except Exception as e:
                    logger.error(f"Error checking volume for {ticker}: {e}")
                    continue
            
            # 거래량 증가율 순으로 정렬 (높은 순)
            volume_increase_stocks.sort(key=lambda x: x['volume_increase'], reverse=True)
            
            logger.info(f"Found {len(volume_increase_stocks)} stocks with 50%+ volume increase out of {len(all_stocks)} total NASDAQ stocks")
            return volume_increase_stocks
            
        except Exception as e:
            logger.error(f"Failed to get volume increase stocks: {e}")
            return []

    def get_all_stock_codes(self):
        """거래량 증가 종목들만 반환 (전날 대비 50% 이상)"""
        volume_stocks = self.get_volume_increase_stocks()
        return [stock['ticker'] for stock in volume_stocks]
#기법
    def add_technical_indicators(self, df):
        try:
            df = df.copy()
            min_length = 26
            if len(df) < min_length:
                logger.warning(f"Data length {len(df)} is less than required {min_length}")
                return df
            
            indicator_bb = ta.volatility.BollingerBands(close=df['close'])
            df['bb_bbm'] = indicator_bb.bollinger_mavg()
            df['bb_bbh'] = indicator_bb.bollinger_hband()
            df['bb_bbl'] = indicator_bb.bollinger_lband()
            df['rsi'] = ta.momentum.RSIIndicator(close=df['close']).rsi()
            macd = ta.trend.MACD(close=df['close'])
            df['macd'] = macd.macd()
            df['macd_signal'] = macd.macd_signal()
            df['macd_diff'] = macd.macd_diff()
            df['ema_9'] = ta.trend.EMAIndicator(close=df['close'], window=9).ema_indicator()
            df['adx'] = ta.trend.ADXIndicator(high=df['high'], 
                                            low=df['low'], 
                                            close=df['close']).adx()
            df['volume_sma'] = df['volume'].rolling(window=20).mean()
            return df
        except Exception as e:
            logger.error(f"Failed to add technical indicators: {e}")
            return df

    def analyze_order_book(self, ticker):
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.analyze_order_book(ticker)
        try:
            # 해외 주식은 호가 데이터가 제한적이므로 현재가 기준으로 분석
            current_price = get_current_price(ticker)
            if not current_price:
                return None
            # 해외 주식은 현재가 기준으로 최적 매수가 결정
            optimal_buy_price = current_price * 0.995  # 현재가의 99.5%로 설정
            
            return {
                'optimal_buy_price': optimal_buy_price,
                'current_price': current_price,
                'spread': current_price - optimal_buy_price
            }
        except Exception as e:
            logger.error(f"Order book analysis failed for {ticker}: {e}")
            return None

    def calculate_ai_investment_amount(self, ticker, current_price, predicted_price, volume_increase=None, market_conditions=None):
        """AI가 상황에 따라 적절한 투자 금액을 계산"""
        try:
            # 기본 투자 비율 (잔고 대비)
            base_investment_ratio = 0.05  # 5% 기본
            
            # 1. 예측 가격과 현재 가격의 차이에 따른 조정
            if predicted_price and current_price:
                price_ratio = predicted_price / current_price
                if price_ratio > 1.05:  # 5% 이상 상승 예상
                    base_investment_ratio *= 1.5
                elif price_ratio > 1.03:  # 3% 이상 상승 예상
                    base_investment_ratio *= 1.2
                elif price_ratio < 1.01:  # 1% 미만 상승 예상
                    base_investment_ratio *= 0.7
            
            # 2. 거래량 증가율에 따른 조정
            if volume_increase:
                if volume_increase > 100:  # 100% 이상 증가
                    base_investment_ratio *= 1.3
                elif volume_increase > 70:  # 70% 이상 증가
                    base_investment_ratio *= 1.1
                elif volume_increase < 60:  # 60% 미만 증가
                    base_investment_ratio *= 0.8
            
            # 3. 시장 상황에 따른 조정
            if market_conditions:
                fear_greed = market_conditions.get('fear_greed_index', 50)
                if fear_greed > 70:  # 탐욕 지수 높음
                    base_investment_ratio *= 0.8  # 보수적 투자
                elif fear_greed < 30:  # 공포 지수 높음
                    base_investment_ratio *= 1.2  # 공격적 투자
            
            # 4. 최소/최대 투자 비율 제한
            min_ratio = 0.02  # 최소 2%
            max_ratio = 0.15  # 최대 15%
            final_ratio = max(min_ratio, min(max_ratio, base_investment_ratio))
            
            logger.info(f"AI 투자 비율 계산 - {ticker}: 기본 {base_investment_ratio:.1%} → 최종 {final_ratio:.1%}")
            
            return final_ratio
            
        except Exception as e:
            logger.error(f"AI 투자 금액 계산 실패: {e}")
            return 0.05  # 기본 5% 반환

    @cache_result(expiry_seconds=7200)
    def analyze_market_trend(self):
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.analyze_market_trend()
        try:
            top_stocks = ["AAPL", "MSFT", "GOOGL"]  # Apple, Microsoft, Google
            trend_data = {}
            for stock in top_stocks:
                df = self.get_ohlcv(stock, count=7)
                if df is not None and not df.empty:
                    trend_data[stock] = {
                        "price_change": ((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100),
                        "volume_change": ((df['volume'].iloc[-1] - df['volume'].iloc[0]) / df['volume'].iloc[0] * 100)
                    }
            logger.info("Market trend analyzed")
            return trend_data
        except Exception as e:
            logger.error(f"Market trend analysis failed: {e}")
            return {}


    @cache_result(expiry_seconds=7200)
    @retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=2, min=4, max=60))
    def scan_for_opportunities(self):
        """AI 기반 매매 기회 스캔 - 소형/중형 기술주, 바이오주 120개 종목 대상"""
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.scan_for_opportunities()
        try:
            # 소형/중형 기술주, 바이오주 120개 종목 리스트
            target_stocks = self.get_all_nasdaq_stocks_from_kis()
            
            logger.info(f"AI analyzing {len(target_stocks)} small/mid-cap tech/bio stocks...")
            
            opportunities = {'tickers': {}}
            
            # 병렬 처리로 AI 분석 수행
            with ThreadPoolExecutor(max_workers=10) as executor:
                results = list(executor.map(lambda ticker: (ticker, self.evaluate_coin(ticker)), target_stocks))
                for ticker, analysis in results:
                    if analysis and analysis.get('score', 0) >= 50:  # AI 점수 50 이상인 종목만 (매수 추천 기준)
                        opportunities['tickers'][ticker] = analysis
                        logger.info(f"AI recommends {ticker}: score={analysis.get('score')}, reason={analysis.get('reason', 'Technical analysis')}")
            
            logger.info(f"AI found {len(opportunities['tickers'])} buy opportunities out of {len(target_stocks)} stocks")
            return opportunities
            
        except Exception as e:
            logger.error(f"Market scan failed: {e}")
            return {}

    @cache_result(expiry_seconds=7200)
    def evaluate_coin(self, ticker):
        """AI 기반 종목 분석 - 기술적 지표 + LSTM 예측 + 시장 상황 종합 분석"""
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.evaluate_coin(ticker)
        try:
            df = self.get_ohlcv(ticker, count=30)
            if df is None or df.empty or len(df) < 14:
                return None
                
            df = self.add_technical_indicators(df)
            if len(df) < 26:
                return None
            
            # 1. 기술적 지표 분석 (40점 만점)
            technical_score = 0
            reasons = []
            
            # RSI 분석 (과매도 구간)
            last_rsi = df['rsi'].iloc[-1]
            if last_rsi < 30:
                technical_score += 15
                reasons.append("RSI 과매도")
            elif last_rsi < 40:
                technical_score += 8
                reasons.append("RSI 낮음")
            
            # MACD 골든크로스
            if df['macd_diff'].iloc[-2] < 0 and df['macd_diff'].iloc[-1] > 0:
                technical_score += 12
                reasons.append("MACD 골든크로스")
            
            # 볼린저 밴드 하단 터치
            if df['close'].iloc[-1] < df['bb_bbl'].iloc[-1]:
                technical_score += 10
                reasons.append("볼린저 밴드 하단")
            
            # 거래량 급증
            volume_ratio = df['volume'].iloc[-1] / df['volume_sma'].iloc[-1]
            if volume_ratio > 1.5:
                technical_score += 8
                reasons.append(f"거래량 {volume_ratio:.1f}배 증가")
            
            # 2. LSTM 예측 분석 (30점 만점)
            prediction_score = 0
            predicted_price = self.predict_next_price(ticker)
            current_price = df['close'].iloc[-1]
            
            if predicted_price and current_price:
                price_change_pct = ((predicted_price - current_price) / current_price) * 100
                if price_change_pct > 5:
                    prediction_score += 30
                    reasons.append(f"LSTM 예측 +{price_change_pct:.1f}%")
                elif price_change_pct > 3:
                    prediction_score += 20
                    reasons.append(f"LSTM 예측 +{price_change_pct:.1f}%")
                elif price_change_pct > 1:
                    prediction_score += 10
                    reasons.append(f"LSTM 예측 +{price_change_pct:.1f}%")
            
            # 3. 시장 상황 분석 (30점 만점)
            market_score = 0
            fear_greed = get_fear_and_greed()
            
            if fear_greed:
                if fear_greed < 30:  # 공포 구간 - 매수 기회
                    market_score += 20
                    reasons.append("시장 공포 구간")
                elif fear_greed < 50:  # 중립
                    market_score += 10
                    reasons.append("시장 중립")
                elif fear_greed > 70:  # 탐욕 구간 - 주의
                    market_score += 5
                    reasons.append("시장 탐욕 구간")
            
            # 4. 가격 모멘텀 분석
            price_momentum = ((df['close'].iloc[-1] - df['close'].iloc[-5]) / df['close'].iloc[-5]) * 100
            if price_momentum > 0:
                market_score += 10
                reasons.append(f"가격 상승 모멘텀 +{price_momentum:.1f}%")
            
            # 총점 계산 (100점 만점)
            total_score = technical_score + prediction_score + market_score
            
            # 매수 추천 기준: 50점 이상
            if total_score >= 50:
                recommendation = 'strong_buy' if total_score >= 70 else 'buy'
                return {
                    'ticker': ticker,
                    'score': total_score,
                    'recommendation': recommendation,
                    'price': current_price,
                    'predicted_price': predicted_price,
                    'rsi': last_rsi,
                    'volume_ratio': volume_ratio,
                    'fear_greed': fear_greed,
                    'price_momentum': price_momentum,
                    'reason': ', '.join(reasons),
                    'technical_score': technical_score,
                    'prediction_score': prediction_score,
                    'market_score': market_score
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Stock evaluation failed for {ticker}: {e}")
            return None
#거래 기록, 손절 관리, 시장 분석 기능을 초기화하고, KIS API를 통해 계좌 잔고와 특정 주식 보유량을 조회하는 기능
class TradingBot:
    def __init__(self):
        self.trading_history = TradingHistory()
        self.stop_loss_manager = StopLossManager()
        self.market_analyzer = MarketAnalyzer()
        self.purchased_stocks = FileManager.load_json(STOCKS_FILE, {"stocks": [], "last_analysis": {}})
        self.last_opportunity_scan = 0
        self.opportunities = []
        self.last_performance_log = 0  # 마지막 성과 로그 시간

    def get_balance(self):
        """계좌 잔고 조회"""
        if PAPER_TRADING:
            return paper_trading.get_balance()
            
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.get_balance()
        try:
            url = f"{OVERSEAS_BASE_URL}/uapi/overseas-stock/v1/trading/inquire-balance"
            params = {
                "cano": KIS_ACCOUNT_NUMBER,
                "acnt_prdt_cd": "01"
            }
            response = requests.get(url, headers=kis_client.get_headers(), params=params)
            data = response.json()
            if data.get("rt_cd") == "0":
                return float(data["output1"][0]["dnca_tot_amt"])
            logger.error(f"Failed to fetch balance: {data}")
            return None
        except Exception as e:
            logger.error(f"Balance fetch failed: {e}")
            return None

    def get_stock_balance(self, ticker):
        """보유 주식 수량 조회"""
        if PAPER_TRADING:
            return paper_trading.get_stock_balance(ticker)
            
        if not rate_limiter.can_make_api_call():
            time.sleep(0.1)
            return self.get_stock_balance(ticker)
        try:
            url = f"{OVERSEAS_BASE_URL}/uapi/overseas-stock/v1/trading/inquire-balance"
            params = {
                "cano": KIS_ACCOUNT_NUMBER,
                "acnt_prdt_cd": "01"
            }
            response = requests.get(url, headers=kis_client.get_headers(), params=params)
            data = response.json()
            if data.get("rt_cd") == "0":
                for stock in data["output2"]:
                    if stock["ovrs_excg_cd"] == OVERSEAS_MARKET_CODE and stock["ovrs_pdno"] == ticker:
                        return int(stock["ovrs_cblc_qty"])
                return 0
            logger.error(f"Failed to fetch stock balance for {ticker}: {data}")
            return None
        except Exception as e:
            logger.error(f"Stock balance fetch failed for {ticker}: {e}")
            return None
#시장 시간, 잔고, 위험 수준, AI 예측을 기반으로 최대 5개 종목을 관리하며, LSTM 예측과 주문서 분석을 활용해 지정가 매수를 실행하고, 거래 결과를 기록 및 알림
    def execute_trading_strategy(self):
        try:
#             now = datetime.now()
# # 주말이면 실행하지 않음
#             if now.weekday() >= 5:  # 5 = 토요일, 6 = 일요일
#                logger.info("📅 주말입니다. 전략을 실행하지 않습니다.")
#                return

# # 평일 17시 ~ 19시 사이가 아니면 실행하지 않음
#             if not (21 <= now.hour < 23):
#                logger.info("⏰ 현재 시간에는 시장이 닫혀 있습니다. 전략을 실행하지 않습니다.")
#                return


            if len(self.purchased_stocks["stocks"]) >= MAX_STOCKS:
                logger.info(f"Maximum {MAX_STOCKS} stocks held, checking DCA")
                for ticker in self.purchased_stocks["stocks"]:
                    self.dollar_cost_averaging(ticker)
                return

            krw_balance = self.get_balance()
            if krw_balance is None or krw_balance < 10000:
                logger.info(f"Insufficient KRW balance: {krw_balance if krw_balance else 'None'} KRW")
                return

            # 시장 위험도 체크 (간단한 버전)
            fear_greed = get_fear_and_greed()
            if fear_greed and fear_greed < 30:  # 공포 지수가 30 미만이면 위험
                logger.info(f"Market fear too high: {fear_greed}")
                return

            # 기회 분석 결과가 딕셔너리인 경우 처리
            if isinstance(self.opportunities, dict) and 'tickers' in self.opportunities:
                tickers_data = self.opportunities['tickers']
                for ticker, data in list(tickers_data.items())[:2]:  # 상위 2개만
                    if ticker in self.purchased_stocks["stocks"]:
                        continue

                    predicted_price = self.market_analyzer.predict_next_price(ticker)
                    current_price = get_current_price(ticker)
                    if predicted_price and current_price and predicted_price > current_price * 1.02:
                        buy_info = self.market_analyzer.analyze_order_book(ticker)
                        if not buy_info or 'optimal_buy_price' not in buy_info:
                            logger.warning(f"Could not determine optimal buy price for {ticker}")
                            continue

                        # AI가 투자 금액을 판단 (웹사이트 설정 사용)
                        market_conditions = {'fear_greed_index': get_fear_and_greed()}
                        investment_ratio = self.market_analyzer.calculate_ai_investment_amount(
                            ticker, current_price, predicted_price, 
                            market_conditions=market_conditions
                        )
                        # 웹사이트 설정의 기본 투자 비율과 AI 계산값 중 높은 값 사용
                        final_investment_ratio = max(investment_ratio, INVESTMENT_RATIO / 100)
                        budget = krw_balance * final_investment_ratio
                        optimal_price = buy_info['optimal_buy_price']
                        amount = int(budget // optimal_price)

                        logger.info(f"Placing limit buy order for {ticker} at {optimal_price}")
                        buy_order = self.execute_limit_buy(ticker, optimal_price, amount)
                        if buy_order:
                            self.trading_history.add_trade(ticker, "buy", optimal_price, amount, 
                                f"AI 추천 + LSTM 예측 (예측가: {predicted_price:.2f})")
                            self.stop_loss_manager.add_position(ticker, optimal_price, amount)
                            if ticker not in self.purchased_stocks["stocks"]:
                                self.purchased_stocks["stocks"].append(ticker)
                                FileManager.save_json(STOCKS_FILE, self.purchased_stocks)
                            message = (
                                f"🟢 매수 실행: {ticker}\n"
                                f"가격: {optimal_price:,.2f}\n"
                                f"수량: {amount:,}\n"
                                f"총 금액: {amount * optimal_price:,.2f}원\n"
                                f"사유: AI 추천 + LSTM 예측"
                            )
                            send_telegram_message(message)
                            break
            # AI 기반 매수 전략만 적용 (소형/중형 기술주, 바이오주 120개 종목 대상)
            logger.info("AI-based trading strategy: analyzing small/mid-cap tech/bio stocks")
            
            # AI 분석 결과가 없으면 기회 스캔 실행
            if not self.opportunities or not isinstance(self.opportunities, dict) or 'tickers' not in self.opportunities:
                logger.info("No AI analysis results, skipping AI-based trading")
                return
            
            ai_recommendations = self.opportunities['tickers']
            if not ai_recommendations:
                logger.info("No AI buy recommendations found")
                return
            
            logger.info(f"Processing {len(ai_recommendations)} AI buy recommendations")
            
            # AI 점수 순으로 정렬 (높은 순)
            sorted_recommendations = sorted(ai_recommendations.items(), 
                                          key=lambda x: x[1].get('score', 0), reverse=True)
            
            # 웹사이트 설정의 AI 점수 임계값 적용
            filtered_recommendations = [
                (ticker, analysis) for ticker, analysis in sorted_recommendations
                if analysis.get('score', 0) >= AI_SCORE_THRESHOLD
            ]
            
            for ticker, analysis in filtered_recommendations[:3]:  # 상위 3개만 처리
                if ticker in self.purchased_stocks["stocks"]:
                    continue
                
                krw_balance = self.get_balance()
                if krw_balance is None or krw_balance < 10000:
                    continue
                
                current_price = get_current_price(ticker)
                if current_price is None:
                    continue
                
                # AI가 투자 금액을 판단
                predicted_price = analysis.get('predicted_price')
                market_conditions = {'fear_greed_index': analysis.get('fear_greed')}
                
                investment_ratio = self.market_analyzer.calculate_ai_investment_amount(
                    ticker, current_price, predicted_price,
                    market_conditions=market_conditions
                )
                
                budget = krw_balance * investment_ratio
                amount = int(budget // current_price)
                
                if amount < 1:
                    continue
                
                buy_order = self.execute_limit_buy(ticker, current_price, amount)
                if buy_order:
                    score = analysis.get('score', 0)
                    reason = analysis.get('reason', 'AI analysis')
                    
                    self.trading_history.add_trade(ticker, "buy", current_price, amount, 
                        f"AI 추천 (점수: {score}, 사유: {reason})")
                    self.stop_loss_manager.add_position(ticker, current_price, amount)
                    
                    if ticker not in self.purchased_stocks["stocks"]:
                        self.purchased_stocks["stocks"].append(ticker)
                        FileManager.save_json(STOCKS_FILE, self.purchased_stocks)
                    
                    message = (
                        f"🤖 AI 매수 실행: {ticker}\n"
                        f"가격: {current_price:,.2f}\n"
                        f"수량: {amount:,}\n"
                        f"총 금액: {amount * current_price:,.2f}원\n"
                        f"AI 점수: {score}/100\n"
                        f"사유: {reason}"
                    )
                    send_telegram_message(message)
                    break
        except Exception as e:
            logger.error(f"Trading strategy execution failed: {e}", exc_info=True)


#지정가 매수 주문을 실행하는 기능
    def execute_limit_buy(self, ticker, price, amount):
        """지정가 매수 주문 실행"""
        if PAPER_TRADING:
            return paper_trading.execute_paper_buy(ticker, price, amount, "페이퍼 트레이딩 매수")
            
        if not rate_limiter.can_make_order():
            time.sleep(0.1)
            return self.execute_limit_buy(ticker, price, amount)
        try:
            url = f"{OVERSEAS_BASE_URL}/uapi/overseas-stock/v1/trading/order"
            body = {
                "cano": KIS_ACCOUNT_NUMBER,
                "acnt_prdt_cd": "01",
                "ovrs_excg_cd": OVERSEAS_MARKET_CODE,
                "pdno": ticker,
                "ord_dvsn": "00",  # 지정가
                "ord_qty": str(amount),
                "ord_unpr": str(int(price))
            }
            response = requests.post(url, headers=kis_client.get_headers(), json=body)
            data = response.json()
            if data.get("rt_cd") == "0":
                return True
            logger.error(f"Limit buy failed for {ticker}: {data}")
            return False
        except Exception as e:
            logger.error(f"Limit buy failed for {ticker}: {e}")
            return False
#지정정가 매도 주문을 실행하는 기능을 수행
    def execute_market_sell(self, ticker, amount):
        """시장가 매도 주문 실행"""
        if PAPER_TRADING:
            current_price = get_current_price(ticker)
            if current_price:
                return paper_trading.execute_paper_sell(ticker, current_price, amount, "페이퍼 트레이딩 매도")
            return False
            
        if not rate_limiter.can_make_order():
            time.sleep(0.1)
            return self.execute_market_sell(ticker, amount)
        try:
            url = f"{OVERSEAS_BASE_URL}/uapi/overseas-stock/v1/trading/order"
            body = {
                "cano": KIS_ACCOUNT_NUMBER,
                "acnt_prdt_cd": "01",
                "ovrs_excg_cd": OVERSEAS_MARKET_CODE,
                "pdno": ticker,
                "ord_dvsn": "01",  # 시장가
                "ord_qty": str(amount),
                "ord_unpr": "0"
            }
            response = requests.post(url, headers=kis_client.get_headers(), json=body)
            data = response.json()
            if data.get("rt_cd") == "0":
                return True
            logger.error(f"Market sell failed for {ticker}: {data}")
            return False
        except Exception as e:
            logger.error(f"Market sell failed for {ticker}: {e}")
            return False

    def find_trading_opportunities(self):
        self.opportunities = self.market_analyzer.scan_for_opportunities()
        

#보유 종목의 포지션을 점검해 손절(stop-loss) 또는 익절(take-profit)을 실행
    def check_positions(self):
        for ticker, position in list(self.stop_loss_manager.positions.items()):
            if not rate_limiter.can_make_api_call():
                time.sleep(0.1)
                continue
            try:
                current_price = get_current_price(ticker)
                if not current_price:
                    logger.error(f"Failed to get current price for {ticker}")
                    continue
                entry_price = position["entry_price"]
                profit_percent = ((current_price - entry_price) / entry_price) * 100
                
                if profit_percent <= -position["stop_loss"]:
                    self._execute_stop_loss(ticker, position, current_price)
                elif profit_percent >= position["take_profit"]:
                    self._execute_take_profit(ticker, position, current_price)
            except Exception as e:
                logger.error(f"Position check failed for {ticker}: {e}")


#손절 조건 발생 시 시장가 매도 주문을 실행하고, 거래 이력과 보유 종목 상태를 업데이트하며, 텔레그램으로 손절 상황을 실시간 알림
    def _execute_stop_loss(self, ticker, position, current_price):
        if self.execute_market_sell(ticker, position["amount"]):
            self.trading_history.add_trade(
                ticker, "sell", current_price, position["amount"],
                f"손절 (손실: {((current_price - position['entry_price']) / position['entry_price'] * 100):.2f}%)"
            )
            self.stop_loss_manager.remove_position(ticker)
            if ticker in self.purchased_stocks["stocks"]:
                self.purchased_stocks["stocks"].remove(ticker)
                FileManager.save_json(STOCKS_FILE, self.purchased_stocks)
            message = (
                f"🔴 손절 실행: {ticker}\n"
                f"진입가: {position['entry_price']:,.0f}\n"
                f"청산가: {current_price:,.0f}\n"
                f"손실률: {((current_price - position['entry_price']) / position['entry_price'] * 100):.2f}%"
            )
            send_telegram_message(message)
#익절 조건 충족 시 시장가 매도 주문을 처리하고 거래 기록 업데이트, 보유 종목 정리, 텔레그램 익절 알림
    def _execute_take_profit(self, ticker, position, current_price):
        if self.execute_market_sell(ticker, position["amount"]):
            self.trading_history.add_trade(
                ticker, "sell", current_price, position["amount"],
                f"익절 (수익: {((current_price - position['entry_price']) / position['entry_price'] * 100):.2f}%)"
            )
            self.stop_loss_manager.remove_position(ticker)
            if ticker in self.purchased_stocks["stocks"]:
                self.purchased_stocks["stocks"].remove(ticker)
                FileManager.save_json(STOCKS_FILE, self.purchased_stocks)
            message = (
                f"🟢 익절 실행: {ticker}\n"
                f"진입가: {position['entry_price']:,.0f}\n"
                f"청산가: {current_price:,.0f}\n"
                f"수익률: {((current_price - position['entry_price']) / position['entry_price'] * 100):.2f}%"
            )
            send_telegram_message(message)


#자동매매 시스템의 핵심 주기 중 포트폴리오 상태를 로깅하고 텔레그램으로 알림
    def dollar_cost_averaging(self, ticker):
        """달러 코스트 애버리징 (DCA) - 기존 포지션에 추가 매수"""
        try:
            current_price = get_current_price(ticker)
            if not current_price:
                logger.warning(f"Could not get current price for {ticker}")
                return
            
            # 현재 보유 수량 확인
            current_balance = self.get_stock_balance(ticker)
            if not current_balance or current_balance <= 0:
                logger.info(f"No current position in {ticker} for DCA")
                return
            
            # DCA 조건: 현재가가 평균 매수가보다 웹사이트 설정값 이상 낮을 때
            position = self.stop_loss_manager.positions.get(ticker)
            if not position:
                logger.info(f"No position data for {ticker}")
                return
            
            avg_price = position['entry_price']
            price_drop = (avg_price - current_price) / avg_price * 100
            
            if price_drop >= DCA_PERCENTAGE:  # 웹사이트 설정값 이상 하락 시 DCA
                krw_balance = self.get_balance()
                if krw_balance and krw_balance >= 10000:
                    # DCA 투자 금액 (웹사이트 설정 사용)
                    dca_budget = krw_balance * (DCA_PERCENTAGE / 100)
                    amount = int(dca_budget // current_price)
                    
                    if amount >= 1:
                        logger.info(f"DCA for {ticker}: {amount} shares at ${current_price:.2f} (price drop: {price_drop:.1f}%)")
                        buy_order = self.execute_limit_buy(ticker, current_price, amount)
                        if buy_order:
                            self.trading_history.add_trade(ticker, "buy", current_price, amount, f"DCA (price drop: {price_drop:.1f}%)")
                            # 평균 매수가 업데이트
                            total_shares = current_balance + amount
                            total_cost = (current_balance * avg_price) + (amount * current_price)
                            new_avg_price = total_cost / total_shares
                            self.stop_loss_manager.update_position(ticker, amount=total_shares, entry_price=new_avg_price)
                            
                            message = (
                                f"💰 DCA 실행: {ticker}\n"
                                f"가격: {current_price:,.2f}\n"
                                f"수량: {amount:,}\n"
                                f"총 금액: {amount * current_price:,.2f}원\n"
                                f"가격 하락: {price_drop:.1f}%\n"
                                f"새 평균가: {new_avg_price:,.2f}"
                            )
                            send_telegram_message(message)
            else:
                logger.info(f"DCA condition not met for {ticker}: price drop {price_drop:.1f}% < 10%")
                
        except Exception as e:
            logger.error(f"DCA failed for {ticker}: {e}")

    def log_portfolio_status(self):
        """포트폴리오 상태 로깅"""
        try:
            if PAPER_TRADING:
                # 페이퍼 트레이딩 성과 로깅
                paper_trading.log_performance()
                return
                
            krw_balance = self.get_balance()
            if krw_balance is None:
                logger.error("Failed to retrieve KRW balance")
                krw_balance = 0
            total_value = krw_balance
            coin_details = []
            for ticker in self.purchased_stocks["stocks"]:
                balance = self.get_stock_balance(ticker)
                current_price = get_current_price(ticker)
                if balance is None or current_price is None:
                    logger.error(f"Failed to get balance or price for {ticker}")
                    continue
                coin_value = balance * current_price
                total_value += coin_value
                coin_details.append({
                    "ticker": ticker,
                    "balance": balance,
                    "current_price": current_price,
                    "value": coin_value
                })
            logger.info(f"KRW Balance: {krw_balance:,.0f}")
            logger.info(f"Total Portfolio Value: {total_value:,.0f}")
            message = (
                f"📊 포트폴리오 상태\n"
                f"KRW 잔고: {krw_balance:,.0f}원\n"
                f"총 자산 가치: {total_value:,.0f}원"
            )
            send_telegram_message(message)
        except Exception as e:
            logger.error(f"Portfolio logging error: {e}")

    def run_trading_cycle(self):
        if SHUTDOWN_REQUESTED:
            return
        self.check_positions()
        if SHUTDOWN_REQUESTED:
            return
        self.find_trading_opportunities()
        if SHUTDOWN_REQUESTED:
            return
        self.execute_trading_strategy()
        
        # 1시간마다 성과 리포트 출력
        current_time = time.time()
        if current_time - self.last_performance_log >= 3600:  # 3600초 = 1시간
            self.log_portfolio_status()
            self.last_performance_log = current_time


class PaperTradingManager:
    """페이퍼 트레이딩 관리 클래스"""
    
    def __init__(self):
        self.balance = PAPER_TRADING_BALANCE
        self.positions = {}  # {ticker: {'amount': shares, 'avg_price': price, 'entry_time': datetime}}
        self.trade_history = []
        self.initial_balance = PAPER_TRADING_BALANCE
        
    def get_balance(self):
        """페이퍼 트레이딩 잔고 조회"""
        return self.balance
        
    def get_stock_balance(self, ticker):
        """페이퍼 트레이딩 보유 주식 조회"""
        if ticker in self.positions:
            return self.positions[ticker]['amount']
        return 0
        
    def execute_paper_buy(self, ticker, price, amount, reason=""):
        """페이퍼 트레이딩 매수 실행"""
        try:
            total_cost = price * amount
            if total_cost > self.balance:
                logger.warning(f"페이퍼 트레이딩: 잔고 부족 - {ticker} 매수 실패")
                return False
                
            # 잔고 차감
            self.balance -= total_cost
            
            # 포지션 업데이트
            if ticker in self.positions:
                # 기존 포지션에 추가
                existing = self.positions[ticker]
                total_shares = existing['amount'] + amount
                total_cost_existing = existing['avg_price'] * existing['amount']
                new_avg_price = (total_cost_existing + total_cost) / total_shares
                self.positions[ticker] = {
                    'amount': total_shares,
                    'avg_price': new_avg_price,
                    'entry_time': existing['entry_time']
                }
            else:
                # 새 포지션 생성
                self.positions[ticker] = {
                    'amount': amount,
                    'avg_price': price,
                    'entry_time': datetime.now()
                }
            
            # 거래 기록
            trade_record = {
                'timestamp': datetime.now(),
                'ticker': ticker,
                'action': 'BUY',
                'price': price,
                'amount': amount,
                'total_cost': total_cost,
                'balance_after': self.balance,
                'reason': reason
            }
            self.trade_history.append(trade_record)
            
            logger.info(f"페이퍼 트레이딩: {ticker} 매수 성공 - {amount}주 @ ${price:.2f} (잔고: ${self.balance:,})")
            return True
            
        except Exception as e:
            logger.error(f"페이퍼 트레이딩 매수 오류: {e}")
            return False
            
    def execute_paper_sell(self, ticker, price, amount, reason=""):
        """페이퍼 트레이딩 매도 실행"""
        try:
            if ticker not in self.positions or self.positions[ticker]['amount'] < amount:
                logger.warning(f"페이퍼 트레이딩: 보유 주식 부족 - {ticker} 매도 실패")
                return False
                
            # 수익 계산
            avg_price = self.positions[ticker]['avg_price']
            profit = (price - avg_price) * amount
            total_revenue = price * amount
            
            # 잔고 증가
            self.balance += total_revenue
            
            # 포지션 업데이트
            remaining_shares = self.positions[ticker]['amount'] - amount
            if remaining_shares <= 0:
                del self.positions[ticker]
            else:
                self.positions[ticker]['amount'] = remaining_shares
            
            # 거래 기록
            trade_record = {
                'timestamp': datetime.now(),
                'ticker': ticker,
                'action': 'SELL',
                'price': price,
                'amount': amount,
                'total_revenue': total_revenue,
                'profit': profit,
                'balance_after': self.balance,
                'reason': reason
            }
            self.trade_history.append(trade_record)
            
            profit_percent = (profit / (avg_price * amount)) * 100
            logger.info(f"페이퍼 트레이딩: {ticker} 매도 성공 - {amount}주 @ ${price:.2f} (수익: ${profit:.2f}, {profit_percent:.2f}%)")
            return True
            
        except Exception as e:
            logger.error(f"페이퍼 트레이딩 매도 오류: {e}")
            return False
            
    def get_portfolio_value(self):
        """페이퍼 트레이딩 포트폴리오 가치 계산"""
        total_value = self.balance
        for ticker, position in self.positions.items():
            try:
                current_price = get_current_price(ticker)
                if current_price:
                    total_value += current_price * position['amount']
            except:
                pass
        return total_value
        
    def get_performance_summary(self):
        """페이퍼 트레이딩 성과 요약"""
        current_value = self.get_portfolio_value()
        total_return = ((current_value - self.initial_balance) / self.initial_balance) * 100
        
        # 거래 통계
        total_trades = len(self.trade_history)
        buy_trades = len([t for t in self.trade_history if t['action'] == 'BUY'])
        sell_trades = len([t for t in self.trade_history if t['action'] == 'SELL'])
        
        # 수익 거래 통계
        profitable_trades = len([t for t in self.trade_history if t['action'] == 'SELL' and t.get('profit', 0) > 0])
        loss_trades = len([t for t in self.trade_history if t['action'] == 'SELL' and t.get('profit', 0) < 0])
        
        win_rate = (profitable_trades / sell_trades * 100) if sell_trades > 0 else 0
        
        return {
            'initial_balance': self.initial_balance,
            'current_balance': self.balance,
            'current_value': current_value,
            'total_return': total_return,
            'total_trades': total_trades,
            'buy_trades': buy_trades,
            'sell_trades': sell_trades,
            'profitable_trades': profitable_trades,
            'loss_trades': loss_trades,
            'win_rate': win_rate
        }
        
    def log_performance(self):
        """페이퍼 트레이딩 성과 로깅"""
        performance = self.get_performance_summary()
        
        message = (
            f"📊 페이퍼 트레이딩 성과 리포트\n"
            f"초기 자금: ${performance['initial_balance']:,}\n"
            f"현재 잔고: ${performance['current_balance']:,}\n"
            f"포트폴리오 가치: ${performance['current_value']:,}\n"
            f"총 수익률: {performance['total_return']:.2f}%\n"
            f"총 거래 횟수: {performance['total_trades']}회\n"
            f"매수: {performance['buy_trades']}회, 매도: {performance['sell_trades']}회\n"
            f"승률: {performance['win_rate']:.1f}% ({performance['profitable_trades']}/{performance['sell_trades']})"
        )
        
        logger.info(message)
        send_telegram_message(message)

#주식 시간 지정 및 시간 간격 설정
def run_bot():
    if SHUTDOWN_REQUESTED:
        return
    bot.run_trading_cycle()

from datetime import datetime, timedelta

def get_next_run_time(now):
    if now.weekday() >= 5 or (now.weekday() == 4 and now.hour >= 2):
        # 주말이거나 금요일 02:00 이후면 다음 월요일 17:00
        days_until_monday = (7 - now.weekday()) % 7 or 7
        next_run = now.replace(hour=17, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)
    elif now.hour >= 2 and now.hour < 17:
        # 평일 02:00~17:00 사이면 오늘 17:00
        next_run = now.replace(hour=17, minute=0, second=0, microsecond=0)
    else:
        # 거래 시간 내이면 즉시 실행
        return now
    return next_run
#주식 시간 체크 지정
if __name__ == "__main__":
    logger.info("📈 Starting main loop...")
    
    # 종료 모니터링 스레드 시작
    import threading
    exit_thread = threading.Thread(target=exit_monitor, daemon=True)
    exit_thread.start()
    
    # TradingBot 초기화
    bot = TradingBot()
    
    # 페이퍼 트레이딩 매니저 초기화 (웹사이트 설정 사용)
    paper_trading = PaperTradingManager() if PAPER_TRADING else None
    
    if PAPER_TRADING:
        logger.info(f"🎮 페이퍼 트레이딩 시작 - 초기 자금: {PAPER_TRADING_BALANCE:,}원")
        send_telegram_message(f"🎮 페이퍼 트레이딩 시작!\n💰 초기 자금: {PAPER_TRADING_BALANCE:,}원")
    else:
        logger.info("💼 실제 거래 모드 시작")
        send_telegram_message("💼 실제 거래 모드 시작!")

    # 기존 메인 루프
    last_config_update = datetime.now()
    
    while not SHUTDOWN_REQUESTED:
        try:
            now = datetime.now(pytz.timezone('Asia/Seoul'))
            
            # 실시간 Firebase 설정 업데이트 (1초마다)
            if (now - last_config_update).total_seconds() >= 1:  # 1초마다
                logger.info("🔄 Firebase에서 최신 설정을 확인합니다...")
                if update_trading_config():
                    logger.info("✅ 설정이 성공적으로 업데이트되었습니다.")
                    # 설정 변경 후 봇 재초기화
                    bot = TradingBot()
                    if PAPER_TRADING:
                        paper_trading = PaperTradingManager()
                last_config_update = now

            # ✅ 평일 + 웹사이트 설정 시간 조건
            is_weekday = now.weekday() < 5  # 월(0)~금(4)
            is_time_window = (
                (now.hour >= TRADING_HOURS_START) or  # 설정된 시작 시간 이후
                (now.hour < TRADING_HOURS_END)        # 설정된 종료 시간 이전
            )

            if is_weekday and is_time_window:
                run_bot()
                # 종료 체크를 위해 더 짧은 간격으로 대기
                for _ in range(60):  # 60초를 1초씩 나누어 대기
                    if SHUTDOWN_REQUESTED:
                        break
                    time.sleep(0.5)  # 0.5초마다 체크
            else:
                # 다음 실행까지 대기 시간 계산
                next_check = now + timedelta(minutes=10)
                logger.info(f"⏸ 거래 시간 대기 - 다음 체크: {next_check.strftime('%H:%M')}")
                # 종료 체크를 위해 더 짧은 간격으로 대기
                for _ in range(600):  # 600초를 1초씩 나누어 대기
                    if SHUTDOWN_REQUESTED:
                        break
                    time.sleep(0.5)  # 0.5초마다 체크
        except (ConnectionError, ValueError) as e:
            logger.error(f"❌ Main loop error: {e}", exc_info=True)
            time.sleep(60)

        except KeyboardInterrupt:
            logger.info("🛑 사용자가 Ctrl+C로 프로그램을 종료했습니다.")
            try:
                send_telegram_message("🛑 사용자가 자동매매 봇을 종료했습니다.")
            except:
                pass
            SHUTDOWN_REQUESTED = True
            # 강제 종료 (Windows에서 확실히 작동)
            os._exit(0)
        except SystemExit:
            logger.info("🛑 시스템 종료 신호를 받았습니다.")
            SHUTDOWN_REQUESTED = True
            break

    # 프로그램 종료 시 정리 작업
    logger.info("🛑 프로그램을 종료합니다. 정리 작업을 수행합니다...")
    try:
        send_telegram_message("🛑 자동매매 봇이 안전하게 종료되었습니다.")
    except:
        pass
    logger.info("✅ 프로그램이 정상적으로 종료되었습니다.")



