import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiSearch, FiSettings, FiRefreshCw } from 'react-icons/fi';

const ChartContainer = styled.div`
  padding: 20px;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 10px 40px 10px 15px;
  color: #ffffff;
  font-size: 14px;
  width: 200px;
  
  &::placeholder {
    color: #a0aec0;
  }
  
  &:focus {
    border-color: #667eea;
    outline: none;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  color: #a0aec0;
`;

const Button = styled(motion.button)`
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid #667eea;
  color: #667eea;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(102, 126, 234, 0.3);
  }
`;

const ChartWrapper = styled.div`
  flex: 1;
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const TradingViewWidget = styled.div`
  width: 100%;
  height: 100%;
`;

const SymbolInfo = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(26, 31, 46, 0.95);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 15px;
  backdrop-filter: blur(10px);
  z-index: 10;
`;

const SymbolName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 5px;
`;

const SymbolPrice = styled.div<{ isPositive?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.isPositive ? '#48bb78' : '#e53e3e'};
  margin-bottom: 5px;
`;

const SymbolChange = styled.div<{ isPositive?: boolean }>`
  font-size: 14px;
  color: ${props => props.isPositive ? '#48bb78' : '#e53e3e'};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 31, 46, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 16px;
`;

const TradingChart: React.FC = () => {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState(45000);
  const [change, setChange] = useState(2.5);

  useEffect(() => {
    // TradingView 위젯 로드
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          width: '100%',
          height: '100%',
          symbol: symbol,
          interval: 'D',
          timezone: 'Asia/Seoul',
          theme: 'dark',
          style: '1',
          locale: 'kr',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: 'tradingview_widget',
        });
        setIsLoading(false);
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [symbol]);

  useEffect(() => {
    // 실시간 가격 업데이트 시뮬레이션
    const interval = setInterval(() => {
      setPrice(prev => {
        const change = (Math.random() - 0.5) * 1000;
        return prev + change;
      });
      setChange(prev => prev + (Math.random() - 0.5) * 0.5);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    setIsLoading(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.querySelector('input') as HTMLInputElement;
    if (input.value.trim()) {
      handleSymbolChange(input.value.trim().toUpperCase());
    }
  };

  return (
    <ChartContainer>
      <Header>
        <Title>실시간 차트</Title>
        <Controls>
          <form onSubmit={handleSearch}>
            <SearchContainer>
              <SearchInput 
                placeholder="심볼 검색 (예: BTCUSDT)" 
                defaultValue={symbol}
              />
              <SearchIcon>
                <FiSearch size={16} />
              </SearchIcon>
            </SearchContainer>
          </form>
          <Button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSymbolChange(symbol)}
          >
            <FiRefreshCw size={16} />
            새로고침
          </Button>
          <Button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSettings size={16} />
            설정
          </Button>
        </Controls>
      </Header>

      <ChartWrapper>
        {isLoading && (
          <LoadingOverlay>
            차트를 불러오는 중...
          </LoadingOverlay>
        )}
        
        <SymbolInfo>
          <SymbolName>{symbol}</SymbolName>
          <SymbolPrice isPositive={change >= 0}>
            ${price.toLocaleString()}
          </SymbolPrice>
          <SymbolChange isPositive={change >= 0}>
            {change >= 0 ? '+' : ''}{change.toFixed(2)}%
          </SymbolChange>
        </SymbolInfo>

        <TradingViewWidget id="tradingview_widget" />
      </ChartWrapper>
    </ChartContainer>
  );
};

// TradingView 타입 정의
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => any;
    };
  }
}

export default TradingChart;
