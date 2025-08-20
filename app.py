from flask import Flask, request, jsonify
from flask_cors import CORS
from kis_api_client import KISApiClient
from code_executor import CodeExecutor
import json
import logging
from datetime import datetime
import os
from dotenv import load_dotenv
import subprocess
import threading
import time
import signal
import psutil

# 환경 변수 로드
load_dotenv()

# Flask 앱 생성
app = Flask(__name__)
CORS(app)  # CORS 설정

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 전역 변수로 API 클라이언트 저장
kis_client = None

# 자동매매 봇 프로세스 관리
trading_bot_process = None
bot_status = {
    'status': 'stopped',  # running, stopped, error
    'start_time': None,
    'last_activity': None,
    'total_trades': 0,
    'profitable_trades': 0,
    'total_profit': 0,
    'current_balance': 0,
    'logs': []
}

def log_activity(message, log_type='info'):
    """활동 로그 추가"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_entry = {
        'timestamp': timestamp,
        'message': message,
        'type': log_type
    }
    bot_status['logs'].insert(0, log_entry)
    bot_status['logs'] = bot_status['logs'][:100]  # 최대 100개 로그 유지
    bot_status['last_activity'] = timestamp

def start_trading_bot():
    """자동매매 봇 시작"""
    global trading_bot_process, bot_status
    
    try:
        if trading_bot_process and trading_bot_process.poll() is None:
            return False, "봇이 이미 실행 중입니다."
        
        # Auto-ganggang.py 실행
        trading_bot_process = subprocess.Popen(
            ['python', 'Auto-ganggang.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        bot_status['status'] = 'running'
        bot_status['start_time'] = datetime.now().isoformat()
        bot_status['last_activity'] = datetime.now().isoformat()
        
        log_activity('자동매매 봇이 시작되었습니다.', 'success')
        
        # 백그라운드에서 봇 출력 모니터링
        def monitor_bot_output():
            while trading_bot_process and trading_bot_process.poll() is None:
                try:
                    output = trading_bot_process.stdout.readline()
                    if output:
                        # 봇 출력에서 중요한 정보 추출
                        if '매수 실행' in output:
                            bot_status['total_trades'] += 1
                            log_activity(f'매수 거래 실행: {output.strip()}', 'success')
                        elif '매도 실행' in output:
                            bot_status['total_trades'] += 1
                            if '수익' in output:
                                bot_status['profitable_trades'] += 1
                            log_activity(f'매도 거래 실행: {output.strip()}', 'success')
                        elif '손절' in output or '익절' in output:
                            log_activity(f'손절/익절 실행: {output.strip()}', 'warning')
                        elif '오류' in output or 'Error' in output:
                            log_activity(f'오류 발생: {output.strip()}', 'error')
                        else:
                            log_activity(output.strip(), 'info')
                except Exception as e:
                    log_activity(f'출력 모니터링 오류: {str(e)}', 'error')
                    break
        
        monitor_thread = threading.Thread(target=monitor_bot_output, daemon=True)
        monitor_thread.start()
        
        return True, "자동매매 봇이 성공적으로 시작되었습니다."
        
    except Exception as e:
        bot_status['status'] = 'error'
        log_activity(f'봇 시작 실패: {str(e)}', 'error')
        return False, f"봇 시작 실패: {str(e)}"

def stop_trading_bot():
    """자동매매 봇 중지"""
    global trading_bot_process, bot_status
    
    try:
        if trading_bot_process and trading_bot_process.poll() is None:
            # 프로세스 종료
            trading_bot_process.terminate()
            
            # 5초 대기 후 강제 종료
            try:
                trading_bot_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                trading_bot_process.kill()
            
            trading_bot_process = None
            bot_status['status'] = 'stopped'
            log_activity('자동매매 봇이 중지되었습니다.', 'warning')
            return True, "자동매매 봇이 성공적으로 중지되었습니다."
        else:
            return False, "실행 중인 봇이 없습니다."
            
    except Exception as e:
        log_activity(f'봇 중지 실패: {str(e)}', 'error')
        return False, f"봇 중지 실패: {str(e)}"

def get_bot_status():
    """봇 상태 조회"""
    global trading_bot_process, bot_status
    
    # 프로세스 상태 확인
    if trading_bot_process:
        if trading_bot_process.poll() is None:
            bot_status['status'] = 'running'
        else:
            bot_status['status'] = 'stopped'
            trading_bot_process = None
    
    return bot_status

@app.route('/api/kis/test-connection', methods=['POST'])
def test_kis_connection():
    """한국투자증권 API 연결 테스트"""
    try:
        data = request.get_json()
        
        # 필수 파라미터 검증
        required_fields = ['appKey', 'appSecret', 'accountNumber', 'accountCode']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400
        
        # API 클라이언트 생성
        client = KISApiClient(
            app_key=data['appKey'],
            app_secret=data['appSecret'],
            account_number=data['accountNumber'],
            account_code=data['accountCode']
        )
        
        # 연결 테스트
        if client.test_connection():
            return jsonify({
                'success': True,
                'message': '한국투자증권 API 연결이 성공했습니다!',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'API 연결 테스트에 실패했습니다.'
            }), 500
            
    except Exception as e:
        logger.error(f"API 연결 테스트 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/connect', methods=['POST'])
def connect_kis_api():
    """한국투자증권 API 연결"""
    global kis_client
    
    try:
        data = request.get_json()
        
        # 필수 파라미터 검증
        required_fields = ['appKey', 'appSecret', 'accountNumber', 'accountCode']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400
        
        # API 클라이언트 생성 및 연결 테스트
        client = KISApiClient(
            app_key=data['appKey'],
            app_secret=data['appSecret'],
            account_number=data['accountNumber'],
            account_code=data['accountCode']
        )
        
        if client.test_connection():
            # 전역 변수에 저장
            kis_client = client
            
            return jsonify({
                'success': True,
                'message': '한국투자증권 API에 성공적으로 연결되었습니다!',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'API 연결에 실패했습니다.'
            }), 500
            
    except Exception as e:
        logger.error(f"API 연결 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/disconnect', methods=['POST'])
def disconnect_kis_api():
    """한국투자증권 API 연결 해제"""
    global kis_client
    
    try:
        kis_client = None
        
        return jsonify({
            'success': True,
            'message': '한국투자증권 API 연결이 해제되었습니다.',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"API 연결 해제 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/account-info', methods=['GET'])
def get_account_info():
    """계좌 정보 조회"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        account_info = kis_client.get_account_info()
        
        return jsonify({
            'success': True,
            'data': account_info,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"계좌 정보 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'계좌 정보 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/overseas-balance', methods=['GET'])
def get_overseas_balance():
    """해외주식 잔고 조회"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        balance = kis_client.get_overseas_stock_balance()
        
        return jsonify({
            'success': True,
            'data': balance,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"해외주식 잔고 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'해외주식 잔고 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/stock-price', methods=['GET'])
def get_stock_price():
    """해외주식 현재가 조회"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        symbol = request.args.get('symbol')
        exchange = request.args.get('exchange', 'NASD')
        
        if not symbol:
            return jsonify({
                'success': False,
                'error': '주식 심볼이 필요합니다.'
            }), 400
        
        price = kis_client.get_overseas_stock_price(symbol, exchange)
        
        return jsonify({
            'success': True,
            'data': price,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"주식 현재가 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'주식 현재가 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/stock-chart', methods=['GET'])
def get_stock_chart():
    """해외주식 차트 데이터 조회"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        symbol = request.args.get('symbol')
        exchange = request.args.get('exchange', 'NASD')
        interval = request.args.get('interval', 'D')
        period = int(request.args.get('period', 30))
        
        if not symbol:
            return jsonify({
                'success': False,
                'error': '주식 심볼이 필요합니다.'
            }), 400
        
        chart_data = kis_client.get_overseas_stock_chart(symbol, exchange, interval, period)
        
        return jsonify({
            'success': True,
            'data': chart_data,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"주식 차트 데이터 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'주식 차트 데이터 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/place-order', methods=['POST'])
def place_order():
    """해외주식 주문 전송"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        data = request.get_json()
        
        # 필수 파라미터 검증
        required_fields = ['symbol', 'exchange', 'orderType', 'quantity', 'price', 'orderSide']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400
        
        # 주문 전송
        order_result = kis_client.place_overseas_stock_order(
            symbol=data['symbol'],
            exchange=data['exchange'],
            order_type=data['orderType'],
            quantity=data['quantity'],
            price=data['price'],
            order_side=data['orderSide']
        )
        
        return jsonify({
            'success': True,
            'data': order_result,
            'message': '주문이 성공적으로 전송되었습니다.',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"주문 전송 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'주문 전송에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/order-history', methods=['GET'])
def get_order_history():
    """주문 내역 조회"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        order_history = kis_client.get_order_history(start_date, end_date)
        
        return jsonify({
            'success': True,
            'data': order_history,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"주문 내역 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'주문 내역 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/execution-history', methods=['GET'])
def get_execution_history():
    """체결 내역 조회"""
    global kis_client
    
    if not kis_client:
        return jsonify({
            'success': False,
            'error': 'API가 연결되지 않았습니다.'
        }), 400
    
    try:
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        execution_history = kis_client.get_execution_history(start_date, end_date)
        
        return jsonify({
            'success': True,
            'data': execution_history,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"체결 내역 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'체결 내역 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/kis/status', methods=['GET'])
def get_api_status():
    """API 연결 상태 확인"""
    global kis_client
    
    return jsonify({
        'success': True,
        'data': {
            'isConnected': kis_client is not None,
            'timestamp': datetime.now().isoformat()
        }
    })

@app.route('/api/trading/execute-code', methods=['POST'])
def execute_trading_code():
    """사용자 정의 자동매매 코드 실행"""
    try:
        data = request.get_json()
        
        # 필수 파라미터 검증
        required_fields = ['code', 'symbols', 'exchange']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'필수 필드가 누락되었습니다: {field}'
                }), 400
        
        code_content = data['code']
        symbols = data['symbols']
        exchange = data['exchange']
        
        # 코드 실행기 생성 및 실행
        try:
            executor = CodeExecutor()
            execution_result = executor.execute_code(code_content, symbols, exchange)
            
            if execution_result['success']:
                logger.info(f"자동매매 코드 실행 성공: {len(symbols)}개 심볼 처리, {execution_result['execution_time']:.2f}초 소요")
                
                return jsonify({
                    'success': True,
                    'data': {
                        'status': 'success',
                        'message': '코드가 성공적으로 실행되었습니다.',
                        'executed_at': datetime.now().isoformat(),
                        'symbols_processed': symbols,
                        'exchange': exchange,
                        'execution_time': execution_result['execution_time'],
                        'result': execution_result['result']
                    },
                    'timestamp': datetime.now().isoformat()
                })
            else:
                logger.error(f"코드 실행 실패: {execution_result['error']}")
                return jsonify({
                    'success': False,
                    'error': f'코드 실행 실패: {execution_result["error"]}'
                }), 400
            
        except Exception as execution_error:
            logger.error(f"코드 실행 오류: {execution_error}")
            return jsonify({
                'success': False,
                'error': f'코드 실행 중 오류가 발생했습니다: {str(execution_error)}'
            }), 500
            
    except Exception as e:
        logger.error(f"코드 실행 API 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'서버 오류가 발생했습니다: {str(e)}'
        }), 500

@app.route('/api/trading/code-status', methods=['GET'])
def get_code_status():
    """실행 중인 자동매매 코드 상태 확인"""
    try:
        # 실제로는 실행 중인 코드들의 상태를 추적해야 함
        active_codes = []
        
        return jsonify({
            'success': True,
            'data': {
                'active_codes': active_codes,
                'total_running': len(active_codes),
                'timestamp': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"코드 상태 조회 오류: {e}")
        return jsonify({
            'success': False,
            'error': f'상태 조회에 실패했습니다: {str(e)}'
        }), 500

@app.route('/api/bot/start', methods=['POST'])
def start_bot():
    """자동매매 봇 시작 API"""
    try:
        success, message = start_trading_bot()
        return jsonify({
            'success': success,
            'message': message,
            'status': bot_status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"서버 오류: {str(e)}",
            'status': bot_status
        }), 500

@app.route('/api/bot/stop', methods=['POST'])
def stop_bot():
    """자동매매 봇 중지 API"""
    try:
        success, message = stop_trading_bot()
        return jsonify({
            'success': success,
            'message': message,
            'status': bot_status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"서버 오류: {str(e)}",
            'status': bot_status
        }), 500

@app.route('/api/bot/status', methods=['GET'])
def get_status():
    """봇 상태 조회 API"""
    try:
        status = get_bot_status()
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"서버 오류: {str(e)}"
        }), 500

@app.route('/api/bot/logs', methods=['GET'])
def get_logs():
    """봇 로그 조회 API"""
    try:
        limit = request.args.get('limit', 100, type=int)
        logs = bot_status['logs'][:limit]
        return jsonify({
            'success': True,
            'logs': logs
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"서버 오류: {str(e)}"
        }), 500

@app.route('/api/bot/clear-logs', methods=['POST'])
def clear_logs():
    """봇 로그 초기화 API"""
    try:
        bot_status['logs'] = []
        log_activity('로그가 초기화되었습니다.', 'info')
        return jsonify({
            'success': True,
            'message': '로그가 초기화되었습니다.'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"서버 오류: {str(e)}"
        }), 500

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    """설정 관리 API"""
    settings_file = 'trading_settings.json'
    
    if request.method == 'GET':
        try:
            if os.path.exists(settings_file):
                with open(settings_file, 'r', encoding='utf-8') as f:
                    settings = json.load(f)
                return jsonify({'success': True, 'settings': settings})
            else:
                return jsonify({'success': True, 'settings': {}})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            settings = request.json
            with open(settings_file, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
            
            # 설정 변경 시 봇에 알림
            if bot_status['status'] == 'running':
                log_activity('웹사이트에서 설정이 변경되었습니다.', 'info')
            
            return jsonify({'success': True, 'message': '설정이 저장되었습니다.'})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """헬스 체크 API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'bot_status': bot_status['status']
    })

if __name__ == '__main__':
    # 환경 변수에서 포트 설정
    port = int(os.environ.get('PORT', 5000))
    
    logger.info(f"한국투자증권 API 서버가 포트 {port}에서 시작됩니다...")
    
    # 개발 모드에서 실행
    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )
