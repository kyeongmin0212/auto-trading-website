import React, { useState } from 'react';
import styled from 'styled-components';
import { FiKey, FiGlobe, FiCheckCircle, FiAlertCircle, FiPlay, FiStopCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  margin-bottom: 1rem;
`;

const Title = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'success' | 'danger' }>`
  background: ${props => {
    switch (props.variant) {
      case 'success': return '#28a745';
      case 'danger': return '#dc3545';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusIndicator = styled.div<{ isConnected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  background: ${props => props.isConnected ? '#d4edda' : '#f8d7da'};
  color: ${props => props.isConnected ? '#155724' : '#721c24'};
  border: 1px solid ${props => props.isConnected ? '#c3e6cb' : '#f5c6cb'};
  margin-bottom: 1rem;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

interface KisApiConfig {
  appKey: string;
  appSecret: string;
  accountNumber: string;
  accountCode: string;
  exchange: string;
  isConnected: boolean;
  lastConnection: string | null;
}

interface KisApiSetupProps {
  config: KisApiConfig;
  onConfigChange: (config: KisApiConfig) => void;
}

const KIS_EXCHANGES = [
  { value: 'NASD', label: 'NASDAQ (나스닥)' },
  { value: 'NYSE', label: 'NYSE (뉴욕증권거래소)' },
  { value: 'AMEX', label: 'AMEX (아메리칸증권거래소)' },
  { value: 'LSE', label: 'LSE (런던증권거래소)' },
  { value: 'TSE', label: 'TSE (도쿄증권거래소)' },
  { value: 'HKEX', label: 'HKEX (홍콩증권거래소)' },
  { value: 'SSE', label: 'SSE (상해증권거래소)' },
  { value: 'SZSE', label: 'SZSE (심천증권거래소)' }
];

const KisApiSetup: React.FC<KisApiSetupProps> = ({ config, onConfigChange }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const updateConfig = (field: keyof KisApiConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  const testConnection = async () => {
    setIsTesting(true);
    try {
      // 여기서 실제 한국투자증권 API 연결 테스트를 수행
      // 사용자가 제공한 Python 코드와 연동
      const response = await fetch('/api/kis/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appKey: config.appKey,
          appSecret: config.appSecret,
          accountNumber: config.accountNumber,
          accountCode: config.accountCode,
          exchange: config.exchange
        })
      });

      if (response.ok) {
        toast.success('한국투자증권 API 연결이 성공했습니다!');
        updateConfig('isConnected', true);
        updateConfig('lastConnection', new Date().toISOString());
      } else {
        throw new Error('연결 실패');
      }
    } catch (error) {
      toast.error('한국투자증권 API 연결 테스트에 실패했습니다.');
      console.error('KIS API 테스트 오류:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const connectToApi = async () => {
    setIsConnecting(true);
    try {
      // 실제 API 연결 로직
      const response = await fetch('/api/kis/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast.success('한국투자증권 API에 성공적으로 연결되었습니다!');
        updateConfig('isConnected', true);
        updateConfig('lastConnection', new Date().toISOString());
      } else {
        throw new Error('연결 실패');
      }
    } catch (error) {
      toast.error('한국투자증권 API 연결에 실패했습니다.');
      console.error('KIS API 연결 오류:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromApi = async () => {
    try {
      const response = await fetch('/api/kis/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        toast.success('한국투자증권 API 연결이 해제되었습니다.');
        updateConfig('isConnected', false);
        updateConfig('lastConnection', null);
      }
    } catch (error) {
      toast.error('API 연결 해제에 실패했습니다.');
      console.error('KIS API 해제 오류:', error);
    }
  };

  return (
    <Container>
      <Title>
        <FiGlobe />
        한국투자증권 해외주식 API 설정
      </Title>

      <InfoText>
        한국투자증권 해외주식 API를 연결하여 실시간 시세 조회, 주문 전송, 포트폴리오 관리 등의 기능을 사용할 수 있습니다.
        <br />
        <strong>주의:</strong> API 키는 안전하게 보관되며, 서버에만 전송됩니다.
      </InfoText>

      <StatusIndicator isConnected={config.isConnected}>
        {config.isConnected ? <FiCheckCircle /> : <FiAlertCircle />}
        <span>
          {config.isConnected 
            ? `연결됨 - 마지막 연결: ${config.lastConnection ? new Date(config.lastConnection).toLocaleString('ko-KR') : '알 수 없음'}`
            : '연결되지 않음'
          }
        </span>
      </StatusIndicator>

      <FormGroup>
        <Label>앱 키 (App Key)</Label>
        <Input
          type="password"
          value={config.appKey}
          onChange={(e) => updateConfig('appKey', e.target.value)}
          placeholder="한국투자증권 앱 키를 입력하세요"
        />
      </FormGroup>

      <FormGroup>
        <Label>앱 시크릿 (App Secret)</Label>
        <Input
          type="password"
          value={config.appSecret}
          onChange={(e) => updateConfig('appSecret', e.target.value)}
          placeholder="한국투자증권 앱 시크릿을 입력하세요"
        />
      </FormGroup>

      <FormGroup>
        <Label>계좌번호</Label>
        <Input
          value={config.accountNumber}
          onChange={(e) => updateConfig('accountNumber', e.target.value)}
          placeholder="해외주식 계좌번호를 입력하세요"
        />
      </FormGroup>

      <FormGroup>
        <Label>계좌 코드</Label>
        <Input
          value={config.accountCode}
          onChange={(e) => updateConfig('accountCode', e.target.value)}
          placeholder="계좌 코드를 입력하세요 (예: 01)"
        />
      </FormGroup>

      <FormGroup>
        <Label>주요 거래소</Label>
        <Select
          value={config.exchange}
          onChange={(e) => updateConfig('exchange', e.target.value)}
        >
          <option value="">거래소를 선택하세요</option>
          {KIS_EXCHANGES.map(exchange => (
            <option key={exchange.value} value={exchange.value}>
              {exchange.label}
            </option>
          ))}
        </Select>
      </FormGroup>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button
          onClick={testConnection}
          disabled={isTesting || !config.appKey || !config.appSecret}
        >
          {isTesting ? '테스트 중...' : '연결 테스트'}
        </Button>

        {!config.isConnected ? (
          <Button
            variant="success"
            onClick={connectToApi}
            disabled={isConnecting || !config.appKey || !config.appSecret}
          >
            {isConnecting ? '연결 중...' : <><FiPlay /> API 연결</>}
          </Button>
        ) : (
                                <Button
                        variant="danger"
                        onClick={disconnectFromApi}
                      >
                        <FiStopCircle /> 연결 해제
                      </Button>
        )}
      </div>
    </Container>
  );
};

export default KisApiSetup;
