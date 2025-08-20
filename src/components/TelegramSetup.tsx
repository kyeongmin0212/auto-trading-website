import React, { useState } from 'react';
import styled from 'styled-components';
import { FiMessageCircle, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';
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

interface TelegramSetupProps {
  botToken: string;
  chatId: string;
  onTestMessage: () => void;
}

const TelegramSetup: React.FC<TelegramSetupProps> = ({ botToken, chatId, onTestMessage }) => {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

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
    if (!botToken || !chatId) {
      toast.error('봇 토큰과 채팅 ID를 먼저 설정해주세요.');
      return;
    }
    onTestMessage();
  };

  return (
    <SetupContainer>
      <SetupTitle>
        <FiMessageCircle />
        텔레그램 봇 설정 가이드
      </SetupTitle>

      <StepContainer>
        <StepTitle>1단계: 봇 생성</StepTitle>
        <StepDescription>
          텔레그램에서 @BotFather를 찾아 새 봇을 생성하세요.
        </StepDescription>
        <LinkButton href="https://t.me/botfather" target="_blank" rel="noopener noreferrer">
          <FiExternalLink size={14} />
          @BotFather로 이동
        </LinkButton>
      </StepContainer>

      <StepContainer>
        <StepTitle>2단계: 봇 토큰 복사</StepTitle>
        <StepDescription>
          BotFather가 제공한 봇 토큰을 복사하여 위의 "텔레그램 봇 토큰" 필드에 입력하세요.
        </StepDescription>
        <CodeBlock>
          <span>예시: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz</span>
          <CopyButton onClick={() => copyToClipboard('1234567890:ABCdefGHIjklMNOpqrsTUVwxyz', 2)}>
            {copiedStep === 2 ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </CopyButton>
        </CodeBlock>
      </StepContainer>

      <StepContainer>
        <StepTitle>3단계: 채팅 ID 확인</StepTitle>
        <StepDescription>
          봇과 대화를 시작한 후, 다음 URL로 접속하여 채팅 ID를 확인하세요:
        </StepDescription>
        <CodeBlock>
          <span>https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates</span>
          <CopyButton onClick={() => copyToClipboard('https://api.telegram.org/bot[YOUR_BOT_TOKEN]/getUpdates', 3)}>
            {copiedStep === 3 ? <FiCheck size={14} /> : <FiCopy size={14} />}
          </CopyButton>
        </CodeBlock>
        <StepDescription>
          응답에서 "chat" → "id" 값을 찾아 "텔레그램 채팅 ID" 필드에 입력하세요.
        </StepDescription>
      </StepContainer>

      <StepContainer>
        <StepTitle>4단계: 테스트 메시지 전송</StepTitle>
        <StepDescription>
          설정이 완료되면 아래 버튼을 클릭하여 테스트 메시지를 전송해보세요.
        </StepDescription>
        <TestButton onClick={handleTestMessage} disabled={!botToken || !chatId}>
          테스트 메시지 전송
        </TestButton>
      </StepContainer>

      <StepContainer>
        <StepTitle>💡 팁</StepTitle>
        <StepDescription>
          • 봇과 대화를 시작하려면 봇의 사용자명을 검색하고 /start 명령어를 입력하세요.<br/>
          • 개인 채팅의 경우 채팅 ID는 보통 음수입니다.<br/>
          • 그룹 채팅의 경우 채팅 ID는 양수입니다.<br/>
          • 봇이 그룹에 추가된 경우 그룹 관리자 권한이 필요할 수 있습니다.
        </StepDescription>
      </StepContainer>
    </SetupContainer>
  );
};

export default TelegramSetup;
