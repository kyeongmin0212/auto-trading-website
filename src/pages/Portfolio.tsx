import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PortfolioContainer = styled.div`
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled(motion.div)`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: #a0aec0;
  font-size: 14px;
`;

const StatChange = styled.div<{ isPositive?: boolean }>`
  font-size: 12px;
  color: ${props => props.isPositive ? '#48bb78' : '#e53e3e'};
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
`;

const Content = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
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

const HoldingsTable = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  color: #a0aec0;
  font-weight: 500;
  font-size: 14px;
  border-bottom: 1px solid #2d3748;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #2d3748;
  font-size: 14px;
`;

const SymbolCell = styled(Td)`
  font-weight: 600;
  color: #ffffff;
`;

const PriceCell = styled(Td)<{ isPositive?: boolean }>`
  color: ${props => props.isPositive ? '#48bb78' : '#e53e3e'};
  font-weight: 500;
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-top: 20px;
`;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

// 샘플 데이터
const generatePortfolioData = () => [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    quantity: 0.5,
    avgPrice: 45000,
    currentPrice: 46500,
    value: 23250,
    change: 3.33,
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    quantity: 3.2,
    avgPrice: 3200,
    currentPrice: 3150,
    value: 10080,
    change: -1.56,
  },
  {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    quantity: 5000,
    avgPrice: 0.45,
    currentPrice: 0.48,
    value: 2400,
    change: 6.67,
  },
  {
    symbol: 'DOTUSDT',
    name: 'Polkadot',
    quantity: 100,
    avgPrice: 18.5,
    currentPrice: 19.2,
    value: 1920,
    change: 3.78,
  },
  {
    symbol: 'LINKUSDT',
    name: 'Chainlink',
    quantity: 200,
    avgPrice: 12.5,
    currentPrice: 11.8,
    value: 2360,
    change: -5.6,
  },
];

const Portfolio: React.FC = () => {
  const [holdings, setHoldings] = useState(generatePortfolioData());
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange, setTotalChange] = useState(0);

  useEffect(() => {
    const total = holdings.reduce((sum, holding) => sum + holding.value, 0);
    const totalCost = holdings.reduce((sum, holding) => sum + (holding.quantity * holding.avgPrice), 0);
    const change = ((total - totalCost) / totalCost) * 100;
    
    setTotalValue(total);
    setTotalChange(change);
  }, [holdings]);

  useEffect(() => {
    // 실시간 가격 업데이트 시뮬레이션
    const interval = setInterval(() => {
      setHoldings(prev => prev.map(holding => ({
        ...holding,
        currentPrice: holding.currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        value: holding.quantity * holding.currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        change: (Math.random() - 0.5) * 10,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const pieData = holdings.map(holding => ({
    name: holding.symbol,
    value: holding.value,
  }));

  const stats = [
    {
      label: '총 포트폴리오',
      value: `₩${totalValue.toLocaleString()}`,
      change: `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`,
      isPositive: totalChange >= 0,
    },
    {
      label: '총 수익',
      value: `₩${(totalValue - holdings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0)).toLocaleString()}`,
      change: `${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}%`,
      isPositive: totalChange >= 0,
    },
    {
      label: '보유 종목',
      value: `${holdings.length}개`,
      change: '',
      isPositive: true,
    },
    {
      label: '평균 수익률',
      value: `${totalChange.toFixed(2)}%`,
      change: totalChange >= 0 ? '상승' : '하락',
      isPositive: totalChange >= 0,
    },
  ];

  return (
    <PortfolioContainer>
      <Header>
        <Title>포트폴리오</Title>
        <Subtitle>현재 보유 자산과 수익 현황을 확인하세요</Subtitle>
      </Header>

      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <StatValue>{stat.value}</StatValue>
            <StatLabel>{stat.label}</StatLabel>
            {stat.change && (
              <StatChange isPositive={stat.isPositive}>
                {stat.isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                {stat.change}
              </StatChange>
            )}
          </StatCard>
        ))}
      </StatsGrid>

      <Content>
        <Section>
          <SectionTitle>
            <FiDollarSign size={20} />
            보유 자산
          </SectionTitle>
          
          <HoldingsTable>
            <Table>
              <thead>
                <tr>
                  <Th>심볼</Th>
                  <Th>수량</Th>
                  <Th>평균가</Th>
                  <Th>현재가</Th>
                  <Th>평가금액</Th>
                  <Th>수익률</Th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding) => (
                  <motion.tr
                    key={holding.symbol}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}
                  >
                    <SymbolCell>{holding.symbol}</SymbolCell>
                    <Td>{holding.quantity.toLocaleString()}</Td>
                    <Td>₩{holding.avgPrice.toLocaleString()}</Td>
                    <PriceCell isPositive={holding.change >= 0}>
                      ₩{holding.currentPrice.toLocaleString()}
                    </PriceCell>
                    <Td>₩{holding.value.toLocaleString()}</Td>
                    <PriceCell isPositive={holding.change >= 0}>
                      {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                    </PriceCell>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </HoldingsTable>
        </Section>

        <Section>
          <SectionTitle>
            <FiPieChart size={20} />
            자산 분포
          </SectionTitle>
          
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`₩${value.toLocaleString()}`, '평가금액']}
                  contentStyle={{
                    backgroundColor: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '8px',
                    color: '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      </Content>
    </PortfolioContainer>
  );
};

export default Portfolio;
