import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiPlus, 
  FiTrash2, 
  FiSettings, 
  FiCode, 
  FiPlay,
  FiSave,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiTarget,
  FiAlertTriangle,
  FiBarChart,
  FiClock,
  FiZap,
  FiCloud,
  FiDownload
} from 'react-icons/fi';
import { saveStrategyTemplate, StrategyTemplate } from '../firebase/services';
import toast from 'react-hot-toast';

const BuilderContainer = styled.div`
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  margin-bottom: 20px;
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

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr 400px;
  gap: 20px;
  flex: 1;
  min-height: 0;
`;

const Sidebar = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  overflow-y: auto;
`;

const SidebarTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IndicatorItem = styled.div`
  background: rgba(45, 55, 72, 0.5);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: grab;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  
  &:hover {
    background: rgba(45, 55, 72, 0.8);
    border-color: #667eea;
    transform: translateY(-2px);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const IndicatorIcon = styled.div<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color};
  color: #ffffff;
`;

const IndicatorInfo = styled.div`
  flex: 1;
`;

const IndicatorName = styled.div`
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const IndicatorDesc = styled.div`
  font-size: 12px;
  color: #a0aec0;
`;

const Canvas = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  overflow-y: auto;
  min-height: 600px;
`;

const CanvasTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropZone = styled.div<{ isDraggingOver: boolean }>`
  min-height: 200px;
  border: 2px dashed ${props => props.isDraggingOver ? '#667eea' : '#4a5568'};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.isDraggingOver ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  transition: all 0.2s ease;
  
  ${props => !props.isDraggingOver && `
    &:hover {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.05);
    }
  `}
`;

const DropZoneText = styled.div`
  color: #a0aec0;
  font-size: 16px;
  text-align: center;
`;

const StrategyBlock = styled.div`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 15px;
  cursor: grab;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const BlockTitle = styled.div`
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const BlockActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const BlockContent = styled.div`
  color: #a0aec0;
  font-size: 14px;
`;

const CodePanel = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  overflow-y: auto;
`;

const CodeTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CodeEditor = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #e6e6e6;
  overflow-x: auto;
  white-space: pre-wrap;
  min-height: 400px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  padding: 12px 20px;
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

const SecondaryButton = styled(Button)`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  
  &:hover {
    background: rgba(45, 55, 72, 1);
    box-shadow: 0 8px 25px rgba(45, 55, 72, 0.3);
  }
`;

// 사용 가능한 지표들
const availableIndicators: Array<{
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  type: 'indicator' | 'action' | 'condition';
}> = [
  {
    id: 'rsi',
    name: 'RSI (상대강도지수)',
    description: '과매수/과매도 구간 판단',
    icon: FiTrendingUp,
    color: 'rgba(72, 187, 120, 0.2)',
    type: 'indicator'
  },
  {
    id: 'macd',
    name: 'MACD',
    description: '추세 전환 신호 감지',
    icon: FiBarChart,
    color: 'rgba(66, 153, 225, 0.2)',
    type: 'indicator'
  },
  {
    id: 'ma',
    name: '이동평균선',
    description: '추세 방향 확인',
    icon: FiTrendingUp,
    color: 'rgba(237, 137, 54, 0.2)',
    type: 'indicator'
  },
  {
    id: 'bollinger',
    name: '볼린저 밴드',
    description: '변동성 기반 매매',
    icon: FiTarget,
    color: 'rgba(159, 122, 234, 0.2)',
    type: 'indicator'
  },
  {
    id: 'volume',
    name: '거래량',
    description: '거래량 기반 신호',
    icon: FiBarChart,
    color: 'rgba(236, 72, 153, 0.2)',
    type: 'indicator'
  }
];

// 사용 가능한 액션들
const availableActions: Array<{
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  type: 'indicator' | 'action' | 'condition';
}> = [
  {
    id: 'buy',
    name: '매수',
    description: '자산 매수 실행',
    icon: FiTrendingUp,
    color: 'rgba(72, 187, 120, 0.2)',
    type: 'action'
  },
  {
    id: 'sell',
    name: '매도',
    description: '자산 매도 실행',
    icon: FiTrendingDown,
    color: 'rgba(229, 62, 62, 0.2)',
    type: 'action'
  },
  {
    id: 'stop_loss',
    name: '손절',
    description: '손실 제한 설정',
    icon: FiAlertTriangle,
    color: 'rgba(237, 137, 54, 0.2)',
    type: 'action'
  },
  {
    id: 'take_profit',
    name: '익절',
    description: '이익 실현 설정',
    icon: FiDollarSign,
    color: 'rgba(72, 187, 120, 0.2)',
    type: 'action'
  }
];

// 사용 가능한 조건들
const availableConditions: Array<{
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  type: 'indicator' | 'action' | 'condition';
}> = [
  {
    id: 'greater_than',
    name: '보다 큼',
    description: '값이 기준보다 클 때',
    icon: FiTrendingUp,
    color: 'rgba(66, 153, 225, 0.2)',
    type: 'condition'
  },
  {
    id: 'less_than',
    name: '보다 작음',
    description: '값이 기준보다 작을 때',
    icon: FiTrendingDown,
    color: 'rgba(229, 62, 62, 0.2)',
    type: 'condition'
  },
  {
    id: 'crosses_above',
    name: '상향 돌파',
    description: '선이 위로 교차할 때',
    icon: FiZap,
    color: 'rgba(237, 137, 54, 0.2)',
    type: 'condition'
  },
  {
    id: 'crosses_below',
    name: '하향 돌파',
    description: '선이 아래로 교차할 때',
    icon: FiZap,
    color: 'rgba(159, 122, 234, 0.2)',
    type: 'condition'
  }
];

interface StrategyItem {
  id: string;
  type: 'indicator' | 'action' | 'condition';
  name: string;
  description: string;
  icon: any;
  color: string;
  config?: any;
}

const StrategyBuilder: React.FC = () => {
  const [strategyItems, setStrategyItems] = useState<StrategyItem[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');

  // 임시 사용자 ID (실제로는 인증 시스템에서 가져와야 함)
  const userId = 'demo-user-123';

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available' && destination.droppableId === 'strategy') {
      const itemId = result.draggableId;
      const allItems = [...availableIndicators, ...availableActions, ...availableConditions];
      const draggedItem = allItems.find(item => item.id === itemId);
      
      if (draggedItem) {
        const newItem: StrategyItem = {
          ...draggedItem,
          id: `${draggedItem.id}_${Date.now()}`,
          config: {}
        };
        
        setStrategyItems(prev => [...prev, newItem]);
        generateCode([...strategyItems, newItem]);
      }
    } else if (source.droppableId === 'strategy' && destination.droppableId === 'strategy') {
      const items = Array.from(strategyItems);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      
      setStrategyItems(items);
      generateCode(items);
    }
  };

  const removeItem = (itemId: string) => {
    const newItems = strategyItems.filter(item => item.id !== itemId);
    setStrategyItems(newItems);
    generateCode(newItems);
  };

  const saveStrategyToFirebase = async () => {
    if (!strategyName.trim()) {
      toast.error('전략 이름을 입력해주세요.');
      return;
    }

    if (strategyItems.length === 0) {
      toast.error('전략에 최소 하나의 요소를 추가해주세요.');
      return;
    }

    setIsSaving(true);

    try {
      const template: Omit<StrategyTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        name: strategyName,
        description: strategyDescription || '사용자 정의 전략',
        exchange: 'binance', // 기본값, 나중에 설정에서 가져올 수 있음
        indicators: strategyItems.filter(item => item.type === 'indicator').map(item => item.name),
        actions: strategyItems.filter(item => item.type === 'action').map(item => item.name),
        conditions: strategyItems.filter(item => item.type === 'condition').map(item => item.name),
        settings: {
          maxTradeAmount: 1000000,
          stopLossPercentage: 5,
          takeProfitPercentage: 10,
        },
        code: generatedCode,
        isPublic: false,
      };

      const result = await saveStrategyTemplate(template);

      if (result.success) {
        toast.success('전략이 Firebase에 저장되었습니다!');
        setStrategyName('');
        setStrategyDescription('');
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

  const generateCode = (items: StrategyItem[]) => {
    let code = `# 자동매매 전략 코드
import ccxt
import pandas as pd
import numpy as np
from datetime import datetime

class AutoTradingStrategy:
    def __init__(self):
        self.exchange = ccxt.binance({
            'apiKey': 'YOUR_API_KEY',
            'secret': 'YOUR_SECRET_KEY',
            'sandbox': True
        })
        
    def get_data(self, symbol='BTC/USDT', timeframe='1h', limit=100):
        """시장 데이터 가져오기"""
        ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    
    def calculate_indicators(self, df):
        """지표 계산"""
`;

    items.forEach(item => {
      switch (item.id.split('_')[0]) {
        case 'rsi':
          code += `
        # RSI 계산
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['rsi'] = 100 - (100 / (1 + rs))`;
          break;
        case 'macd':
          code += `
        # MACD 계산
        exp1 = df['close'].ewm(span=12, adjust=False).mean()
        exp2 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd'] = exp1 - exp2
        df['signal'] = df['macd'].ewm(span=9, adjust=False).mean()`;
          break;
        case 'ma':
          code += `
        # 이동평균선 계산
        df['ma_20'] = df['close'].rolling(window=20).mean()
        df['ma_50'] = df['close'].rolling(window=50).mean()`;
          break;
      }
    });

    code += `
    
    def check_signals(self, df):
        """매매 신호 확인"""
        signals = []
`;

    items.forEach(item => {
      if (item.type === 'condition') {
        code += `
        # ${item.name} 조건 확인
        # TODO: 구체적인 조건 로직 구현`;
      }
    });

    code += `
        return signals
    
    def execute_trade(self, signal):
        """거래 실행"""
`;

    items.forEach(item => {
      if (item.type === 'action') {
        switch (item.id.split('_')[0]) {
          case 'buy':
            code += `
        if signal['action'] == 'buy':
            # 매수 로직
            order = self.exchange.create_market_buy_order(signal['symbol'], signal['amount'])
            print(f"매수 주문 실행: {order}")`;
            break;
          case 'sell':
            code += `
        if signal['action'] == 'sell':
            # 매도 로직
            order = self.exchange.create_market_sell_order(signal['symbol'], signal['amount'])
            print(f"매도 주문 실행: {order}")`;
            break;
        }
      }
    });

    code += `
    
    def run_strategy(self):
        """전략 실행"""
        while True:
            try:
                df = self.get_data()
                df = self.calculate_indicators(df)
                signals = self.check_signals(df)
                
                for signal in signals:
                    self.execute_trade(signal)
                
                time.sleep(60)  # 1분 대기
                
            except Exception as e:
                print(f"오류 발생: {e}")
                time.sleep(60)

if __name__ == "__main__":
    strategy = AutoTradingStrategy()
    strategy.run_strategy()
`;

    setGeneratedCode(code);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <BuilderContainer>
        <Header>
          <Title>전략 빌더</Title>
          <Subtitle>드래그 앤 드롭으로 자동매매 전략을 구성하고 코드를 생성하세요</Subtitle>
        </Header>

        <MainContent>
        <Sidebar>
          <SidebarTitle>
            <FiSettings size={20} />
            사용 가능한 요소
          </SidebarTitle>
          
          <Droppable droppableId="available" isDropDisabled={true}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <h4 style={{ color: '#a0aec0', marginBottom: '10px' }}>📊 지표</h4>
                {availableIndicators.map((indicator, index) => (
                  <Draggable key={indicator.id} draggableId={indicator.id} index={index}>
                    {(provided) => (
                      <IndicatorItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <IndicatorIcon color={indicator.color}>
                          <indicator.icon size={16} />
                        </IndicatorIcon>
                        <IndicatorInfo>
                          <IndicatorName>{indicator.name}</IndicatorName>
                          <IndicatorDesc>{indicator.description}</IndicatorDesc>
                        </IndicatorInfo>
                      </IndicatorItem>
                    )}
                  </Draggable>
                ))}
                
                <h4 style={{ color: '#a0aec0', marginBottom: '10px', marginTop: '20px' }}>⚡ 액션</h4>
                {availableActions.map((action, index) => (
                  <Draggable key={action.id} draggableId={action.id} index={availableIndicators.length + index}>
                    {(provided) => (
                      <IndicatorItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <IndicatorIcon color={action.color}>
                          <action.icon size={16} />
                        </IndicatorIcon>
                        <IndicatorInfo>
                          <IndicatorName>{action.name}</IndicatorName>
                          <IndicatorDesc>{action.description}</IndicatorDesc>
                        </IndicatorInfo>
                      </IndicatorItem>
                    )}
                  </Draggable>
                ))}
                
                <h4 style={{ color: '#a0aec0', marginBottom: '10px', marginTop: '20px' }}>🔗 조건</h4>
                {availableConditions.map((condition, index) => (
                  <Draggable key={condition.id} draggableId={condition.id} index={availableIndicators.length + availableActions.length + index}>
                    {(provided) => (
                      <IndicatorItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <IndicatorIcon color={condition.color}>
                          <condition.icon size={16} />
                        </IndicatorIcon>
                        <IndicatorInfo>
                          <IndicatorName>{condition.name}</IndicatorName>
                          <IndicatorDesc>{condition.description}</IndicatorDesc>
                        </IndicatorInfo>
                      </IndicatorItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </Sidebar>

        <Canvas>
          <CanvasTitle>
            <FiZap size={20} />
            전략 구성
          </CanvasTitle>
          
          <Droppable droppableId="strategy">
            {(provided, snapshot) => (
              <DropZone
                ref={provided.innerRef}
                {...provided.droppableProps}
                isDraggingOver={snapshot.isDraggingOver}
              >
                {strategyItems.length === 0 ? (
                  <DropZoneText>
                    왼쪽에서 요소를 드래그하여 전략을 구성하세요
                  </DropZoneText>
                ) : (
                  strategyItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <StrategyBlock
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <BlockHeader>
                            <BlockTitle>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                background: item.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff'
                              }}>
                                <item.icon size={14} />
                              </div>
                              {item.name}
                            </BlockTitle>
                            <BlockActions>
                              <ActionButton onClick={() => removeItem(item.id)}>
                                <FiTrash2 size={14} />
                              </ActionButton>
                            </BlockActions>
                          </BlockHeader>
                          <BlockContent>
                            {item.description}
                          </BlockContent>
                        </StrategyBlock>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </DropZone>
            )}
          </Droppable>
        </Canvas>

        <CodePanel>
          <CodeTitle>
            <FiCode size={20} />
            생성된 코드
          </CodeTitle>
          
          <CodeEditor>
            {generatedCode || '# 전략을 구성하면 코드가 여기에 생성됩니다'}
          </CodeEditor>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ color: '#a0aec0', fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                전략 이름 *
              </label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="전략 이름을 입력하세요"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(45, 55, 72, 0.5)',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#a0aec0', fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                전략 설명
              </label>
              <textarea
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="전략에 대한 설명을 입력하세요"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(45, 55, 72, 0.5)',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
          
          <ButtonGroup>
            <Button
              onClick={saveStrategyToFirebase}
              disabled={isSaving}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiCloud size={16} />
              {isSaving ? '저장 중...' : 'Firebase에 저장'}
            </Button>
            <SecondaryButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload size={16} />
              코드 다운로드
            </SecondaryButton>
          </ButtonGroup>
        </CodePanel>
        </MainContent>
      </BuilderContainer>
    </DragDropContext>
  );
};

export default StrategyBuilder;
