import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiPlay, FiPause, FiRefreshCw, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiClock, FiDollarSign, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AutoTradingContainer = styled.div`
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

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatusCard = styled.div<{ status: 'running' | 'stopped' | 'error' }>`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid ${props => {
    switch (props.status) {
      case 'running': return '#48bb78';
      case 'stopped': return '#4a5568';
      case 'error': return '#e53e3e';
      default: return '#2d3748';
    }
  }};
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const StatusHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const StatusTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatusIndicator = styled.div<{ status: 'running' | 'stopped' | 'error' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'running': return '#48bb78';
      case 'stopped': return '#a0aec0';
      case 'error': return '#e53e3e';
      default: return '#a0aec0';
    }
  }};
  box-shadow: 0 0 10px ${props => {
    switch (props.status) {
      case 'running': return 'rgba(72, 187, 120, 0.5)';
      case 'stopped': return 'rgba(160, 174, 192, 0.3)';
      case 'error': return 'rgba(229, 62, 62, 0.5)';
      default: return 'rgba(160, 174, 192, 0.3)';
    }
  }};
`;

const StatusValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
`;

const StatusLabel = styled.div`
  font-size: 14px;
  color: #a0aec0;
`;

const ControlPanel = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  margin-bottom: 30px;
`;

const ControlTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
`;

const Button = styled(motion.button)<{ variant?: 'primary' | 'success' | 'danger' | 'warning' }>`
  background: ${props => {
    switch (props.variant) {
      case 'success': return 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
      case 'danger': return 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)';
      case 'warning': return 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TradingLog = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const LogTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogContainer = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #e6e6e6;
  max-height: 400px;
  overflow-y: auto;
`;

const LogEntry = styled.div<{ type: 'info' | 'success' | 'warning' | 'error' }>`
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(72, 187, 120, 0.1)';
      case 'warning': return 'rgba(237, 137, 54, 0.1)';
      case 'error': return 'rgba(229, 62, 62, 0.1)';
      default: return 'rgba(102, 126, 234, 0.1)';
    }
  }};
  border-left: 3px solid ${props => {
    switch (props.type) {
      case 'success': return '#48bb78';
      case 'warning': return '#ed8936';
      case 'error': return '#e53e3e';
      default: return '#667eea';
    }
  }};
`;

const LogTime = styled.span`
  color: #a0aec0;
  margin-right: 10px;
`;

const LogMessage = styled.span`
  color: #ffffff;
`;

const InfoBox = styled.div`
  background: rgba(72, 187, 120, 0.1);
  border: 1px solid #48bb78;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
`;

const InfoTitle = styled.h4`
  color: #48bb78;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoText = styled.p`
  color: #a0aec0;
  margin: 0;
  line-height: 1.6;
`;

// API 함수들
const API_BASE_URL = 'http://localhost:5000/api';

const startBot = async () => {
  const response = await fetch(`${API_BASE_URL}/bot/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

const stopBot = async () => {
  const response = await fetch(`${API_BASE_URL}/bot/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

const getBotStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/bot/status`);
  return response.json();
};

const getBotLogs = async (limit = 100) => {
  const response = await fetch(`${API_BASE_URL}/bot/logs?limit=${limit}`);
  return response.json();
};

const clearBotLogs = async () => {
  const response = await fetch(`${API_BASE_URL}/bot/clear-logs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

const AutoTrading: React.FC = () => {
  const [botStatus, setBotStatus] = useState<'running' | 'stopped' | 'error'>('stopped');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [tradingStats, setTradingStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    currentBalance: 0,
    lastTradeTime: 'N/A'
  });
  const [tradingLogs, setTradingLogs] = useState<Array<{
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>>([]);

  // 봇 상태 및 로그 주기적 업데이트
  useEffect(() => {
    const updateStatus = async () => {
      try {
        const statusResponse = await getBotStatus();
        if (statusResponse.success) {
          const status = statusResponse.status;
          setBotStatus(status.status);
          
          // 통계 업데이트
          setTradingStats({
            totalTrades: status.total_trades || 0,
            profitableTrades: status.profitable_trades || 0,
            totalProfit: status.total_profit || 0,
            currentBalance: status.current_balance || 0,
            lastTradeTime: status.last_activity || 'N/A'
          });
      }
    } catch (error) {
        console.error('상태 업데이트 실패:', error);
      }
    };

    const updateLogs = async () => {
      try {
        const logsResponse = await getBotLogs(50);
        if (logsResponse.success) {
          setTradingLogs(logsResponse.logs);
        }
      } catch (error) {
        console.error('로그 업데이트 실패:', error);
      }
    };

    // 초기 로드
    updateStatus();
    updateLogs();

    // 주기적 업데이트 (5초마다)
    const statusInterval = setInterval(updateStatus, 5000);
    const logsInterval = setInterval(updateLogs, 5000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const handleStartBot = async () => {
    setIsStarting(true);
    
    try {
      const response = await startBot();
      
      if (response.success) {
        setBotStatus('running');
        toast.success(response.message);
        
        // 상태 즉시 업데이트
        const statusResponse = await getBotStatus();
        if (statusResponse.success) {
          const status = statusResponse.status;
          setTradingStats({
            totalTrades: status.total_trades || 0,
            profitableTrades: status.profitable_trades || 0,
            totalProfit: status.total_profit || 0,
            currentBalance: status.current_balance || 0,
            lastTradeTime: status.last_activity || 'N/A'
          });
        }
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('봇 시작 실패:', error);
      toast.error('봇 시작 중 오류가 발생했습니다.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopBot = async () => {
    setIsStopping(true);
    
    try {
      const response = await stopBot();
      
      if (response.success) {
        setBotStatus('stopped');
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('봇 중지 실패:', error);
      toast.error('봇 중지 중 오류가 발생했습니다.');
    } finally {
      setIsStopping(false);
    }
  };

  const handleRefreshStats = async () => {
    try {
      const statusResponse = await getBotStatus();
      if (statusResponse.success) {
        const status = statusResponse.status;
        setBotStatus(status.status);
        setTradingStats({
          totalTrades: status.total_trades || 0,
          profitableTrades: status.profitable_trades || 0,
          totalProfit: status.total_profit || 0,
          currentBalance: status.current_balance || 0,
          lastTradeTime: status.last_activity || 'N/A'
        });
        toast.success('통계가 업데이트되었습니다!');
      }
    } catch (error) {
      console.error('통계 업데이트 실패:', error);
      toast.error('통계 업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleClearLogs = async () => {
    try {
      const response = await clearBotLogs();
      if (response.success) {
        setTradingLogs([]);
        toast.success(response.message);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error('로그 초기화 실패:', error);
      toast.error('로그 초기화 중 오류가 발생했습니다.');
    }
  };

  return (
    <AutoTradingContainer>
      <Header>
        <Title>자동매매 모니터링</Title>
        <Subtitle>자동매매 봇의 실시간 상태를 모니터링하고 제어하세요</Subtitle>
      </Header>

      <InfoBox>
        <InfoTitle>
          <FiCheckCircle size={16} />
          💡 자동매매 봇 연동 완료
        </InfoTitle>
        <InfoText>
          웹사이트 설정에서 입력한 API 키와 거래 설정이 자동매매 봇에 자동으로 적용됩니다. 
          설정을 변경하면 봇이 즉시 새로운 설정을 반영합니다.
        </InfoText>
      </InfoBox>

      <StatusGrid>
        <StatusCard status={botStatus}>
          <StatusHeader>
            <StatusTitle>
              <FiPlay size={20} />
              봇 상태
            </StatusTitle>
            <StatusIndicator status={botStatus} />
          </StatusHeader>
          <StatusValue>
            {botStatus === 'running' ? '실행 중' : 
             botStatus === 'stopped' ? '중지됨' : '오류'}
          </StatusValue>
          <StatusLabel>
            {botStatus === 'running' ? '자동매매가 활성화되어 있습니다' : 
             botStatus === 'stopped' ? '봇이 중지되어 있습니다' : '오류가 발생했습니다'}
          </StatusLabel>
      </StatusCard>

        <StatusCard status={botStatus}>
          <StatusHeader>
            <StatusTitle>
              <FiTrendingUp size={20} />
              총 거래 횟수
            </StatusTitle>
          </StatusHeader>
          <StatusValue>{tradingStats.totalTrades}</StatusValue>
          <StatusLabel>전체 거래 횟수</StatusLabel>
        </StatusCard>

        <StatusCard status={botStatus}>
          <StatusHeader>
            <StatusTitle>
              <FiCheckCircle size={20} />
              수익 거래
            </StatusTitle>
          </StatusHeader>
          <StatusValue>{tradingStats.profitableTrades}</StatusValue>
          <StatusLabel>수익을 낸 거래 횟수</StatusLabel>
        </StatusCard>

        <StatusCard status={botStatus}>
          <StatusHeader>
            <StatusTitle>
              <FiDollarSign size={20} />
              총 수익
            </StatusTitle>
          </StatusHeader>
          <StatusValue>{tradingStats.totalProfit.toLocaleString()}원</StatusValue>
          <StatusLabel>누적 수익 금액</StatusLabel>
        </StatusCard>

        <StatusCard status={botStatus}>
          <StatusHeader>
            <StatusTitle>
              <FiDollarSign size={20} />
              현재 잔고
            </StatusTitle>
          </StatusHeader>
          <StatusValue>{tradingStats.currentBalance.toLocaleString()}원</StatusValue>
          <StatusLabel>현재 계좌 잔고</StatusLabel>
        </StatusCard>

        <StatusCard status={botStatus}>
          <StatusHeader>
            <StatusTitle>
              <FiClock size={20} />
              마지막 거래
            </StatusTitle>
          </StatusHeader>
          <StatusValue>{tradingStats.lastTradeTime}</StatusValue>
          <StatusLabel>가장 최근 거래 시간</StatusLabel>
        </StatusCard>
      </StatusGrid>

      <ControlPanel>
        <ControlTitle>
          <FiZap size={20} />
          봇 제어
        </ControlTitle>
        
        <ControlButtons>
          <Button
            variant="success"
            onClick={handleStartBot}
            disabled={isStarting || botStatus === 'running'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlay size={16} />
            {isStarting ? '시작 중...' : '봇 시작'}
          </Button>
          
          <Button
            variant="danger"
            onClick={handleStopBot}
            disabled={isStopping || botStatus === 'stopped'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPause size={16} />
            {isStopping ? '중지 중...' : '봇 중지'}
          </Button>
          
          <Button
            onClick={handleRefreshStats}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw size={16} />
            통계 새로고침
          </Button>
        </ControlButtons>
      </ControlPanel>

      <TradingLog>
        <LogTitle>
          <FiAlertCircle size={20} />
          실시간 거래 로그
        </LogTitle>
        
        <LogContainer>
          {tradingLogs.length === 0 ? (
            <div style={{ color: '#a0aec0', textAlign: 'center', padding: '20px' }}>
              아직 로그가 없습니다. 봇을 시작하면 로그가 표시됩니다.
              </div>
          ) : (
            tradingLogs.map((log, index) => (
              <LogEntry key={index} type={log.type}>
                <LogTime>[{log.timestamp}]</LogTime>
                <LogMessage>{log.message}</LogMessage>
              </LogEntry>
            ))
          )}
        </LogContainer>
        
        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <Button
            variant="warning"
            onClick={handleClearLogs}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            로그 초기화
          </Button>
              </div>
      </TradingLog>
    </AutoTradingContainer>
  );
};

export default AutoTrading; 
