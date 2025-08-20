import requests
import json
import time
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KISApiClient:
    """한국투자증권 해외주식 API 클라이언트"""
    
    def __init__(self, app_key: str, app_secret: str, account_number: str, account_code: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.account_number = account_number
        self.account_code = account_code
        
        # API 엔드포인트
        self.base_url = "https://openapi.koreainvestment.com:9443"
        self.oauth_url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP"
        
        # 토큰 정보
        self.access_token = None
        self.token_expires_at = None
        
        # 세션
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    
    def _get_access_token(self) -> str:
        """액세스 토큰 발급"""
        if self.access_token and self.token_expires_at and datetime.now() < self.token_expires_at:
            return self.access_token
        
        try:
            data = {
                'grant_type': 'client_credentials',
                'appkey': self.app_key,
                'appsecret': self.app_secret
            }
            
            response = self.session.post(self.oauth_url, json=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data['access_token']
            
            # 토큰 만료 시간 설정 (실제로는 expires_in 값을 사용해야 함)
            self.token_expires_at = datetime.now() + timedelta(hours=23)
            
            logger.info("액세스 토큰 발급 성공")
            return self.access_token
            
        except Exception as e:
            logger.error(f"액세스 토큰 발급 실패: {e}")
            raise
    
    def _get_headers(self) -> Dict[str, str]:
        """API 요청 헤더 생성"""
        token = self._get_access_token()
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'authorization': f'Bearer {token}',
            'appkey': self.app_key,
            'appsecret': self.app_secret,
            'tr_id': 'TTTS3012R'  # 기본 거래 ID
        }
    
    def get_account_info(self) -> Dict[str, Any]:
        """계좌 정보 조회"""
        try:
            url = f"{self.base_url}/uapi/domestic-stock/v1/trading-inquire/balance"
            headers = self._get_headers()
            
            params = {
                'CANO': self.account_number,
                'ACNT_PRDT_CD': self.account_code,
                'AFHR_FLPR_YN': 'N',
                'OFL_YN': '',
                'INQR_DVSN': '02',
                'UNPR_DVSN': '01',
                'FUND_STTL_ICLD_YN': 'N',
                'FNCG_AMT_AUTO_RDPT_YN': 'N',
                'PRCS_DVSN': '01',
                'CTX_AREA_FK100': '',
                'CTX_AREA_NK100': ''
            }
            
            response = self.session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"계좌 정보 조회 실패: {e}")
            raise
    
    def get_overseas_stock_balance(self) -> Dict[str, Any]:
        """해외주식 잔고 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading-inquire/balance"
            headers = self._get_headers()
            
            params = {
                'CANO': self.account_number,
                'ACNT_PRDT_CD': self.account_code,
                'OVRS_EXCG_CD': 'NASD',  # 나스닥 기준
                'TR_CRCY_CD': 'USD',
                'CTX_AREA_FK200': '',
                'CTX_AREA_NK200': ''
            }
            
            response = self.session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"해외주식 잔고 조회 실패: {e}")
            raise
    
    def get_overseas_stock_price(self, symbol: str, exchange: str = 'NASD') -> Dict[str, Any]:
        """해외주식 현재가 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/price"
            headers = self._get_headers()
            
            params = {
                'AUTH': '',
                'EXCD': exchange,
                'SYMB': symbol,
                'OVRS_EXCG_CD': exchange,
                'GUBN': '0',
                'DIVD_YN': '0'
            }
            
            response = self.session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"해외주식 현재가 조회 실패: {e}")
            raise
    
    def get_overseas_stock_chart(self, symbol: str, exchange: str = 'NASD', 
                                 interval: str = 'D', period: int = 30) -> Dict[str, Any]:
        """해외주식 차트 데이터 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/inquire-daily-chartprice"
            headers = self._get_headers()
            
            params = {
                'AUTH': '',
                'EXCD': exchange,
                'SYMB': symbol,
                'OVRS_EXCG_CD': exchange,
                'GUBN': '0',
                'DIVD_YN': '0',
                'INQR_DVSN': interval,
                'INQR_CNT': str(period)
            }
            
            response = self.session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"해외주식 차트 데이터 조회 실패: {e}")
            raise
    
    def place_overseas_stock_order(self, symbol: str, exchange: str, order_type: str,
                                  quantity: int, price: float, order_side: str) -> Dict[str, Any]:
        """해외주식 주문 전송"""
        try:
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading/order"
            headers = self._get_headers()
            
            # 주문 타입에 따른 TR ID 설정
            if order_side == 'BUY':
                tr_id = 'JTTT1002U' if order_type == 'MARKET' else 'JTTT1001U'
            else:  # SELL
                tr_id = 'JTTT1006U' if order_type == 'MARKET' else 'JTTT1005U'
            
            headers['tr_id'] = tr_id
            
            data = {
                'CANO': self.account_number,
                'ACNT_PRDT_CD': self.account_code,
                'OVRS_EXCG_CD': exchange,
                'PDNO': symbol,
                'OVRS_ORD_UNPR': str(price),
                'OVRS_ORD_DVSN': '00' if order_type == 'MARKET' else '01',
                'ORD_DVSN': '00' if order_type == 'MARKET' else '01',
                'ORD_QTY': str(quantity),
                'OVRS_ORD_UNPR_UNIT': 'USD',
                'ORD_SORT_DVSN': '00',
                'ORD_DVSN_CD': '00'
            }
            
            response = self.session.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"해외주식 주문 전송 실패: {e}")
            raise
    
    def get_order_history(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """주문 내역 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading-inquire/order"
            headers = self._get_headers()
            
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y%m%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y%m%d')
            
            params = {
                'CANO': self.account_number,
                'ACNT_PRDT_CD': self.account_code,
                'OVRS_EXCG_CD': 'NASD',
                'SORT_DVSN': '00',
                'CTX_AREA_FK200': '',
                'CTX_AREA_NK200': '',
                'INQR_STRT_DT': start_date,
                'INQR_END_DT': end_date
            }
            
            response = self.session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"주문 내역 조회 실패: {e}")
            raise
    
    def get_execution_history(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """체결 내역 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading-inquire/execution"
            headers = self._get_headers()
            
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y%m%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y%m%d')
            
            params = {
                'CANO': self.account_number,
                'ACNT_PRDT_CD': self.account_code,
                'OVRS_EXCG_CD': 'NASD',
                'SORT_DVSN': '00',
                'CTX_AREA_FK200': '',
                'CTX_AREA_NK200': '',
                'INQR_STRT_DT': start_date,
                'INQR_END_DT': end_date
            }
            
            response = self.session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"체결 내역 조회 실패: {e}")
            raise
    
    def test_connection(self) -> bool:
        """API 연결 테스트"""
        try:
            # 간단한 API 호출로 연결 테스트
            self._get_access_token()
            account_info = self.get_account_info()
            
            if account_info.get('rt_cd') == '0':
                logger.info("한국투자증권 API 연결 테스트 성공")
                return True
            else:
                logger.error(f"API 연결 테스트 실패: {account_info.get('msg1')}")
                return False
                
        except Exception as e:
            logger.error(f"API 연결 테스트 실패: {e}")
            return False

# 사용 예시
if __name__ == "__main__":
    # 환경 변수나 설정 파일에서 가져와야 함
    APP_KEY = "your_app_key"
    APP_SECRET = "your_app_secret"
    ACCOUNT_NUMBER = "your_account_number"
    ACCOUNT_CODE = "01"
    
    try:
        # API 클라이언트 생성
        client = KISApiClient(APP_KEY, APP_SECRET, ACCOUNT_NUMBER, ACCOUNT_CODE)
        
        # 연결 테스트
        if client.test_connection():
            print("한국투자증권 API 연결 성공!")
            
            # 계좌 정보 조회
            account_info = client.get_account_info()
            print("계좌 정보:", json.dumps(account_info, indent=2, ensure_ascii=False))
            
            # 해외주식 잔고 조회
            balance = client.get_overseas_stock_balance()
            print("해외주식 잔고:", json.dumps(balance, indent=2, ensure_ascii=False))
            
            # 특정 주식 현재가 조회 (예: Apple)
            price = client.get_overseas_stock_price("AAPL", "NASD")
            print("Apple 현재가:", json.dumps(price, indent=2, ensure_ascii=False))
            
        else:
            print("한국투자증권 API 연결 실패!")
            
    except Exception as e:
        print(f"오류 발생: {e}")
