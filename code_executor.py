import ast
import logging
import traceback
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CodeExecutor:
    """사용자 정의 자동매매 코드를 안전하게 실행하는 클래스"""
    
    def __init__(self):
        self.allowed_modules = {
            'math', 'random', 'datetime', 'time', 'json', 'requests',
            'pandas', 'numpy', 'logging', 'os', 'sys'
        }
        
        self.forbidden_keywords = {
            'exec', 'eval', 'compile', 'open', 'file', 'input',
            'raw_input', 'reload', 'import', 'from', 'del',
            'global', 'nonlocal', 'lambda', 'class', 'def'
        }
        
        self.safe_functions = {
            'print', 'len', 'str', 'int', 'float', 'bool',
            'list', 'dict', 'set', 'tuple', 'range', 'enumerate',
            'zip', 'map', 'filter', 'sum', 'min', 'max', 'abs',
            'round', 'pow', 'divmod', 'bin', 'hex', 'oct'
        }
    
    def validate_code(self, code: str) -> Dict[str, Any]:
        """코드의 안전성을 검증"""
        try:
            # AST 파싱
            tree = ast.parse(code)
            
            # 위험한 함수나 키워드 사용 여부 확인
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        func_name = node.func.id
                        if func_name not in self.safe_functions:
                            return {
                                'is_safe': False,
                                'error': f'허용되지 않은 함수 사용: {func_name}'
                            }
                
                elif isinstance(node, ast.Name):
                    if node.id in self.forbidden_keywords:
                        return {
                            'is_safe': False,
                            'error': f'허용되지 않은 키워드 사용: {node.id}'
                        }
            
            return {'is_safe': True, 'error': None}
            
        except SyntaxError as e:
            return {
                'is_safe': False,
                'error': f'구문 오류: {str(e)}'
            }
        except Exception as e:
            return {
                'is_safe': False,
                'error': f'코드 검증 오류: {str(e)}'
            }
    
    def create_safe_environment(self) -> Dict[str, Any]:
        """안전한 실행 환경 생성"""
        safe_env = {
            '__builtins__': {
                name: getattr(__builtins__, name)
                for name in self.safe_functions
                if hasattr(__builtins__, name)
            }
        }
        
        # 안전한 모듈들 추가
        import math
        safe_env['math'] = math
        
        import random
        safe_env['random'] = random
        
        import datetime
        safe_env['datetime'] = datetime
        
        import time
        safe_env['time'] = time
        
        import json
        safe_env['json'] = json
        
        import logging
        safe_env['logging'] = logging
        
        # 거래 관련 가상 함수들
        safe_env['get_stock_price'] = self._mock_get_stock_price
        safe_env['place_order'] = self._mock_place_order
        safe_env['get_balance'] = self._mock_get_balance
        safe_env['log_trade'] = self._mock_log_trade
        
        return safe_env
    
    def _mock_get_stock_price(self, symbol: str) -> float:
        """가상의 주식 가격 조회 함수"""
        import random
        # 실제로는 API를 통해 가격을 가져와야 함
        return round(random.uniform(100, 1000), 2)
    
    def _mock_place_order(self, symbol: str, side: str, quantity: int, price: float) -> Dict[str, Any]:
        """가상의 주문 전송 함수"""
        return {
            'order_id': f'ORDER_{int(datetime.now().timestamp())}',
            'symbol': symbol,
            'side': side,
            'quantity': quantity,
            'price': price,
            'status': 'pending',
            'timestamp': datetime.now().isoformat()
        }
    
    def _mock_get_balance(self) -> Dict[str, float]:
        """가상의 계좌 잔고 조회 함수"""
        return {
            'cash': 10000.0,
            'total_value': 50000.0,
            'timestamp': datetime.now().isoformat()
        }
    
    def _mock_log_trade(self, message: str) -> None:
        """가상의 거래 로그 함수"""
        logger.info(f"[TRADING LOG] {message}")
    
    def execute_code(self, code: str, symbols: List[str], exchange: str) -> Dict[str, Any]:
        """코드를 안전하게 실행"""
        try:
            # 1. 코드 검증
            validation_result = self.validate_code(code)
            if not validation_result['is_safe']:
                return {
                    'success': False,
                    'error': validation_result['error'],
                    'execution_time': None,
                    'result': None
                }
            
            # 2. 안전한 환경 생성
            safe_env = self.create_safe_environment()
            
            # 3. 실행 시작 시간 기록
            start_time = datetime.now()
            
            # 4. 코드 실행
            exec_result = {}
            exec(code, safe_env, exec_result)
            
            # 5. 실행 완료 시간 기록
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            # 6. 결과 정리
            result = {
                'symbols_processed': symbols,
                'exchange': exchange,
                'execution_time': execution_time,
                'variables': {k: v for k, v in exec_result.items() if not k.startswith('_')},
                'timestamp': end_time.isoformat()
            }
            
            logger.info(f"코드 실행 성공: {len(symbols)}개 심볼, {execution_time:.2f}초 소요")
            
            return {
                'success': True,
                'error': None,
                'execution_time': execution_time,
                'result': result
            }
            
        except Exception as e:
            error_info = {
                'error_type': type(e).__name__,
                'error_message': str(e),
                'traceback': traceback.format_exc()
            }
            
            logger.error(f"코드 실행 실패: {error_info}")
            
            return {
                'success': False,
                'error': f'{type(e).__name__}: {str(e)}',
                'execution_time': None,
                'result': error_info
            }
    
    def analyze_code(self, code: str) -> Dict[str, Any]:
        """코드 분석 (실행하지 않고 구조만 분석)"""
        try:
            tree = ast.parse(code)
            
            analysis = {
                'total_lines': len(code.split('\n')),
                'functions': [],
                'variables': [],
                'calls': [],
                'complexity': 0
            }
            
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    analysis['functions'].append(node.name)
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            analysis['variables'].append(target.id)
                elif isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Name):
                        analysis['calls'].append(node.func.id)
                elif isinstance(node, (ast.If, ast.For, ast.While)):
                    analysis['complexity'] += 1
            
            return {
                'success': True,
                'analysis': analysis
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# 사용 예시
if __name__ == "__main__":
    executor = CodeExecutor()
    
    # 테스트 코드
    test_code = """
# 간단한 자동매매 로직 예시
symbols = ['AAPL', 'GOOGL', 'MSFT']
prices = {}

for symbol in symbols:
    price = get_stock_price(symbol)
    prices[symbol] = price
    log_trade(f"{symbol} 현재가: ${price}")

# 간단한 매매 로직
for symbol, price in prices.items():
    if price > 500:  # $500 이상이면 매도
        order = place_order(symbol, 'SELL', 10, price)
        log_trade(f"매도 주문: {symbol} {order['order_id']}")
    elif price < 200:  # $200 이하면 매수
        order = place_order(symbol, 'BUY', 10, price)
        log_trade(f"매수 주문: {symbol} {order['order_id']}")

balance = get_balance()
log_trade(f"현재 잔고: ${balance['cash']}")
"""
    
    print("=== 코드 분석 ===")
    analysis = executor.analyze_code(test_code)
    print(json.dumps(analysis, indent=2, ensure_ascii=False))
    
    print("\n=== 코드 실행 ===")
    result = executor.execute_code(test_code, ['AAPL', 'GOOGL', 'MSFT'], 'NASD')
    print(json.dumps(result, indent=2, ensure_ascii=False))
