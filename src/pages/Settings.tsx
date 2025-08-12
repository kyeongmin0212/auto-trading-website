import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSave, FiKey, FiBell, FiShield, FiMonitor, FiCode, FiDownload, FiCloud, FiUpload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { saveUserSettings, getUserSettings, UserSettings } from '../firebase/services';

const SettingsContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #a0aec0;
  font-size: 16px;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
`;

const Section = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #a0aec0;
`;

const Input = styled.input`
  background: rgba(45, 55, 72, 0.5);
  border: 1px solid #4a5568;
  border-radius: 6px;
  padding: 12px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    border-color: #667eea;
    outline: none;
  }
  
  &::placeholder {
    color: #718096;
  }
`;

const Select = styled.select`
  background: rgba(45, 55, 72, 0.5);
  border: 1px solid #4a5568;
  border-radius: 6px;
  padding: 12px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    border-color: #667eea;
    outline: none;
  }
`;

const Switch = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
`;

const SwitchInput = styled.input`
  display: none;
`;

const SwitchSlider = styled.div<{ isActive: boolean }>`
  width: 50px;
  height: 24px;
  background: ${props => props.isActive ? '#667eea' : '#4a5568'};
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.isActive ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    background: #ffffff;
    border-radius: 50%;
    transition: all 0.3s ease;
  }
`;

const Button = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  
  &:hover {
    box-shadow: 0 8px 25px rgba(229, 62, 62, 0.3);
  }
`;

const CodeSection = styled.div`
  grid-column: 1 / -1;
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  margin-top: 20px;
`;

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const CodeTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CodeActions = styled.div`
  display: flex;
  gap: 10px;
`;

const CodeEditor = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e6e6e6;
  overflow-x: auto;
  white-space: pre-wrap;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    // API 설정
    apiKey: '',
    apiSecret: '',
    exchange: 'binance',
    
    // 알림 설정
    emailNotifications: true,
    pushNotifications: false,
    priceAlerts: true,
    tradeAlerts: true,
    
    // 거래 설정
    maxTradeAmount: 1000000,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    
    // 보안 설정
    twoFactorAuth: false,
    sessionTimeout: 30,
  });

  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 임시 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  const userId = 'demo-user-123';

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const result = await saveUserSettings(userId, settings);
      
      if (result.success) {
        toast.success('설정이 Firebase에 저장되었습니다!');
        generateCode();
      } else {
        toast.error(`저장 실패: ${result.error}`);
      }
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
      console.error('저장 오류:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('모든 설정을 초기화하시겠습니까?')) {
      setSettings({
        apiKey: '',
        apiSecret: '',
        exchange: 'binance',
        emailNotifications: true,
        pushNotifications: false,
        priceAlerts: true,
        tradeAlerts: true,
        maxTradeAmount: 1000000,
        stopLossPercentage: 5,
        takeProfitPercentage: 10,
        twoFactorAuth: false,
        sessionTimeout: 30,
      });
      toast.success('설정이 초기화되었습니다.');
      generateCode();
    }
  };

  const loadSettingsFromFirebase = async () => {
    setIsLoading(true);
    
    try {
      const result = await getUserSettings(userId);
      
      if (result.success && result.data) {
        const firebaseSettings = result.data;
        setSettings({
          apiKey: firebaseSettings.apiKey,
          apiSecret: firebaseSettings.apiSecret,
          exchange: firebaseSettings.exchange,
          emailNotifications: firebaseSettings.emailNotifications,
          pushNotifications: firebaseSettings.pushNotifications,
          priceAlerts: firebaseSettings.priceAlerts,
          tradeAlerts: firebaseSettings.tradeAlerts,
          maxTradeAmount: firebaseSettings.maxTradeAmount,
          stopLossPercentage: firebaseSettings.stopLossPercentage,
          takeProfitPercentage: firebaseSettings.takeProfitPercentage,
          twoFactorAuth: firebaseSettings.twoFactorAuth,
          sessionTimeout: firebaseSettings.sessionTimeout,
        });
        toast.success('Firebase에서 설정을 불러왔습니다!');
        generateCode();
      } else {
        toast.success('저장된 설정이 없습니다. 새로 설정해주세요.');
      }
    } catch (error) {
      toast.error('설정 불러오기 중 오류가 발생했습니다.');
      console.error('불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const exchangeName = settings.exchange.charAt(0).toUpperCase() + settings.exchange.slice(1);
    
    const code = `# 자동매매 봇 코드
# 설정값: ${exchangeName}, 손절: ${settings.stopLossPercentage}%, 익절: ${settings.takeProfitPercentage}%

import ccxt
import pandas as pd
import numpy as np
import time
from datetime import datetime
import logging

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading_bot.log'),
        logging.StreamHandler()
    ]
)

class AutoTradingBot:
    def __init__(self):
        # 거래소 설정
        self.exchange = ccxt.${settings.exchange}({
            'apiKey': '${settings.apiKey || 'YOUR_API_KEY'}',
            'secret': '${settings.apiSecret || 'YOUR_API_SECRET'}',
            'sandbox': True,  # 테스트 모드 (실제 거래시 False로 변경)
            'enableRateLimit': True,
        })
        
        # 거래 설정
        self.max_trade_amount = ${settings.maxTradeAmount}
        self.stop_loss_percentage = ${settings.stopLossPercentage / 100}
        self.take_profit_percentage = ${settings.takeProfitPercentage / 100}
        
        # 알림 설정
        self.email_notifications = ${settings.emailNotifications}
        self.push_notifications = ${settings.pushNotifications}
        self.price_alerts = ${settings.priceAlerts}
        self.trade_alerts = ${settings.tradeAlerts}
        
        # 보안 설정
        self.session_timeout = ${settings.sessionTimeout * 60}  # 초 단위
        
        logging.info(f"자동매매 봇 초기화 완료: {exchangeName}")
        
    def get_market_data(self, symbol='BTC/USDT', timeframe='1h', limit=100):
        """시장 데이터 가져오기"""
        try:
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
            df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            return df
        except Exception as e:
            logging.error(f"시장 데이터 가져오기 실패: {e}")
            return None
    
    def calculate_rsi(self, df, period=14):
        """RSI 계산"""
        try:
            delta = df['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
            rs = gain / loss
            df['rsi'] = 100 - (100 / (1 + rs))
            return df
        except Exception as e:
            logging.error(f"RSI 계산 실패: {e}")
            return df
    
    def calculate_macd(self, df, fast=12, slow=26, signal=9):
        """MACD 계산"""
        try:
            exp1 = df['close'].ewm(span=fast, adjust=False).mean()
            exp2 = df['close'].ewm(span=slow, adjust=False).mean()
            df['macd'] = exp1 - exp2
            df['signal'] = df['macd'].ewm(span=signal, adjust=False).mean()
            df['histogram'] = df['macd'] - df['signal']
            return df
        except Exception as e:
            logging.error(f"MACD 계산 실패: {e}")
            return df
    
    def calculate_moving_averages(self, df):
        """이동평균선 계산"""
        try:
            df['ma_20'] = df['close'].rolling(window=20).mean()
            df['ma_50'] = df['close'].rolling(window=50).mean()
            df['ma_200'] = df['close'].rolling(window=200).mean()
            return df
        except Exception as e:
            logging.error(f"이동평균선 계산 실패: {e}")
            return df
    
    def check_buy_signal(self, df):
        """매수 신호 확인"""
        try:
            current_price = df['close'].iloc[-1]
            rsi = df['rsi'].iloc[-1]
            macd = df['macd'].iloc[-1]
            signal = df['signal'].iloc[-1]
            ma_20 = df['ma_20'].iloc[-1]
            ma_50 = df['ma_50'].iloc[-1]
            
            # RSI 과매도 + MACD 상향 돌파 + 단기 이평선이 장기 이평선 위
            buy_signal = (
                rsi < 30 and  # RSI 과매도
                macd > signal and  # MACD 상향 돌파
                ma_20 > ma_50 and  # 단기 이평선이 장기 이평선 위
                current_price > ma_20  # 현재가가 단기 이평선 위
            )
            
            if buy_signal:
                logging.info(f"매수 신호 감지: RSI={rsi:.2f}, MACD={macd:.2f}, 가격={current_price:.2f}")
            
            return buy_signal
        except Exception as e:
            logging.error(f"매수 신호 확인 실패: {e}")
            return False
    
    def check_sell_signal(self, df):
        """매도 신호 확인"""
        try:
            current_price = df['close'].iloc[-1]
            rsi = df['rsi'].iloc[-1]
            macd = df['macd'].iloc[-1]
            signal = df['signal'].iloc[-1]
            ma_20 = df['ma_20'].iloc[-1]
            
            # RSI 과매수 + MACD 하향 돌파 + 현재가가 단기 이평선 아래
            sell_signal = (
                rsi > 70 and  # RSI 과매수
                macd < signal and  # MACD 하향 돌파
                current_price < ma_20  # 현재가가 단기 이평선 아래
            )
            
            if sell_signal:
                logging.info(f"매도 신호 감지: RSI={rsi:.2f}, MACD={macd:.2f}, 가격={current_price:.2f}")
            
            return sell_signal
        except Exception as e:
            logging.error(f"매도 신호 확인 실패: {e}")
            return False
    
    def execute_buy_order(self, symbol, amount):
        """매수 주문 실행"""
        try:
            if self.email_notifications:
                logging.info(f"이메일 알림: {symbol} 매수 주문 실행")
            
            if self.trade_alerts:
                logging.info(f"거래 알림: {symbol} 매수 주문 실행")
            
            # 실제 거래 실행 (테스트 모드에서는 주석 처리)
            # order = self.exchange.create_market_buy_order(symbol, amount)
            logging.info(f"매수 주문 실행: {symbol}, 수량: {amount}")
            
            return True
        except Exception as e:
            logging.error(f"매수 주문 실행 실패: {e}")
            return False
    
    def execute_sell_order(self, symbol, amount):
        """매도 주문 실행"""
        try:
            if self.email_notifications:
                logging.info(f"이메일 알림: {symbol} 매도 주문 실행")
            
            if self.trade_alerts:
                logging.info(f"거래 알림: {symbol} 매도 주문 실행")
            
            # 실제 거래 실행 (테스트 모드에서는 주석 처리)
            # order = self.exchange.create_market_sell_order(symbol, amount)
            logging.info(f"매도 주문 실행: {symbol}, 수량: {amount}")
            
            return True
        except Exception as e:
            logging.error(f"매도 주문 실행 실패: {e}")
            return False
    
    def run_strategy(self, symbol='BTC/USDT'):
        """전략 실행"""
        logging.info(f"자동매매 전략 시작: {symbol}")
        
        while True:
            try:
                # 시장 데이터 가져오기
                df = self.get_market_data(symbol)
                if df is None:
                    time.sleep(60)
                    continue
                
                # 기술적 지표 계산
                df = self.calculate_rsi(df)
                df = self.calculate_macd(df)
                df = self.calculate_moving_averages(df)
                
                # 매매 신호 확인
                if self.check_buy_signal(df):
                    self.execute_buy_order(symbol, 0.001)  # BTC 0.001개
                
                elif self.check_sell_signal(df):
                    self.execute_sell_order(symbol, 0.001)  # BTC 0.001개
                
                # 설정된 시간만큼 대기
                time.sleep(60)  # 1분 대기
                
            except Exception as e:
                logging.error(f"전략 실행 중 오류 발생: {e}")
                time.sleep(60)
    
    def stop_trading(self):
        """거래 중지"""
        logging.info("자동매매 중지")
        # 필요한 정리 작업 수행

if __name__ == "__main__":
    try:
        # 봇 인스턴스 생성
        bot = AutoTradingBot()
        
        # 거래 시작
        bot.run_strategy()
        
    except KeyboardInterrupt:
        logging.info("사용자에 의해 중지됨")
        bot.stop_trading()
    except Exception as e:
        logging.error(f"예상치 못한 오류: {e}")
`;

    setGeneratedCode(code);
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `auto_trading_bot_${settings.exchange}.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('코드가 다운로드되었습니다!');
  };

  // 컴포넌트 마운트시 Firebase에서 설정 불러오기 및 코드 생성
  useEffect(() => {
    loadSettingsFromFirebase();
  }, []);

  return (
    <SettingsContainer>
      <Header>
        <Title>설정</Title>
        <Subtitle>자동매매 시스템 설정을 관리하고 코드를 생성하세요</Subtitle>
      </Header>

      <Content>
        <Section>
          <SectionTitle>
            <FiKey size={20} />
            API 설정
          </SectionTitle>
          
          <Form onSubmit={handleSave}>
            <FormGroup>
              <Label>거래소</Label>
              <Select
                value={settings.exchange}
                onChange={(e) => handleInputChange('exchange', e.target.value)}
              >
                <option value="binance">Binance</option>
                <option value="upbit">Upbit</option>
                <option value="bithumb">Bithumb</option>
                <option value="coinone">Coinone</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>API 키</Label>
              <Input
                type="password"
                placeholder="API 키를 입력하세요"
                value={settings.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>API 시크릿</Label>
              <Input
                type="password"
                placeholder="API 시크릿을 입력하세요"
                value={settings.apiSecret}
                onChange={(e) => handleInputChange('apiSecret', e.target.value)}
              />
            </FormGroup>
          </Form>
        </Section>

        <Section>
          <SectionTitle>
            <FiBell size={20} />
            알림 설정
          </SectionTitle>
          
          <Form>
            <FormGroup>
              <Switch>
                <span>이메일 알림</span>
                <SwitchInput
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                />
                <SwitchSlider isActive={settings.emailNotifications} />
              </Switch>
            </FormGroup>
            
            <FormGroup>
              <Switch>
                <span>푸시 알림</span>
                <SwitchInput
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                />
                <SwitchSlider isActive={settings.pushNotifications} />
              </Switch>
            </FormGroup>
            
            <FormGroup>
              <Switch>
                <span>가격 알림</span>
                <SwitchInput
                  type="checkbox"
                  checked={settings.priceAlerts}
                  onChange={(e) => handleInputChange('priceAlerts', e.target.checked)}
                />
                <SwitchSlider isActive={settings.priceAlerts} />
              </Switch>
            </FormGroup>
            
            <FormGroup>
              <Switch>
                <span>거래 알림</span>
                <SwitchInput
                  type="checkbox"
                  checked={settings.tradeAlerts}
                  onChange={(e) => handleInputChange('tradeAlerts', e.target.checked)}
                />
                <SwitchSlider isActive={settings.tradeAlerts} />
              </Switch>
            </FormGroup>
          </Form>
        </Section>

        <Section>
          <SectionTitle>
            <FiMonitor size={20} />
            거래 설정
          </SectionTitle>
          
          <Form>
            <FormGroup>
              <Label>최대 거래 금액 (원)</Label>
              <Input
                type="number"
                value={settings.maxTradeAmount}
                onChange={(e) => handleInputChange('maxTradeAmount', parseInt(e.target.value))}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>손절 비율 (%)</Label>
              <Input
                type="number"
                value={settings.stopLossPercentage}
                onChange={(e) => handleInputChange('stopLossPercentage', parseInt(e.target.value))}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>익절 비율 (%)</Label>
              <Input
                type="number"
                value={settings.takeProfitPercentage}
                onChange={(e) => handleInputChange('takeProfitPercentage', parseInt(e.target.value))}
              />
            </FormGroup>
          </Form>
        </Section>

        <Section>
          <SectionTitle>
            <FiShield size={20} />
            보안 설정
          </SectionTitle>
          
          <Form>
            <FormGroup>
              <Switch>
                <span>2단계 인증</span>
                <SwitchInput
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                />
                <SwitchSlider isActive={settings.twoFactorAuth} />
              </Switch>
            </FormGroup>
            
            <FormGroup>
              <Label>세션 타임아웃 (분)</Label>
              <Select
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
              >
                <option value={15}>15분</option>
                <option value={30}>30분</option>
                <option value={60}>1시간</option>
                <option value={120}>2시간</option>
              </Select>
            </FormGroup>
            
            <ButtonGroup>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiCloud size={16} />
                {isSaving ? '저장 중...' : 'Firebase에 저장'}
              </Button>
              
              <Button
                onClick={loadSettingsFromFirebase}
                disabled={isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiUpload size={16} />
                {isLoading ? '불러오는 중...' : 'Firebase에서 불러오기'}
              </Button>
              
              <DangerButton
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                초기화
              </DangerButton>
            </ButtonGroup>
          </Form>
        </Section>
      </Content>

      <CodeSection>
        <CodeHeader>
          <CodeTitle>
            <FiCode size={20} />
            생성된 자동매매 코드
          </CodeTitle>
          <CodeActions>
            <Button
              onClick={downloadCode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload size={16} />
              코드 다운로드
            </Button>
          </CodeActions>
        </CodeHeader>
        
        <CodeEditor>
          {generatedCode}
        </CodeEditor>
        
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(72, 187, 120, 0.1)', border: '1px solid #48bb78', borderRadius: '8px' }}>
          <h4 style={{ color: '#48bb78', marginBottom: '8px' }}>💡 사용 방법:</h4>
          <ol style={{ color: '#a0aec0', margin: 0, paddingLeft: '20px' }}>
            <li>위의 설정을 변경하면 코드가 자동으로 업데이트됩니다</li>
            <li>코드 다운로드 버튼을 클릭하여 Python 파일을 저장하세요</li>
            <li>필요한 라이브러리를 설치: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>pip install ccxt pandas numpy</code></li>
            <li>API 키와 시크릿을 코드에 입력하세요</li>
            <li>Python 파일을 실행: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>python auto_trading_bot_binance.py</code></li>
          </ol>
        </div>
      </CodeSection>
    </SettingsContainer>
  );
};

export default Settings;
