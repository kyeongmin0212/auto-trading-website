import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiCopy, FiCheck, FiExternalLink, FiHash, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

const SetupContainer = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

const SetupTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StepContainer = styled.div`
  margin-bottom: 1rem;
`;

const StepTitle = styled.h5`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.5rem;
`;

const StepDescription = styled.p`
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  line-height: 1.4;
`;

const CodeBlock = styled.div`
  background: #e9ecef;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.75rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #495057;
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  
  &:hover {
    background: #dee2e6;
    color: #495057;
  }
`;

const LinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: #007bff;
  text-decoration: none;
  font-size: 0.875rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const TestButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  margin-top: 0.5rem;
  
  &:hover {
    background: #218838;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const ChannelTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  background: ${props => props.isActive ? '#007bff' : '#e9ecef'};
  color: ${props => props.isActive ? 'white' : '#495057'};
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.isActive ? '#0056b3' : '#dee2e6'};
  }
`;

interface NotificationSetupProps {
  channel: 'discord' | 'slack' | 'line';
  webhookUrl?: string;
  onTestMessage: () => void;
}

const NotificationSetup: React.FC<NotificationSetupProps> = ({ 
  channel, 
  webhookUrl, 
  onTestMessage 
}) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'discord' | 'slack' | 'line'>(channel);

  const copyToClipboard = async (text: string, step: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStep(step);
      toast.success('클립보드에 복사되었습니다!');
      setTimeout(() => setCopiedStep(null), 2000);
    } catch (error) {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleTestMessage = () => {
    if (!webhookUrl) {
      toast.error('Webhook URL을 먼저 설정해주세요.');
      return;
    }
    onTestMessage();
  };

  const renderDiscordSetup = () => (
    <>
      <StepContainer>
        <StepTitle>1단계: Discord 서버에서 Webhook 생성</StepTitle>
        <StepDescription>
          Discord 서버에서 알림을 받을 채널을 선택하고 Webhook을 생성하세요.
        </StepDescription>
        <LinkButton href="https://support.discord.com/hc/ko/articles/228383668" target="_blank" rel="noopener noreferrer">
          <FiExternalLink size={14} />
          Discord Webhook 가이드
        </LinkButton>
      </StepContainer>

      <StepContainer>
        <StepTitle>2단계: Webhook URL 복사</StepTitle>
        <StepDescription>
          생성된 Webhook의 URL을 복사하여 위의 "Discord Webhook URL" 필드에 입력하세요.
        </StepDescription>
        <CodeBlock>
          <span>예시: https://discord.com/api/webhooks/123456789/abcdef...</span>
          <CopyButton onClick={() => copyToClipboard('https://discord.com/api/webhooks/123456789/abcdef...', 2)}>
            {copiedStep === 2 ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </CopyButton>
        </CodeBlock>
      </StepContainer>

      <StepContainer>
        <StepTitle>3단계: 테스트 메시지 전송</StepTitle>
        <StepDescription>
          설정이 완료되면 아래 버튼을 클릭하여 테스트 메시지를 전송해보세요.
        </StepDescription>
        <TestButton onClick={handleTestMessage} disabled={!webhookUrl}>
          Discord 테스트 메시지 전송
        </TestButton>
      </StepContainer>
    </>
  );

  const renderSlackSetup = () => (
    <>
      <StepContainer>
        <StepTitle>1단계: Slack 워크스페이스에서 App 생성</StepTitle>
        <StepDescription>
          Slack 워크스페이스에서 Incoming Webhooks 앱을 추가하세요.
        </StepDescription>
        <LinkButton href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer">
          <FiExternalLink size={14} />
          Slack Webhook 가이드
        </LinkButton>
      </StepContainer>

      <StepContainer>
        <StepTitle>2단계: Webhook URL 생성</StepTitle>
        <StepDescription>
          알림을 받을 채널을 선택하고 Webhook URL을 생성하세요.
        </StepDescription>
        <CodeBlock>
          <span>예시: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX</span>
          <CopyButton onClick={() => copyToClipboard('https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX', 2)}>
            {copiedStep === 2 ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </CopyButton>
        </CodeBlock>
      </StepContainer>

      <StepContainer>
        <StepTitle>3단계: 테스트 메시지 전송</StepTitle>
        <StepDescription>
          설정이 완료되면 아래 버튼을 클릭하여 테스트 메시지를 전송해보세요.
        </StepDescription>
        <TestButton onClick={handleTestMessage} disabled={!webhookUrl}>
          Slack 테스트 메시지 전송
        </TestButton>
      </StepContainer>
    </>
  );

  const renderLineSetup = () => (
    <>
      <StepContainer>
        <StepTitle>1단계: LINE Developers에서 봇 생성</StepTitle>
        <StepDescription>
          LINE Developers Console에서 새로운 Messaging API 채널을 생성하세요.
        </StepDescription>
        <LinkButton href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer">
          <FiExternalLink size={14} />
          LINE Developers Console
        </LinkButton>
      </StepContainer>

      <StepContainer>
        <StepTitle>2단계: Channel Access Token 복사</StepTitle>
        <StepDescription>
          생성된 채널의 Channel Access Token을 복사하여 위의 필드에 입력하세요.
        </StepDescription>
        <CodeBlock>
          <span>예시: 1234567890abcdefghijklmnopqrstuvwxyz</span>
          <CopyButton onClick={() => copyToClipboard('1234567890abcdefghijklmnopqrstuvwxyz', 2)}>
            {copiedStep === 2 ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </CopyButton>
        </CodeBlock>
      </StepContainer>

      <StepContainer>
        <StepTitle>3단계: User ID 확인</StepTitle>
        <StepDescription>
          봇과 대화를 시작한 후, 다음 URL로 접속하여 User ID를 확인하세요:
        </StepDescription>
        <CodeBlock>
          <span>https://api.line.me/v2/bot/profile/[YOUR_USER_ID]</span>
          <CopyButton onClick={() => copyToClipboard('https://api.line.me/v2/bot/profile/[YOUR_USER_ID]', 3)}>
            {copiedStep === 3 ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </CopyButton>
        </CodeBlock>
      </StepContainer>

      <StepContainer>
        <StepTitle>4단계: 테스트 메시지 전송</StepTitle>
        <StepDescription>
          설정이 완료되면 아래 버튼을 클릭하여 테스트 메시지를 전송해보세요.
        </StepDescription>
        <TestButton onClick={handleTestMessage} disabled={!webhookUrl}>
          LINE 테스트 메시지 전송
        </TestButton>
      </StepContainer>
    </>
  );

  return (
    <SetupContainer>
      <SetupTitle>
        <FiMessageCircle />
        {channel === 'discord' && 'Discord 알림 설정 가이드'}
        {channel === 'slack' && 'Slack 알림 설정 가이드'}
        {channel === 'line' && 'LINE 알림 설정 가이드'}
      </SetupTitle>

      <ChannelTabs>
        <TabButton 
          isActive={activeTab === 'discord'} 
          onClick={() => setActiveTab('discord')}
        >
          <FiHash size={14} />
          Discord
        </TabButton>
        <TabButton 
          isActive={activeTab === 'slack'} 
          onClick={() => setActiveTab('slack')}
        >
          <FiUsers size={14} />
          Slack
        </TabButton>
        <TabButton 
          isActive={activeTab === 'line'} 
          onClick={() => setActiveTab('line')}
        >
          <FiMessageCircle size={14} />
          LINE
        </TabButton>
      </ChannelTabs>

      {activeTab === 'discord' && renderDiscordSetup()}
      {activeTab === 'slack' && renderSlackSetup()}
      {activeTab === 'line' && renderLineSetup()}

      <StepContainer>
        <StepTitle>💡 팁</StepTitle>
        <StepDescription>
          {channel === 'discord' && (
            <>
              • Discord 서버 관리자 권한이 필요할 수 있습니다.<br/>
              • Webhook은 해당 채널에만 메시지를 전송합니다.<br/>
              • Webhook URL은 절대 공개하지 마세요.
            </>
          )}
          {channel === 'slack' && (
            <>
              • Slack 워크스페이스 관리자 권한이 필요할 수 있습니다.<br/>
              • Webhook은 지정된 채널에만 메시지를 전송합니다.<br/>
              • Webhook URL은 절대 공개하지 마세요.
            </>
          )}
          {channel === 'line' && (
            <>
              • LINE 봇과 대화를 시작하려면 봇의 QR 코드를 스캔하세요.<br/>
              • Channel Access Token은 절대 공개하지 마세요.<br/>
              • User ID는 개인정보이므로 안전하게 보관하세요.
            </>
          )}
        </StepDescription>
      </StepContainer>
    </SetupContainer>
  );
};

export default NotificationSetup;

