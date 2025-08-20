import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import styled from 'styled-components';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AutoTrading from './pages/AutoTrading';
import Community from './pages/Community';
import Board from './pages/Board';
import StrategyBuilder from './pages/StrategyBuilder';
import MyPage from './pages/MyPage';
import Auth from './components/Auth';
import { AuthProvider, useAuth } from './components/Auth';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        로딩 중...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <AppContainer>
        <Sidebar onLogout={signOut} />
        <MainContent>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/auto-trading" element={<AutoTrading />} />
            <Route path="/strategy-builder" element={<StrategyBuilder />} />
            <Route path="/community" element={<Community />} />
            <Route path="/board" element={<Board />} />
            <Route path="/my-page" element={<MyPage />} />
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
