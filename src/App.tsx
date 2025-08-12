import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TradingChart from './pages/TradingChart';
import AutoTrading from './pages/AutoTrading';
import Portfolio from './pages/Portfolio';
import Settings from './pages/Settings';
import StrategyBuilder from './pages/StrategyBuilder';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

function App() {
  return (
    <Router>
      <AppContainer>
        <Sidebar />
        <MainContent>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chart" element={<TradingChart />} />
            <Route path="/auto-trading" element={<AutoTrading />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/strategy-builder" element={<StrategyBuilder />} />
          </Routes>
        </MainContent>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2d3748',
              color: '#ffffff',
              border: '1px solid #4a5568',
            },
          }}
        />
      </AppContainer>
    </Router>
  );
}

export default App;
