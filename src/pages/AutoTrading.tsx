import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiSettings, FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AutoTradingContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatusToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ToggleButton = styled(motion.button)<{ isActive: boolean }>`
  background: ${props => props.isActive ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)'};
  border: 1px solid ${props => props.isActive ? '#48bb78' : '#e53e3e'};
  color: ${props => props.isActive ? '#48bb78' : '#e53e3e'};
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.isActive ? 'rgba(72, 187, 120, 0.3)' : 'rgba(229, 62, 62, 0.3)'};
  }
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

const StrategyCard = styled(motion.div)`
  background: rgba(45, 55, 72, 0.5);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
`;

const StrategyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const StrategyName = styled.div`
  font-weight: 600;
  color: #ffffff;
`;

const StrategyActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #a0aec0;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
`;

const StrategyDetails = styled.div`
  font-size: 14px;
  color: #a0aec0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  padding: 10px 12px;
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
  padding: 10px 12px;
  color: #ffffff;
  font-size: 14px;
  
  &:focus {
    border-color: #667eea;
    outline: none;
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const AddButton = styled(Button)`
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid #667eea;
  color: #667eea;
  
  &:hover {
    background: rgba(102, 126, 234, 0.3);
  }
`;

const AutoTrading: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [strategies, setStrategies] = useState([
    {
      id: 1,
      name: '이동평균 크로스오버',
      symbol: 'BTCUSDT',
      type: '매수',
      condition: 'MA5 > MA20',
      isActive: true,
    },
    {
      id: 2,
      name: 'RSI 과매도 매수',
      symbol: 'ETHUSDT',
      type: '매수',
      condition: 'RSI < 30',
      isActive: false,
    },
  ]);

  const [newStrategy, setNewStrategy] = useState({
    name: '',
    symbol: '',
    type: '매수',
    condition: '',
  });

  const handleToggle = () => {
    setIsActive(!isActive);
    toast.success(isActive ? '자동매매가 중지되었습니다.' : '자동매매가 시작되었습니다.');
  };

  const handleAddStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStrategy.name && newStrategy.symbol && newStrategy.condition) {
      const strategy = {
        id: Date.now(),
        ...newStrategy,
        isActive: false,
      };
      setStrategies([...strategies, strategy]);
      setNewStrategy({ name: '', symbol: '', type: '매수', condition: '' });
      toast.success('전략이 추가되었습니다.');
    } else {
      toast.error('모든 필드를 입력해주세요.');
    }
  };

  const handleDeleteStrategy = (id: number) => {
    setStrategies(strategies.filter(s => s.id !== id));
    toast.success('전략이 삭제되었습니다.');
  };

  const handleToggleStrategy = (id: number) => {
    setStrategies(strategies.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  return (
    <AutoTradingContainer>
      <Header>
        <Title>자동매매 설정</Title>
        <StatusToggle>
          <ToggleButton
            isActive={isActive}
            onClick={handleToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive ? <FiPause size={16} /> : <FiPlay size={16} />}
            {isActive ? '자동매매 중지' : '자동매매 시작'}
          </ToggleButton>
        </StatusToggle>
      </Header>

      <Content>
        <Section>
          <SectionTitle>
            <FiSettings size={20} />
            전략 목록
          </SectionTitle>
          
          {strategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <StrategyHeader>
                <StrategyName>{strategy.name}</StrategyName>
                <StrategyActions>
                  <ActionButton onClick={() => handleToggleStrategy(strategy.id)}>
                    {strategy.isActive ? <FiPause size={14} /> : <FiPlay size={14} />}
                  </ActionButton>
                  <ActionButton>
                    <FiEdit size={14} />
                  </ActionButton>
                  <ActionButton onClick={() => handleDeleteStrategy(strategy.id)}>
                    <FiTrash2 size={14} />
                  </ActionButton>
                </StrategyActions>
              </StrategyHeader>
              <StrategyDetails>
                {strategy.symbol} • {strategy.type} • {strategy.condition}
              </StrategyDetails>
            </StrategyCard>
          ))}
        </Section>

        <Section>
          <SectionTitle>
            <FiPlus size={20} />
            새 전략 추가
          </SectionTitle>
          
          <Form onSubmit={handleAddStrategy}>
            <FormGroup>
              <Label>전략 이름</Label>
              <Input
                type="text"
                placeholder="전략 이름을 입력하세요"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>거래 심볼</Label>
              <Input
                type="text"
                placeholder="예: BTCUSDT"
                value={newStrategy.symbol}
                onChange={(e) => setNewStrategy({...newStrategy, symbol: e.target.value})}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>거래 유형</Label>
              <Select
                value={newStrategy.type}
                onChange={(e) => setNewStrategy({...newStrategy, type: e.target.value})}
              >
                <option value="매수">매수</option>
                <option value="매도">매도</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label>매매 조건</Label>
              <Input
                type="text"
                placeholder="예: MA5 > MA20 또는 RSI < 30"
                value={newStrategy.condition}
                onChange={(e) => setNewStrategy({...newStrategy, condition: e.target.value})}
              />
            </FormGroup>
            
            <AddButton
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              전략 추가
            </AddButton>
          </Form>
        </Section>
      </Content>
    </AutoTradingContainer>
  );
};

export default AutoTrading;
