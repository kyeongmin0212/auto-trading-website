import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiActivity,
  FiClock,
  FiBarChart,
  FiTarget,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DashboardContainer = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 32px;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(motion.div)`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const StatTitle = styled.h3`
  color: #a0aec0;
  font-size: 14px;
  font-weight: 500;
`;

const StatIcon = styled.div<{ isPositive?: boolean; variant?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    if (props.variant === 'success') return 'rgba(72, 187, 120, 0.2)';
    if (props.variant === 'warning') return 'rgba(237, 137, 54, 0.2)';
    if (props.variant === 'error') return 'rgba(229, 62, 62, 0.2)';
    if (props.variant === 'info') return 'rgba(66, 153, 225, 0.2)';
    return props.isPositive ? 'rgba(72, 187, 120, 0.2)' : 'rgba(229, 62, 62, 0.2)';
  }};
  color: ${props => {
    if (props.variant === 'success') return '#48bb78';
    if (props.variant === 'warning') return '#ed8936';
    if (props.variant === 'error') return '#e53e3e';
    if (props.variant === 'info') return '#4299e1';
    return props.isPositive ? '#48bb78' : '#e53e3e';
  }};
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #ffffff;
`;

const StatChange = styled.div<{ isPositive?: boolean }>`
  font-size: 14px;
  color: ${props => props.isPositive ? '#48bb78' : '#e53e3e'};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
`;

const ChartSection = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const ChartTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RecentTradesSection = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
`;

const TradeItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #2d3748;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TradeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TradeSymbol = styled.span`
  font-weight: 600;
  color: #ffffff;
`;

const TradeType = styled.span<{ type: 'buy' | 'sell' }>`
  font-size: 12px;
  color: ${props => props.type === 'buy' ? '#48bb78' : '#e53e3e'};
  font-weight: 500;
`;

const TradeAmount = styled.span`
  font-size: 14px;
  color: #a0aec0;
`;

const TradePrice = styled.span<{ isPositive?: boolean }>`
  font-weight: 600;
  color: ${props => props.isPositive ? '#48bb78' : '#e53e3e'};
`;

const PerformanceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const PerformanceCard = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
`;

const PerformanceTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PerformanceValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #ffffff;
`;

const PerformanceLabel = styled.div`
  font-size: 12px;
  color: #a0aec0;
`;

const AlertSection = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
  margin-top: 20px;
`;

const AlertItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #2d3748;
  
  &:last-child {
    border-bottom: none;
  }
`;

const AlertIcon = styled.div<{ type: 'success' | 'warning' | 'error' | 'info' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(72, 187, 120, 0.2)';
      case 'warning': return 'rgba(237, 137, 54, 0.2)';
      case 'error': return 'rgba(229, 62, 62, 0.2)';
      case 'info': return 'rgba(66, 153, 225, 0.2)';
      default: return 'rgba(66, 153, 225, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#48bb78';
      case 'warning': return '#ed8936';
      case 'error': return '#e53e3e';
      case 'info': return '#4299e1';
      default: return '#4299e1';
    }
  }};
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 4px;
`;

const AlertMessage = styled.div`
  font-size: 14px;
  color: #a0aec0;
`;

// 샘플 데이터
const generateChartData = () => {
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      performance: Math.random() * 100 + 50,
      volume: Math.random() * 1000000 + 500000,
    });
  }
  return data;
};

const recentTrades = [
  { symbol: 'BTCUSDT', type: 'buy', amount: '0.05 BTC', price: '$43,250', time: '2분 전' },
  { symbol: 'ETHUSDT', type: 'sell', amount: '0.8 ETH', price: '$2,680', time: '5분 전' },
  { symbol: 'ADAUSDT', type: 'buy', amount: '1000 ADA', price: '$0.45', time: '12분 전' },
  { symbol: 'DOTUSDT', type: 'sell', amount: '50 DOT', price: '$6.80', time: '18분 전' },
  { symbol: 'LINKUSDT', type: 'buy', amount: '25 LINK', price: '$15.20', time: '25분 전' },
];

const alerts = [
  { type: 'success', title: '자동매매 활성화', message: 'BTCUSDT 매수 전략이 성공적으로 실행되었습니다.' },
  { type: 'warning', title: '가격 변동 알림', message: 'ETHUSDT가 설정된 가격 범위를 벗어났습니다.' },
  { type: 'info', title: '시스템 업데이트', message: '새로운 거래 전략이 추가되었습니다.' },
  { type: 'error', title: 'API 연결 오류', message: '거래소 API 연결에 일시적인 문제가 발생했습니다.' },
];

const Dashboard: React.FC = () => {
  const [chartData] = useState(generateChartData());
  const [stats, setStats] = useState({
    totalTrades: 1247,
    successRate: 78.5,
    dailyProfit: 1250000,
    activeStrategies: 8,
  });

  useEffect(() => {
    // 실시간 통계 업데이트 시뮬레이션
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalTrades: prev.totalTrades + Math.floor(Math.random() * 3),
        successRate: Math.max(70, Math.min(85, prev.successRate + (Math.random() - 0.5) * 2)),
        dailyProfit: prev.dailyProfit + (Math.random() - 0.5) * 50000,
        activeStrategies: prev.activeStrategies,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardContainer>
      <Header>
        <Title>시스템 대시보드</Title>
        <Subtitle>자동매매 시스템의 전체 현황과 성과를 한눈에 확인하세요</Subtitle>
      </Header>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatHeader>
            <StatTitle>총 거래 횟수</StatTitle>
            <StatIcon variant="info">
              <FiActivity size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalTrades.toLocaleString()}</StatValue>
          <StatChange isPositive={true}>
            <FiTrendingUp size={14} />
            +12 오늘
          </StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatHeader>
            <StatTitle>성공률</StatTitle>
            <StatIcon variant="success">
              <FiTarget size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.successRate.toFixed(1)}%</StatValue>
          <StatChange isPositive={stats.successRate > 75}>
            <FiTrendingUp size={14} />
            +2.3% 이번 주
          </StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatHeader>
            <StatTitle>일일 수익</StatTitle>
            <StatIcon variant="success">
              <FiDollarSign size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>₩{stats.dailyProfit.toLocaleString()}</StatValue>
          <StatChange isPositive={stats.dailyProfit > 0}>
            <FiTrendingUp size={14} />
            +8.5% 어제 대비
          </StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatHeader>
            <StatTitle>활성 전략</StatTitle>
            <StatIcon variant="warning">
              <FiBarChart size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.activeStrategies}</StatValue>
          <StatChange isPositive={true}>
            <FiCheckCircle size={14} />
            모두 정상 작동
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <ChartSection>
          <ChartTitle>
            <FiTrendingUp size={20} />
            시스템 성과 추이 (30일)
          </ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="date" stroke="#a0aec0" />
              <YAxis stroke="#a0aec0" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1f2e',
                  border: '1px solid #2d3748',
                  borderRadius: '8px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="performance" 
                stroke="#667eea" 
                strokeWidth={2}
                dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        <RecentTradesSection>
          <ChartTitle>
            <FiClock size={20} />
            최근 거래 내역
          </ChartTitle>
          {recentTrades.map((trade, index) => (
            <TradeItem key={index}>
              <TradeInfo>
                <TradeSymbol>{trade.symbol}</TradeSymbol>
                <TradeType type={trade.type as 'buy' | 'sell'}>
                  {trade.type === 'buy' ? '매수' : '매도'}
                </TradeType>
                <TradeAmount>{trade.amount}</TradeAmount>
              </TradeInfo>
              <div style={{ textAlign: 'right' }}>
                <TradePrice isPositive={trade.type === 'buy'}>
                  {trade.price}
                </TradePrice>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  {trade.time}
                </div>
              </div>
            </TradeItem>
          ))}
        </RecentTradesSection>
      </ContentGrid>

      <PerformanceGrid>
        <PerformanceCard>
          <PerformanceTitle>
            <FiBarChart size={16} />
            월간 성과
          </PerformanceTitle>
          <PerformanceValue>+23.4%</PerformanceValue>
          <PerformanceLabel>지난 달 대비 수익률</PerformanceLabel>
        </PerformanceCard>

        <PerformanceCard>
          <PerformanceTitle>
            <FiTarget size={16} />
            목표 달성률
          </PerformanceTitle>
          <PerformanceValue>87%</PerformanceValue>
          <PerformanceLabel>월간 목표 대비 달성률</PerformanceLabel>
        </PerformanceCard>
      </PerformanceGrid>

      <AlertSection>
        <ChartTitle>
          <FiAlertTriangle size={20} />
          시스템 알림
        </ChartTitle>
                 {alerts.map((alert, index) => (
           <AlertItem key={index}>
             <AlertIcon type={alert.type as 'success' | 'warning' | 'error' | 'info'}>
               {alert.type === 'success' && <FiCheckCircle size={16} />}
               {alert.type === 'warning' && <FiAlertTriangle size={16} />}
               {alert.type === 'error' && <FiXCircle size={16} />}
               {alert.type === 'info' && <FiActivity size={16} />}
             </AlertIcon>
            <AlertContent>
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertMessage>{alert.message}</AlertMessage>
            </AlertContent>
          </AlertItem>
        ))}
      </AlertSection>
    </DashboardContainer>
  );
};

export default Dashboard;
