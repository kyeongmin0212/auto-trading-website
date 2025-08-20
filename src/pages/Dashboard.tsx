import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiDollarSign, 
  FiActivity,
  FiClock,
  FiTarget,
  FiBarChart,
  FiZap,
  FiPieChart,
  FiCalendar,
  FiAlertCircle
} from 'react-icons/fi';

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
  grid-template-columns: 1fr;
  gap: 30px;
  margin-bottom: 30px;
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

const HoldingsSection = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(10px);
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

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 30px;
  align-items: start;
`;

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CalendarCard = styled(motion.div)`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
`;

const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const CalendarTitle = styled.h3`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CalendarNav = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NavButton = styled.button`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #2d3748;
  border-radius: 6px;
  padding: 6px 10px;
  color: #a0aec0;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
  }
`;

const CurrentMonth = styled.div`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 15px;
`;

const DayHeader = styled.div`
  color: #a0aec0;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  padding: 8px 4px;
`;

const DayCell = styled.div<{ isCurrentMonth?: boolean; isToday?: boolean; hasEvent?: boolean }>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  color: ${props => {
    if (!props.isCurrentMonth) return '#4a5568';
    if (props.isToday) return '#ffffff';
    return '#a0aec0';
  }};
  background: ${props => {
    if (props.isToday) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    if (props.hasEvent) return 'rgba(237, 137, 54, 0.2)';
    return 'transparent';
  }};
  border: ${props => props.hasEvent ? '1px solid #ed8936' : 'none'};
  
  &:hover {
    background: ${props => props.isCurrentMonth ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  }
`;

const EventDot = styled.div`
  position: absolute;
  bottom: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #ed8936;
`;

const EventList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const EventItem = styled.div`
  padding: 10px;
  border-radius: 8px;
  background: rgba(45, 55, 72, 0.5);
  margin-bottom: 8px;
  border-left: 3px solid #ed8936;
`;

const EventDate = styled.div`
  color: #ed8936;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const EventTitle = styled.div`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
`;

const EventDescription = styled.div`
  color: #a0aec0;
  font-size: 12px;
`;

// 샘플 보유자산 데이터
const generateHoldingsData = () => [
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

// 경제지표 이벤트 데이터
const economicEvents = [
  // 2025년 1월 (과거)
  {
    id: 1,
    date: '2025-01-03',
    title: '미국 고용지표',
    description: '12월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '21.6만명 (예상: 17.5만명)',
    importance: 'high'
  },
  {
    id: 2,
    date: '2025-01-10',
    title: '미국 소비자물가지수(CPI)',
    description: '12월 CPI 발표',
    time: '21:30 KST',
    result: '3.4% (예상: 3.2%)',
    importance: 'high'
  },
  {
    id: 3,
    date: '2025-01-14',
    title: '미국 생산자물가지수(PPI)',
    description: '12월 PPI 발표',
    time: '21:30 KST',
    result: '1.0% (예상: 1.2%)',
    importance: 'high'
  },
  {
    id: 4,
    date: '2025-01-15',
    title: '연준 의사록 발표',
    description: '12월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    result: '금리 인하 시점 논의 지속',
    importance: 'high'
  },
  {
    id: 5,
    date: '2025-01-22',
    title: '유럽 중앙은행 회의',
    description: 'ECB 통화정책 회의',
    time: '21:45 KST',
    result: '기준금리 4.5% 유지',
    importance: 'high'
  },
  {
    id: 6,
    date: '2025-01-29',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    result: '기준금리 5.25-5.50% 유지',
    importance: 'high'
  },
  // 2025년 2월 (과거)
  {
    id: 7,
    date: '2025-02-07',
    title: '미국 고용지표',
    description: '1월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '18.9만명 (예상: 18.5만명)',
    importance: 'high'
  },
  {
    id: 8,
    date: '2025-02-12',
    title: '미국 소비자물가지수(CPI)',
    description: '1월 CPI 발표',
    time: '21:30 KST',
    result: '3.1% (예상: 3.0%)',
    importance: 'high'
  },
  {
    id: 9,
    date: '2025-02-13',
    title: '미국 생산자물가지수(PPI)',
    description: '1월 PPI 발표',
    time: '21:30 KST',
    result: '0.9% (예상: 1.0%)',
    importance: 'high'
  },
  {
    id: 10,
    date: '2025-02-19',
    title: '연준 의사록 발표',
    description: '1월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    result: '인플레이션 우려 지속',
    importance: 'medium'
  },
  {
    id: 11,
    date: '2025-02-26',
    title: '미국 GDP 발표',
    description: '4분기 GDP 성장률 발표',
    time: '21:30 KST',
    result: '3.3% (예상: 2.0%)',
    importance: 'medium'
  },
  // 2025년 3월 (과거)
  {
    id: 12,
    date: '2025-03-07',
    title: '미국 고용지표',
    description: '2월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '20.1만명 (예상: 19.0만명)',
    importance: 'high'
  },
  {
    id: 13,
    date: '2025-03-12',
    title: '미국 소비자물가지수(CPI)',
    description: '2월 CPI 발표',
    time: '21:30 KST',
    result: '3.2% (예상: 3.1%)',
    importance: 'high'
  },
  {
    id: 14,
    date: '2025-03-13',
    title: '미국 생산자물가지수(PPI)',
    description: '2월 PPI 발표',
    time: '21:30 KST',
    result: '1.6% (예상: 1.4%)',
    importance: 'high'
  },
  {
    id: 15,
    date: '2025-03-19',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    result: '기준금리 5.25-5.50% 유지',
    importance: 'high'
  },
  {
    id: 16,
    date: '2025-03-27',
    title: '유럽 중앙은행 회의',
    description: 'ECB 통화정책 회의',
    time: '21:45 KST',
    result: '기준금리 4.5% 유지',
    importance: 'high'
  },
  // 2025년 4월 (과거)
  {
    id: 17,
    date: '2025-04-04',
    title: '미국 고용지표',
    description: '3월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '19.8만명 (예상: 18.5만명)',
    importance: 'high'
  },
  {
    id: 18,
    date: '2025-04-10',
    title: '미국 소비자물가지수(CPI)',
    description: '3월 CPI 발표',
    time: '21:30 KST',
    result: '3.5% (예상: 3.2%)',
    importance: 'high'
  },
  {
    id: 19,
    date: '2025-04-11',
    title: '미국 생산자물가지수(PPI)',
    description: '3월 PPI 발표',
    time: '21:30 KST',
    result: '2.1% (예상: 1.8%)',
    importance: 'high'
  },
  {
    id: 20,
    date: '2025-04-17',
    title: '연준 의사록 발표',
    description: '3월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    result: '금리 인하 시점 불확실성 증가',
    importance: 'medium'
  },
  {
    id: 21,
    date: '2025-04-25',
    title: '미국 GDP 발표',
    description: '1분기 GDP 성장률 발표',
    time: '21:30 KST',
    result: '1.6% (예상: 2.5%)',
    importance: 'medium'
  },
  {
    id: 22,
    date: '2025-04-30',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    result: '기준금리 5.25-5.50% 유지',
    importance: 'high'
  },
  // 2025년 5월 (과거)
  {
    id: 23,
    date: '2025-05-02',
    title: '미국 제조업 구매관리자지수(PMI)',
    description: '4월 ISM 제조업 PMI 발표',
    time: '23:00 KST',
    result: '49.2 (예상: 50.1)',
    importance: 'medium'
  },
  {
    id: 24,
    date: '2025-05-07',
    title: '미국 고용지표',
    description: '4월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '17.5만명 (예상: 18.0만명)',
    importance: 'high'
  },
  {
    id: 25,
    date: '2025-05-14',
    title: '미국 소비자물가지수(CPI)',
    description: '4월 CPI 발표',
    time: '21:30 KST',
    result: '3.4% (예상: 3.5%)',
    importance: 'high'
  },
  {
    id: 26,
    date: '2025-05-15',
    title: '미국 생산자물가지수(PPI)',
    description: '4월 PPI 발표',
    time: '21:30 KST',
    result: '2.2% (예상: 2.0%)',
    importance: 'high'
  },
  {
    id: 27,
    date: '2025-05-21',
    title: '연준 의사록 발표',
    description: '4월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    result: '인플레이션 압박 지속',
    importance: 'medium'
  },
  // 2025년 6월 (과거)
  {
    id: 28,
    date: '2025-06-06',
    title: '미국 고용지표',
    description: '5월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '18.2만명 (예상: 18.5만명)',
    importance: 'high'
  },
  {
    id: 29,
    date: '2025-06-12',
    title: '미국 소비자물가지수(CPI)',
    description: '5월 CPI 발표',
    time: '21:30 KST',
    result: '3.3% (예상: 3.4%)',
    importance: 'high'
  },
  {
    id: 30,
    date: '2025-06-13',
    title: '미국 생산자물가지수(PPI)',
    description: '5월 PPI 발표',
    time: '21:30 KST',
    result: '1.8% (예상: 1.9%)',
    importance: 'high'
  },
  {
    id: 31,
    date: '2025-06-18',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    result: '기준금리 5.25-5.50% 유지',
    importance: 'high'
  },
  {
    id: 32,
    date: '2025-06-26',
    title: '유럽 중앙은행 회의',
    description: 'ECB 통화정책 회의',
    time: '21:45 KST',
    result: '기준금리 4.5% 유지',
    importance: 'high'
  },
  // 2025년 7월 (과거)
  {
    id: 33,
    date: '2025-07-03',
    title: '미국 고용지표',
    description: '6월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '20.6만명 (예상: 19.0만명)',
    importance: 'high'
  },
  {
    id: 34,
    date: '2025-07-10',
    title: '미국 소비자물가지수(CPI)',
    description: '6월 CPI 발표',
    time: '21:30 KST',
    result: '3.0% (예상: 3.1%)',
    importance: 'high'
  },
  {
    id: 35,
    date: '2025-07-11',
    title: '미국 생산자물가지수(PPI)',
    description: '6월 PPI 발표',
    time: '21:30 KST',
    result: '1.5% (예상: 1.6%)',
    importance: 'high'
  },
  {
    id: 36,
    date: '2025-07-16',
    title: '연준 의사록 발표',
    description: '6월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    result: '금리 인하 가능성 증가',
    importance: 'medium'
  },
  {
    id: 37,
    date: '2025-07-30',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    result: '기준금리 5.25-5.50% 유지',
    importance: 'high'
  },
  // 2025년 8월 (현재 달)
  {
    id: 38,
    date: '2025-08-01',
    title: '미국 제조업 구매관리자지수(PMI)',
    description: '7월 ISM 제조업 PMI 발표',
    time: '23:00 KST',
    result: '50.3 (예상: 49.8)',
    importance: 'medium'
  },
  {
    id: 39,
    date: '2025-08-06',
    title: '미국 고용지표',
    description: '7월 비농업 고용지표 발표',
    time: '21:30 KST',
    result: '19.4만명 (예상: 18.5만명)',
    importance: 'high'
  },
  {
    id: 40,
    date: '2025-08-13',
    title: '미국 소비자물가지수(CPI)',
    description: '7월 CPI 발표',
    time: '21:30 KST',
    result: '3.2% (예상: 3.3%)',
    importance: 'high'
  },
  {
    id: 41,
    date: '2025-08-14',
    title: '미국 생산자물가지수(PPI)',
    description: '7월 PPI 발표',
    time: '21:30 KST',
    result: '1.3% (예상: 1.4%)',
    importance: 'high'
  },
  // 2025년 8월 (예정)
  {
    id: 42,
    date: '2025-08-20',
    title: '미국 소비자물가지수(CPI)',
    description: '7월 CPI 발표 - 인플레이션 추이 확인',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 43,
    date: '2025-08-21',
    title: '미국 생산자물가지수(PPI)',
    description: '7월 PPI 발표 - 생산자 물가 동향',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 44,
    date: '2025-08-22',
    title: '연준 의사록 발표',
    description: '7월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    importance: 'high'
  },
  {
    id: 45,
    date: '2025-08-25',
    title: '미국 고용지표',
    description: '7월 비농업 고용지표 발표',
    time: '21:30 KST',
    importance: 'medium'
  },
  {
    id: 46,
    date: '2025-08-28',
    title: '유럽 중앙은행 회의',
    description: 'ECB 통화정책 회의 및 금리 결정',
    time: '21:45 KST',
    importance: 'high'
  },
  // 2025년 9월 (예정)
  {
    id: 47,
    date: '2025-09-02',
    title: '미국 제조업 구매관리자지수(PMI)',
    description: '8월 ISM 제조업 PMI 발표',
    time: '23:00 KST',
    importance: 'medium'
  },
  {
    id: 48,
    date: '2025-09-05',
    title: '미국 고용지표',
    description: '8월 비농업 고용지표 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 49,
    date: '2025-09-10',
    title: '미국 소비자물가지수(CPI)',
    description: '8월 CPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 50,
    date: '2025-09-11',
    title: '미국 생산자물가지수(PPI)',
    description: '8월 PPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 51,
    date: '2025-09-17',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    importance: 'high'
  },
  {
    id: 52,
    date: '2025-09-25',
    title: '미국 GDP 발표',
    description: '2분기 GDP 성장률 최종 발표',
    time: '21:30 KST',
    importance: 'medium'
  },
  // 2025년 10월 (예정)
  {
    id: 53,
    date: '2025-10-03',
    title: '미국 고용지표',
    description: '9월 비농업 고용지표 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 54,
    date: '2025-10-10',
    title: '미국 소비자물가지수(CPI)',
    description: '9월 CPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 55,
    date: '2025-10-11',
    title: '미국 생산자물가지수(PPI)',
    description: '9월 PPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 56,
    date: '2025-10-15',
    title: '유럽 중앙은행 회의',
    description: 'ECB 통화정책 회의',
    time: '21:45 KST',
    importance: 'high'
  },
  {
    id: 57,
    date: '2025-10-29',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    importance: 'high'
  },
  // 2025년 11월 (예정)
  {
    id: 58,
    date: '2025-11-07',
    title: '미국 고용지표',
    description: '10월 비농업 고용지표 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 59,
    date: '2025-11-12',
    title: '미국 소비자물가지수(CPI)',
    description: '10월 CPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 60,
    date: '2025-11-13',
    title: '미국 생산자물가지수(PPI)',
    description: '10월 PPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 61,
    date: '2025-11-19',
    title: '연준 의사록 발표',
    description: '10월 FOMC 회의 의사록 공개',
    time: '03:00 KST',
    importance: 'medium'
  },
  // 2025년 12월 (예정)
  {
    id: 62,
    date: '2025-12-05',
    title: '미국 고용지표',
    description: '11월 비농업 고용지표 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 63,
    date: '2025-12-10',
    title: '미국 소비자물가지수(CPI)',
    description: '11월 CPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 64,
    date: '2025-12-11',
    title: '미국 생산자물가지수(PPI)',
    description: '11월 PPI 발표',
    time: '21:30 KST',
    importance: 'high'
  },
  {
    id: 65,
    date: '2025-12-17',
    title: '연준 금리 결정',
    description: 'FOMC 금리 결정 및 기자회견',
    time: '03:00 KST',
    importance: 'high'
  },
  {
    id: 66,
    date: '2025-12-23',
    title: '미국 GDP 발표',
    description: '3분기 GDP 성장률 최종 발표',
    time: '21:30 KST',
    importance: 'medium'
  }
];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalTrades: 1247,
    successRate: 78.5,
    dailyProfit: 1250000,
    monthlyProfit: 8500000,
    currentBalance: 25000000,
  });
  const [holdings, setHoldings] = useState(generateHoldingsData());
  const [totalValue, setTotalValue] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 7, 19)); // 2025년 8월 19일로 설정
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const total = holdings.reduce((sum, holding) => sum + holding.value, 0);
    setTotalValue(total);
  }, [holdings]);

  useEffect(() => {
    // 실시간 통계 업데이트 시뮬레이션
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalTrades: prev.totalTrades + Math.floor(Math.random() * 3),
        successRate: Math.max(70, Math.min(85, prev.successRate + (Math.random() - 0.5) * 2)),
        dailyProfit: prev.dailyProfit + Math.floor((Math.random() - 0.5) * 100000),
        monthlyProfit: prev.monthlyProfit + Math.floor((Math.random() - 0.5) * 500000),
        currentBalance: prev.currentBalance + Math.floor((Math.random() - 0.5) * 200000),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return economicEvents.filter(event => event.date === dateStr);
  };

  const hasEventOnDate = (date: Date) => {
    return getEventsForDate(date).length > 0;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date(2025, 7, 19); // 2025년 8월 19일로 설정
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();

    const days = [];
    
    // 이전 달의 날짜들
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), daysInPrevMonth - i);
      days.push(
        <DayCell key={`prev-${i}`} isCurrentMonth={false}>
          {daysInPrevMonth - i}
        </DayCell>
      );
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = isCurrentMonth && day === today.getDate();
      const hasEvent = hasEventOnDate(date);
      
      days.push(
        <DayCell 
          key={day} 
          isCurrentMonth={true}
          isToday={isToday}
          hasEvent={hasEvent}
          onClick={() => {
            setSelectedDate(date);
            console.log('Clicked date:', date, 'Has event:', hasEvent); // 디버깅용
          }}
        >
          {day}
          {hasEvent && <EventDot />}
        </DayCell>
      );
    }

    // 다음 달의 날짜들
    const remainingDays = 42 - days.length; // 6주 고정
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <DayCell key={`next-${day}`} isCurrentMonth={false}>
          {day}
        </DayCell>
      );
    }

    return days;
  };

  const getSelectedDateEvents = () => {
    if (!selectedDate) return [];
    const events = getEventsForDate(selectedDate);
    console.log('Selected date:', selectedDate, 'Events:', events); // 디버깅용
    return events;
  };

  return (
    <DashboardContainer>
      <Header>
        <Title>자동매매 대시보드</Title>
        <Subtitle>AI 기반 자동매매 시스템의 전체 현황과 성과를 한눈에 확인하세요</Subtitle>
      </Header>

      <InfoBox>
        <InfoTitle>
          <FiZap size={16} />
          🚀 자동매매 시스템 활성화
        </InfoTitle>
        <InfoText>
          웹사이트 설정에서 입력한 API 키와 거래 설정이 자동매매 봇에 자동으로 적용됩니다. 
          설정을 변경하면 봇이 즉시 새로운 설정을 반영합니다.
        </InfoText>
      </InfoBox>

      <MainContent>
        <LeftSection>
          <StatsGrid>
            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <StatHeader>
                <StatTitle>현재 보유 현금</StatTitle>
                <StatIcon variant="success">
                  <FiDollarSign size={20} />
                </StatIcon>
              </StatHeader>
              <StatValue>{stats.currentBalance.toLocaleString()}</StatValue>
              <StatChange isPositive={stats.currentBalance > 0}>
                <FiTrendingUp size={14} />
                +{stats.currentBalance.toLocaleString()} 어제 대비
              </StatChange>
            </StatCard>

            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <StatHeader>
                <StatTitle>현재 사용 중인 금액</StatTitle>
                <StatIcon variant="info">
                  <FiDollarSign size={20} />
                </StatIcon>
              </StatHeader>
              <StatValue>{totalValue.toLocaleString()}</StatValue>
              <StatChange isPositive={true}>
                <FiTrendingUp size={14} />
                +{Math.floor(totalValue * 0.02).toLocaleString()} 이번 주
              </StatChange>
            </StatCard>

            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <StatHeader>
                <StatTitle>AI 매매 성공률</StatTitle>
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
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <StatHeader>
                <StatTitle>일일 수익</StatTitle>
                <StatIcon variant="success">
                  <FiDollarSign size={20} />
                </StatIcon>
              </StatHeader>
              <StatValue>{stats.dailyProfit.toLocaleString()}</StatValue>
              <StatChange isPositive={stats.dailyProfit > 0}>
                <FiTrendingUp size={14} />
                +{stats.dailyProfit.toLocaleString()} 어제 대비
              </StatChange>
            </StatCard>

            <StatCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <StatHeader>
                <StatTitle>월간 수익</StatTitle>
                <StatIcon variant="success">
                  <FiBarChart size={20} />
                </StatIcon>
              </StatHeader>
              <StatValue>{stats.monthlyProfit.toLocaleString()}</StatValue>
              <StatChange isPositive={stats.monthlyProfit > 0}>
                <FiTrendingUp size={14} />
                +{stats.monthlyProfit.toLocaleString()} 월간
              </StatChange>
            </StatCard>
          </StatsGrid>

          <HoldingsSection>
            <SectionTitle>
              <FiPieChart size={20} />
              보유 자산 현황
            </SectionTitle>
            <HoldingsTable>
              <Table>
                <thead>
                  <tr>
                    <Th>심볼</Th>
                    <Th>수량</Th>
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
          </HoldingsSection>
        </LeftSection>

        <RightSection>
          <CalendarCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CalendarHeader>
              <CalendarTitle>
                <FiCalendar size={18} />
                경제지표 캘린더
              </CalendarTitle>
              <CalendarNav>
                <NavButton onClick={getPreviousMonth}>
                  &lt;
                </NavButton>
                <CurrentMonth>
                  {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </CurrentMonth>
                <NavButton onClick={getNextMonth}>
                  &gt;
                </NavButton>
              </CalendarNav>
            </CalendarHeader>

            <CalendarGrid>
              <DayHeader>일</DayHeader>
              <DayHeader>월</DayHeader>
              <DayHeader>화</DayHeader>
              <DayHeader>수</DayHeader>
              <DayHeader>목</DayHeader>
              <DayHeader>금</DayHeader>
              <DayHeader>토</DayHeader>
              {renderCalendar()}
            </CalendarGrid>

            {selectedDate && (
              <EventList>
                <div style={{ 
                  color: '#ed8936', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FiAlertCircle size={14} />
                  {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                </div>
                {getSelectedDateEvents().length > 0 ? (
                  getSelectedDateEvents().map(event => (
                    <EventItem key={event.id}>
                      <EventDate>{event.date} {event.time}</EventDate>
                      <EventTitle>{event.title}</EventTitle>
                      <EventDescription>{event.description}</EventDescription>
                      {event.result && (
                        <div style={{ 
                          color: '#38a169', 
                          fontSize: '13px', 
                          fontWeight: '600',
                          marginTop: '4px',
                          padding: '4px 8px',
                          backgroundColor: '#f0fff4',
                          borderRadius: '4px',
                          border: '1px solid #c6f6d5'
                        }}>
                          📊 결과: {event.result}
                        </div>
                      )}
                    </EventItem>
                  ))
                ) : (
                  <div style={{ 
                    color: '#a0aec0', 
                    fontSize: '14px', 
                    textAlign: 'center',
                    padding: '20px'
                  }}>
                    이 날에는 경제지표 발표가 없습니다.
                  </div>
                )}
              </EventList>
            )}
          </CalendarCard>
        </RightSection>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;

