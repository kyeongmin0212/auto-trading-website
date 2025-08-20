import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiCode, 
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiTarget,
  FiAlertTriangle,
  FiBarChart,
  FiZap,
  FiCloud,
  FiDownload,
  FiSave,
  FiPlay
} from 'react-icons/fi';
import { saveStrategyTemplate, StrategyTemplate } from '../firebase/services';
import toast from 'react-hot-toast';

const BuilderContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: #a0aec0;
  font-size: 18px;
  line-height: 1.6;
`;

const StrategyForm = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const FormSection = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #4a5568;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:focus {
      border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #718096;
  }
`;

const Select = styled.select`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Switch = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 12px 0;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 30px;
`;

const Button = styled(motion.button)<{ variant?: 'primary' | 'success' | 'secondary' }>`
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  background: ${props => {
    switch (props.variant) {
      case 'success': return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'secondary': return 'rgba(45, 55, 72, 0.8)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  
  color: #ffffff;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const CodePreview = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 20px;
  margin-top: 30px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e6e6e6;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
`;

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
`;

const CodeTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoBox = styled.div`
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid #48bb78;
  border-radius: 8px;
  padding: 20px;
  margin-top: 30px;
`;

const InfoTitle = styled.h4`
  color: #48bb78;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
`;

const InfoList = styled.ul`
  color: #a0aec0;
  margin: 0;
  padding-left: 20px;
  line-height: 1.6;
`;

const StrategyBuilder: React.FC = () => {
  const [strategy, setStrategy] = useState({
    name: '',
    description: '',
    
    // 기본 설정
    targetMarket: 'NASDAQ',
    strategyType: 'TREND_FOLLOWING',
    timeframe: '1H',
    paperTrading: true,
    initialBalance: 1000000,
    
    // 매매 조건
    buyCondition: 'RSI_OVERSOLD',
    sellCondition: 'RSI_OVERBOUGHT',
    additionalBuyCondition: 'NONE',
    additionalSellCondition: 'NONE',
    
    // 지표 설정
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
    
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    
    bollingerPeriod: 20,
    bollingerStd: 2,
    
    // 추가 지표들
    shortMA: 10,
    longMA: 50,
    stochasticK: 14,
    stochasticD: 3,
    cciPeriod: 20,
    atrPeriod: 14,
    volumeMAPeriod: 20,
    fibonacciLevels: 'STANDARD',
    
    // 고급 전략 설정
    entryStrategy: 'SINGLE_ENTRY',
    exitStrategy: 'SINGLE_EXIT',
    positionSizing: 'FIXED_PERCENTAGE',
    rebalancingPeriod: 'NEVER',
    hedgingStrategy: 'NONE',
    aiAnalysis: 'NONE',
    
    // 리스크 관리
    stopLoss: 5,
    takeProfit: 10,
    maxPositionSize: 20,
    
    // 추가 설정
    enableDCA: false,
    dcaPercentage: 10,
    tradingHours: {
      start: 9,
      end: 17
    }
  });

  const [generatedCode, setGeneratedCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setStrategy(prev => ({
      ...prev,
      [field]: value
    }));
    generateCode();
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setStrategy(prev => {
      const currentParent = prev[parent as keyof typeof prev];
      if (typeof currentParent === 'object' && currentParent !== null) {
        return {
          ...prev,
          [parent]: {
            ...currentParent,
            [field]: value
          }
        };
      }
      return prev;
    });
    generateCode();
  };

  const generateCode = () => {
    const code = `# 자동매매 전략 설정
# 전략명: ${strategy.name || '기본 전략'}

import pandas as pd
import numpy as np
from datetime import datetime, time

class AutoTradingStrategy:
    def __init__(self):
        # 기본 설정
        self.target_market = "${strategy.targetMarket}"
        self.paper_trading = ${strategy.paperTrading}
        self.initial_balance = ${strategy.initialBalance}
        
        # 매매 조건
        self.buy_condition = "${strategy.buyCondition}"
        self.sell_condition = "${strategy.sellCondition}"
        
        # 지표 설정
        self.rsi_period = ${strategy.rsiPeriod}
        self.rsi_oversold = ${strategy.rsiOversold}
        self.rsi_overbought = ${strategy.rsiOverbought}
        
        self.macd_fast = ${strategy.macdFast}
        self.macd_slow = ${strategy.macdSlow}
        self.macd_signal = ${strategy.macdSignal}
        
        self.bollinger_period = ${strategy.bollingerPeriod}
        self.bollinger_std = ${strategy.bollingerStd}
        
        # 리스크 관리
        self.stop_loss = ${strategy.stopLoss}
        self.take_profit = ${strategy.takeProfit}
        self.max_position_size = ${strategy.maxPositionSize}
        
        # 추가 설정
        self.enable_dca = ${strategy.enableDCA}
        self.dca_percentage = ${strategy.dcaPercentage}
        self.trading_start = ${strategy.tradingHours.start}
        self.trading_end = ${strategy.tradingHours.end}
    
    def check_trading_hours(self):
        current_time = datetime.now().time()
        start_time = time(self.trading_start, 0)
        end_time = time(self.trading_end, 0)
        return start_time <= current_time <= end_time
    
    def calculate_rsi(self, data, period=${strategy.rsiPeriod}):
        delta = data.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def calculate_macd(self, data):
        ema_fast = data.ewm(span=${strategy.macdFast}).mean()
        ema_slow = data.ewm(span=${strategy.macdSlow}).mean()
        macd_line = ema_fast - ema_slow
        signal_line = macd_line.ewm(span=${strategy.macdSignal}).mean()
        histogram = macd_line - signal_line
        return macd_line, signal_line, histogram
    
    def calculate_bollinger_bands(self, data):
        sma = data.rolling(window=${strategy.bollingerPeriod}).mean()
        std = data.rolling(window=${strategy.bollingerPeriod}).std()
        upper_band = sma + (std * ${strategy.bollingerStd})
        lower_band = sma - (std * ${strategy.bollingerStd})
        return upper_band, sma, lower_band
    
    def should_buy(self, data):
        if not self.check_trading_hours():
            return False
            
        rsi = self.calculate_rsi(data)
        current_rsi = rsi.iloc[-1]
        
        if self.buy_condition == "RSI_OVERSOLD":
            return current_rsi < ${strategy.rsiOversold}
        elif self.buy_condition == "BOLLINGER_LOWER":
            upper, middle, lower = self.calculate_bollinger_bands(data)
            return data.iloc[-1] <= lower.iloc[-1]
        
        return False
    
    def should_sell(self, data):
        if not self.check_trading_hours():
            return False
            
        rsi = self.calculate_rsi(data)
        current_rsi = rsi.iloc[-1]
        
        if self.sell_condition == "RSI_OVERBOUGHT":
            return current_rsi > ${strategy.rsiOverbought}
        elif self.sell_condition == "BOLLINGER_UPPER":
            upper, middle, lower = self.calculate_bollinger_bands(data)
            return data.iloc[-1] >= upper.iloc[-1]
        
        return False
    
    def execute_strategy(self, data):
        if self.should_buy(data):
            return "BUY"
        elif self.should_sell(data):
            return "SELL"
        return "HOLD"

# 전략 인스턴스 생성
    strategy = AutoTradingStrategy()

# 사용 예시
# signal = strategy.execute_strategy(price_data)
# if signal == "BUY":
#     place_buy_order()
# elif signal == "SELL":
#     place_sell_order()
`;

    setGeneratedCode(code);
  };

  const handleSave = async () => {
    if (!strategy.name.trim()) {
      toast.error('전략 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const strategyTemplate: Omit<StrategyTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: 'current-user', // 실제로는 현재 로그인된 사용자 ID
        name: strategy.name,
        description: strategy.description,
        exchange: strategy.targetMarket,
        indicators: ['RSI', 'MACD', 'Bollinger Bands'],
        actions: ['BUY', 'SELL', 'HOLD'],
        conditions: [strategy.buyCondition, strategy.sellCondition],
        settings: {
          apiKey: '',
          apiSecret: '',
          exchange: strategy.targetMarket,
          emailNotifications: true,
          pushNotifications: false,
          priceAlerts: true,
          tradeAlerts: true,
          maxTradeAmount: strategy.initialBalance,
          stopLossPercentage: strategy.stopLoss,
          takeProfitPercentage: strategy.takeProfit,
          twoFactorAuth: false,
          sessionTimeout: 30
        },
        code: generatedCode,
        isPublic: false
      };

      await saveStrategyTemplate(strategyTemplate);
      toast.success('전략이 성공적으로 저장되었습니다!');
    } catch (error) {
      console.error('전략 저장 실패:', error);
      toast.error('전략 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${strategy.name || 'strategy'}.py`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('전략 코드가 다운로드되었습니다!');
  };

  // 컴포넌트 마운트시 코드 생성
  React.useEffect(() => {
    generateCode();
  }, []);

  return (
      <BuilderContainer>
        <Header>
          <Title>전략 빌더</Title>
        <Subtitle>
          간단한 설정으로 자동매매 전략을 구성하고 Python 코드를 생성하세요
        </Subtitle>
        </Header>

      <StrategyForm>
        <FormSection>
          <SectionTitle>
            <FiCode size={20} />
            전략 기본 정보
          </SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>전략 이름</Label>
              <Input
                type="text"
                placeholder="예: RSI + MACD 크로스오버 전략"
                value={strategy.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>전략 설명</Label>
              <Input
                type="text"
                placeholder="전략에 대한 상세한 설명"
                value={strategy.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </FormGroup>
            <FormGroup>
              <Label>대상 시장</Label>
              <Select
                value={strategy.targetMarket}
                onChange={(e) => handleInputChange('targetMarket', e.target.value)}
              >
                <option value="NASDAQ">NASDAQ (나스닥)</option>
                <option value="NYSE">NYSE (뉴욕증권거래소)</option>
                <option value="KOSPI">KOSPI (코스피)</option>
                <option value="KOSDAQ">KOSDAQ (코스닥)</option>
                <option value="CRYPTO">암호화폐 (BTC, ETH)</option>
                <option value="FOREX">외환 (USD/KRW, EUR/USD)</option>
                <option value="COMMODITY">상품 (금, 은, 원유)</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>초기 자금 (원)</Label>
              <Input
                type="number"
                value={strategy.initialBalance}
                onChange={(e) => handleInputChange('initialBalance', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>전략 유형</Label>
              <Select
                value={strategy.strategyType || 'TREND_FOLLOWING'}
                onChange={(e) => handleInputChange('strategyType', e.target.value)}
              >
                <option value="TREND_FOLLOWING">트렌드 추종</option>
                <option value="MEAN_REVERSION">평균 회귀</option>
                <option value="BREAKOUT">브레이크아웃</option>
                <option value="SCALPING">스캘핑</option>
                <option value="ARBITRAGE">차익거래</option>
                <option value="PAIRS_TRADING">페어 트레이딩</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>시간프레임</Label>
              <Select
                value={strategy.timeframe || '1H'}
                onChange={(e) => handleInputChange('timeframe', e.target.value)}
              >
                <option value="1M">1분</option>
                <option value="5M">5분</option>
                <option value="15M">15분</option>
                <option value="30M">30분</option>
                <option value="1H">1시간</option>
                <option value="4H">4시간</option>
                <option value="1D">일봉</option>
                <option value="1W">주봉</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FiTrendingUp size={20} />
            매매 조건 설정
          </SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>매수 조건</Label>
              <Select
                value={strategy.buyCondition}
                onChange={(e) => handleInputChange('buyCondition', e.target.value)}
              >
                <option value="RSI_OVERSOLD">RSI 과매도 (30 이하)</option>
                <option value="RSI_OVERSOLD_STRONG">RSI 강한 과매도 (20 이하)</option>
                <option value="BOLLINGER_LOWER">볼린저 밴드 하단</option>
                <option value="BOLLINGER_SQUEEZE">볼린저 밴드 스퀴즈</option>
                <option value="MACD_CROSSOVER">MACD 상향 돌파</option>
                <option value="MACD_HISTOGRAM">MACD 히스토그램 증가</option>
                <option value="STOCHASTIC_OVERSOLD">스토캐스틱 과매도</option>
                <option value="WILLIAMS_R_OVERSOLD">윌리엄스 %R 과매도</option>
                <option value="CCI_OVERSOLD">CCI 과매도</option>
                <option value="PRICE_ACTION_HAMMER">가격 액션 망치형</option>
                <option value="SUPPORT_BREAKOUT">지지선 돌파</option>
                <option value="VOLUME_SPIKE">거래량 급증</option>
                <option value="GOLDEN_CROSS">골든 크로스 (이동평균)</option>
                <option value="FIBONACCI_RETRACEMENT">피보나치 되돌림</option>
                <option value="PIVOT_POINT_SUPPORT">피벗 포인트 지지</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>매도 조건</Label>
              <Select
                value={strategy.sellCondition}
                onChange={(e) => handleInputChange('sellCondition', e.target.value)}
              >
                <option value="RSI_OVERBOUGHT">RSI 과매수 (70 이상)</option>
                <option value="RSI_OVERBOUGHT_STRONG">RSI 강한 과매수 (80 이상)</option>
                <option value="BOLLINGER_UPPER">볼린저 밴드 상단</option>
                <option value="BOLLINGER_EXPANSION">볼린저 밴드 확장</option>
                <option value="MACD_CROSSOVER_DOWN">MACD 하향 돌파</option>
                <option value="MACD_HISTOGRAM_DEC">MACD 히스토그램 감소</option>
                <option value="STOCHASTIC_OVERBOUGHT">스토캐스틱 과매수</option>
                <option value="WILLIAMS_R_OVERBOUGHT">윌리엄스 %R 과매수</option>
                <option value="CCI_OVERBOUGHT">CCI 과매수</option>
                <option value="PRICE_ACTION_SHOOTING">가격 액션 유성형</option>
                <option value="RESISTANCE_BREAKDOWN">저항선 하향 돌파</option>
                <option value="VOLUME_DECLINE">거래량 감소</option>
                <option value="DEATH_CROSS">데드 크로스 (이동평균)</option>
                <option value="FIBONACCI_EXTENSION">피보나치 확장</option>
                <option value="PIVOT_POINT_RESISTANCE">피벗 포인트 저항</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>추가 매수 조건</Label>
              <Select
                value={strategy.additionalBuyCondition || 'NONE'}
                onChange={(e) => handleInputChange('additionalBuyCondition', e.target.value)}
              >
                <option value="NONE">없음</option>
                <option value="VOLUME_CONFIRMATION">거래량 확인</option>
                <option value="TREND_ALIGNMENT">트렌드 정렬</option>
                <option value="MULTIPLE_TIMEFRAMES">다중 시간프레임</option>
                <option value="NEWS_SENTIMENT">뉴스 센티먼트</option>
                <option value="OPTIONS_FLOW">옵션 플로우</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>추가 매도 조건</Label>
              <Select
                value={strategy.additionalSellCondition || 'NONE'}
                onChange={(e) => handleInputChange('additionalSellCondition', e.target.value)}
              >
                <option value="NONE">없음</option>
                <option value="VOLUME_CONFIRMATION">거래량 확인</option>
                <option value="TREND_REVERSAL">트렌드 반전</option>
                <option value="MULTIPLE_TIMEFRAMES">다중 시간프레임</option>
                <option value="NEWS_SENTIMENT">뉴스 센티먼트</option>
                <option value="OPTIONS_FLOW">옵션 플로우</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FiBarChart size={20} />
            지표 설정
          </SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>RSI 기간</Label>
              <Input
                type="number"
                min="5"
                max="50"
                value={strategy.rsiPeriod}
                onChange={(e) => handleInputChange('rsiPeriod', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>RSI 과매도 기준</Label>
              <Input
                type="number"
                min="10"
                max="40"
                value={strategy.rsiOversold}
                onChange={(e) => handleInputChange('rsiOversold', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>RSI 과매수 기준</Label>
              <Input
                type="number"
                min="60"
                max="90"
                value={strategy.rsiOverbought}
                onChange={(e) => handleInputChange('rsiOverbought', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>MACD 빠른 기간</Label>
              <Input
                type="number"
                min="5"
                max="20"
                value={strategy.macdFast}
                onChange={(e) => handleInputChange('macdFast', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>MACD 느린 기간</Label>
              <Input
                type="number"
                min="20"
                max="50"
                value={strategy.macdSlow}
                onChange={(e) => handleInputChange('macdSlow', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>MACD 시그널 기간</Label>
              <Input
                type="number"
                min="5"
                max="20"
                value={strategy.macdSignal}
                onChange={(e) => handleInputChange('macdSignal', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>볼린저 밴드 기간</Label>
              <Input
                type="number"
                min="10"
                max="50"
                value={strategy.bollingerPeriod}
                onChange={(e) => handleInputChange('bollingerPeriod', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>볼린저 밴드 표준편차</Label>
              <Input
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={strategy.bollingerStd}
                onChange={(e) => handleInputChange('bollingerStd', parseFloat(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>이동평균 단기 기간</Label>
              <Input
                type="number"
                min="5"
                max="50"
                value={strategy.shortMA || 10}
                onChange={(e) => handleInputChange('shortMA', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>이동평균 장기 기간</Label>
              <Input
                type="number"
                min="20"
                max="200"
                value={strategy.longMA || 50}
                onChange={(e) => handleInputChange('longMA', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>스토캐스틱 K 기간</Label>
              <Input
                type="number"
                min="5"
                max="30"
                value={strategy.stochasticK || 14}
                onChange={(e) => handleInputChange('stochasticK', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>스토캐스틱 D 기간</Label>
              <Input
                type="number"
                min="3"
                max="10"
                value={strategy.stochasticD || 3}
                onChange={(e) => handleInputChange('stochasticD', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>CCI 기간</Label>
              <Input
                type="number"
                min="10"
                max="50"
                value={strategy.cciPeriod || 20}
                onChange={(e) => handleInputChange('cciPeriod', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>ATR 기간</Label>
              <Input
                type="number"
                min="5"
                max="30"
                value={strategy.atrPeriod || 14}
                onChange={(e) => handleInputChange('atrPeriod', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>거래량 이동평균 기간</Label>
              <Input
                type="number"
                min="5"
                max="50"
                value={strategy.volumeMAPeriod || 20}
                onChange={(e) => handleInputChange('volumeMAPeriod', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>피보나치 되돌림 레벨</Label>
              <Select
                value={strategy.fibonacciLevels || 'STANDARD'}
                onChange={(e) => handleInputChange('fibonacciLevels', e.target.value)}
              >
                <option value="STANDARD">표준 (23.6%, 38.2%, 50%, 61.8%)</option>
                <option value="EXTENDED">확장 (78.6%, 88.6%, 127.2%)</option>
                <option value="CUSTOM">커스텀</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FiZap size={20} />
            고급 전략 설정
          </SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>진입 전략</Label>
              <Select
                value={strategy.entryStrategy || 'SINGLE_ENTRY'}
                onChange={(e) => handleInputChange('entryStrategy', e.target.value)}
              >
                <option value="SINGLE_ENTRY">단일 진입</option>
                <option value="SCALED_ENTRY">단계별 진입</option>
                <option value="GRID_ENTRY">그리드 진입</option>
                <option value="PYRAMIDING">피라미딩</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>청산 전략</Label>
              <Select
                value={strategy.exitStrategy || 'SINGLE_EXIT'}
                onChange={(e) => handleInputChange('exitStrategy', e.target.value)}
              >
                <option value="SINGLE_EXIT">단일 청산</option>
                <option value="PARTIAL_EXIT">부분 청산</option>
                <option value="TRAILING_STOP">트레일링 스탑</option>
                <option value="BREAKEVEN_STOP">손익분기 스탑</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>포지션 사이징</Label>
              <Select
                value={strategy.positionSizing || 'FIXED_PERCENTAGE'}
                onChange={(e) => handleInputChange('positionSizing', e.target.value)}
              >
                <option value="FIXED_PERCENTAGE">고정 비율</option>
                <option value="KELLY_CRITERION">켈리 공식</option>
                <option value="RISK_PER_TRADE">거래당 리스크</option>
                <option value="VOLATILITY_ADJUSTED">변동성 조정</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>리밸런싱 주기</Label>
              <Select
                value={strategy.rebalancingPeriod || 'NEVER'}
                onChange={(e) => handleInputChange('rebalancingPeriod', e.target.value)}
              >
                <option value="NEVER">리밸런싱 안함</option>
                <option value="DAILY">일간</option>
                <option value="WEEKLY">주간</option>
                <option value="MONTHLY">월간</option>
                <option value="QUARTERLY">분기</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>헤징 전략</Label>
              <Select
                value={strategy.hedgingStrategy || 'NONE'}
                onChange={(e) => handleInputChange('hedgingStrategy', e.target.value)}
              >
                <option value="NONE">헤징 안함</option>
                <option value="PAIRS_TRADING">페어 트레이딩</option>
                <option value="OPTIONS_STRATEGY">옵션 전략</option>
                <option value="INVERSE_ETF">역방향 ETF</option>
                <option value="CURRENCY_HEDGE">통화 헤징</option>
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>AI 보조 분석</Label>
              <Select
                value={strategy.aiAnalysis || 'NONE'}
                onChange={(e) => handleInputChange('aiAnalysis', e.target.value)}
              >
                <option value="NONE">AI 분석 안함</option>
                <option value="SENTIMENT_ANALYSIS">뉴스 센티먼트</option>
                <option value="PATTERN_RECOGNITION">패턴 인식</option>
                <option value="PREDICTIVE_MODELING">예측 모델링</option>
                <option value="MACHINE_LEARNING">머신러닝</option>
              </Select>
            </FormGroup>
          </FormGrid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FiTarget size={20} />
            리스크 관리
          </SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>손절 비율 (%)</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={strategy.stopLoss}
                onChange={(e) => handleInputChange('stopLoss', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>익절 비율 (%)</Label>
              <Input
                type="number"
                min="5"
                max="50"
                value={strategy.takeProfit}
                onChange={(e) => handleInputChange('takeProfit', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>최대 포지션 크기 (%)</Label>
              <Input
                type="number"
                min="5"
                max="50"
                value={strategy.maxPositionSize}
                onChange={(e) => handleInputChange('maxPositionSize', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>DCA (달러 코스트 애버리징)</Label>
              <Switch>
                <span>활성화</span>
                <SwitchInput
                  type="checkbox"
                  checked={strategy.enableDCA}
                  onChange={(e) => handleInputChange('enableDCA', e.target.checked)}
                />
                <SwitchSlider isActive={strategy.enableDCA} />
              </Switch>
            </FormGroup>
            {strategy.enableDCA && (
              <FormGroup>
                <Label>DCA 비율 (%)</Label>
                <Input
                  type="number"
                  min="5"
                  max="30"
                  value={strategy.dcaPercentage}
                  onChange={(e) => handleInputChange('dcaPercentage', parseInt(e.target.value))}
                />
              </FormGroup>
            )}
          </FormGrid>
        </FormSection>

        <FormSection>
          <SectionTitle>
            <FiZap size={20} />
            거래 시간 설정
          </SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label>거래 시작 시간 (24시간)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={strategy.tradingHours.start}
                onChange={(e) => handleNestedChange('tradingHours', 'start', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>거래 종료 시간 (24시간)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={strategy.tradingHours.end}
                onChange={(e) => handleNestedChange('tradingHours', 'end', parseInt(e.target.value))}
              />
            </FormGroup>
            <FormGroup>
              <Label>페이퍼 트레이딩</Label>
              <Switch>
                <span>활성화</span>
                <SwitchInput
                  type="checkbox"
                  checked={strategy.paperTrading}
                  onChange={(e) => handleInputChange('paperTrading', e.target.checked)}
                />
                <SwitchSlider isActive={strategy.paperTrading} />
              </Switch>
            </FormGroup>
          </FormGrid>
        </FormSection>
          
          <ButtonGroup>
            <Button
            variant="success"
            onClick={handleSave}
              disabled={isSaving}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <FiSave size={18} />
            {isSaving ? '저장 중...' : '전략 저장'}
            </Button>
          
          <Button
            variant="secondary"
              onClick={downloadCode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
            <FiDownload size={18} />
              코드 다운로드
          </Button>
          </ButtonGroup>
      </StrategyForm>

      <CodePreview>
        <CodeHeader>
          <CodeTitle>
            <FiCode size={18} />
            생성된 Python 코드
          </CodeTitle>
        </CodeHeader>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{generatedCode}</pre>
      </CodePreview>

      <InfoBox>
        <InfoTitle>
          <FiZap size={18} />
          💡 전략 빌더 사용법
        </InfoTitle>
        <InfoList>
          <li>위 설정을 변경하면 Python 코드가 자동으로 생성됩니다</li>
          <li><strong>전략 저장</strong> 버튼으로 Firebase에 전략을 저장할 수 있습니다</li>
          <li><strong>코드 다운로드</strong> 버튼으로 생성된 Python 파일을 다운로드할 수 있습니다</li>
          <li>다운로드한 코드를 자동매매 봇과 연동하여 사용하세요</li>
          <li>모든 설정은 실시간으로 코드에 반영되어 즉시 적용 가능합니다</li>
        </InfoList>
      </InfoBox>
      </BuilderContainer>
  );
};

export default StrategyBuilder;
