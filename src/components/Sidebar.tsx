import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiTrendingUp, 
  FiSettings, 
  FiPieChart, 
  FiZap,
  FiCode
} from 'react-icons/fi';

const SidebarContainer = styled.nav`
  width: 250px;
  background: rgba(26, 31, 46, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid #2d3748;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div`
  padding: 0 20px 30px;
  border-bottom: 1px solid #2d3748;
  margin-bottom: 20px;
`;

const LogoText = styled.h1`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavMenu = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin: 0;
`;

const NavLinkStyled = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  color: #a0aec0;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
  }
  
  &.active {
    background: rgba(102, 126, 234, 0.15);
    color: #667eea;
    border-right: 3px solid #667eea;
  }
  
  svg {
    margin-right: 12px;
    font-size: 18px;
  }
`;

const StatusIndicator = styled.div`
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid #2d3748;
`;

const StatusText = styled.div`
  font-size: 14px;
  color: #a0aec0;
  margin-bottom: 8px;
`;

const StatusDot = styled.div<{ isActive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.isActive ? '#48bb78' : '#e53e3e'};
  margin-right: 8px;
  display: inline-block;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #718096;
`;

const menuItems = [
  { path: '/', icon: FiHome, label: '대시보드' },
  { path: '/chart', icon: FiTrendingUp, label: '실시간 차트' },
  { path: '/auto-trading', icon: FiZap, label: '자동매매' },
  { path: '/portfolio', icon: FiPieChart, label: '포트폴리오' },
  { path: '/strategy-builder', icon: FiCode, label: '전략 빌더' },
  { path: '/settings', icon: FiSettings, label: '설정' },
];

const Sidebar: React.FC = () => {
  return (
    <SidebarContainer>
      <Logo>
        <LogoText>자동매매</LogoText>
      </Logo>
      
      <NavMenu>
        {menuItems.map((item) => (
          <NavItem key={item.path}>
            <motion.div
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <NavLinkStyled to={item.path}>
                <item.icon />
                {item.label}
              </NavLinkStyled>
            </motion.div>
          </NavItem>
        ))}
      </NavMenu>
      
      <StatusIndicator>
        <StatusText>시스템 상태</StatusText>
        <StatusRow>
          <StatusDot isActive={true} />
          자동매매 활성화
        </StatusRow>
        <StatusRow>
          <StatusDot isActive={true} />
          실시간 데이터 연결됨
        </StatusRow>
      </StatusIndicator>
    </SidebarContainer>
  );
};

export default Sidebar;
