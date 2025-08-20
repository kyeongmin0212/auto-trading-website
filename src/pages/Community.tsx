import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiUsers, FiMessageCircle, FiTrendingUp, FiPlus, FiX, FiHeart, FiMessageSquare, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../components/Auth';
import { postService, chatService, userService, Post, ChatMessage, User } from '../firebase/services';

const CommunityContainer = styled.div`
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

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
  height: calc(100vh - 200px);
`;

const ChatSection = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #2d3748;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ChatTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div<{ isOwn?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  max-width: 70%;
  align-self: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div<{ isOwn?: boolean }>`
  background: ${props => props.isOwn ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(45, 55, 72, 0.8)'};
  border: 1px solid ${props => props.isOwn ? '#667eea' : '#2d3748'};
  border-radius: 12px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
`;

const MessageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
  color: #a0aec0;
`;

const Username = styled.span`
  font-weight: 600;
  color: #667eea;
`;

const Timestamp = styled.span`
  color: #718096;
`;

const ChatInput = styled.div`
  padding: 20px;
  border-top: 1px solid #2d3748;
  display: flex;
  gap: 10px;
`;

const Input = styled.input`
  flex: 1;
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  
  &::placeholder {
    color: #718096;
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SendButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
`;

const Sidebar = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 20px;
`;

const SidebarTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OnlineUsers = styled.div`
  margin-bottom: 30px;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #2d3748;
  
  &:last-child {
    border-bottom: none;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 600;
  font-size: 12px;
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
`;

const UserStatus = styled.div`
  font-size: 12px;
  color: #48bb78;
`;

const TrendingTopics = styled.div`
  margin-bottom: 30px;
`;

const TopicItem = styled.div<{ isClickable?: boolean }>`
  padding: 8px 0;
  border-bottom: 1px solid #2d3748;
  cursor: ${props => props.isClickable ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => props.isClickable ? 'rgba(102, 126, 234, 0.1)' : 'transparent'};
  }
`;

const TopicTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 4px;
`;

const TopicStats = styled.div`
  font-size: 12px;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 14px;
`;

// 샘플 데이터
const sampleUsers = [
  { id: 1, name: '트레이더김', status: '온라인', avatar: '김' },
  { id: 2, name: 'AI매매러', status: '온라인', avatar: 'AI' },
  { id: 3, name: '암호화폐왕', status: '온라인', avatar: '왕' },
  { id: 4, name: '투자고수', status: '온라인', avatar: '고' },
  { id: 5, name: '차트분석가', status: '온라인', avatar: '차' },
];

const samplePosts = [
  {
    id: 1,
    topicId: 1,
    author: '트레이더김',
    title: '비트코인 45,000 달러 돌파 가능성 분석',
    content: '최근 비트코인 차트를 분석한 결과, 45,000 달러 돌파 가능성이 높아 보입니다. RSI 지표가 과매도 상태에서 벗어나고 있고, 볼린저 밴드 하단에서 반등하는 모습을 보이고 있어요.',
    timestamp: '2시간 전',
    likes: 12,
    comments: 8,
    views: 245,
  },
  {
    id: 2,
    topicId: 1,
    author: 'AI매매러',
    title: 'AI 분석 결과: 비트코인 상승 신호 감지',
    content: 'AI 모델이 분석한 결과, 비트코인에 강한 상승 신호가 감지되었습니다. 특히 4시간 차트에서 MACD 골든크로스가 발생했고, 거래량도 증가하는 추세입니다.',
    timestamp: '1시간 전',
    likes: 18,
    comments: 15,
    views: 156,
  },
  {
    id: 3,
    topicId: 2,
    author: '암호화폐왕',
    title: '성공적인 AI 자동매매 전략 공유',
    content: '지난 한 달간 AI 자동매매로 15% 수익을 달성했습니다. 핵심은 이동평균선과 RSI를 조합한 전략이었어요. 자세한 설정값도 공유드립니다.',
    timestamp: '3시간 전',
    likes: 25,
    comments: 22,
    views: 203,
  },
];

const sampleMessages = [
  {
    id: 1,
    username: '트레이더김',
    message: '안녕하세요! 오늘 비트코인 전망 어떻게 보시나요?',
    timestamp: '14:30',
    isOwn: false,
  },
  {
    id: 2,
    username: 'AI매매러',
    message: 'AI 분석 결과로는 상승 전망이 강합니다. 45,000 달러 돌파 가능성 높아요!',
    timestamp: '14:32',
    isOwn: false,
  },
  {
    id: 3,
    username: '나',
    message: '저도 같은 생각입니다. RSI 지표도 과매도 상태에서 벗어나고 있어요.',
    timestamp: '14:33',
    isOwn: true,
  },
  {
    id: 4,
    username: '암호화폐왕',
    message: '하지만 4시간 차트에서 저항선이 있어서 주의가 필요할 것 같습니다.',
    timestamp: '14:35',
    isOwn: false,
  },
];

// 모달 스타일
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled(motion.div)`
  background: rgba(26, 31, 46, 0.95);
  border: 1px solid #2d3748;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  backdrop-filter: blur(10px);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  
  &:hover {
    color: #ffffff;
  }
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
`;

const FormInput = styled.input`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  
  &::placeholder {
    color: #718096;
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FormTextarea = styled.textarea`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  
  &::placeholder {
    color: #718096;
  }
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const FormSelect = styled.select`
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const SubmitButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  align-self: flex-end;
`;

const Community: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedTopic] = useState<string | null>(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: '일반' });
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 인기 게시물 계산 (조회수 + 댓글수*2 + 추천수*3)
  const popularPosts = posts
    .map(post => ({
      ...post,
      popularityScore: (post.views || 0) + ((post.comments || 0) * 2) + ((post.likes || 0) * 3)
    }))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 5);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 실시간 채팅 구독
  useEffect(() => {
    if (user) {
      const unsubscribe = chatService.subscribeToMessages((messages) => {
        setMessages(messages);
        setLoading(false);
      });

      // 사용자 온라인 상태 업데이트
      userService.updateUserStatus(user.uid, true);

      // 페이지 떠날 때 오프라인으로 변경
      return () => {
        userService.updateUserStatus(user.uid, false);
        unsubscribe();
      };
    }
  }, [user]);

  // 온라인 사용자 구독
  useEffect(() => {
    if (user) {
      const unsubscribe = userService.subscribeToOnlineUsers((users) => {
        setOnlineUsers(users);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // 게시물 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const postsData = await postService.getPosts(undefined, 20);
        setPosts(postsData);
      } catch (error) {
        console.error('게시물 로드 오류:', error);
        toast.error('게시물을 불러오는데 실패했습니다.');
      }
    };

    loadPosts();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (newMessage.trim()) {
      try {
        await chatService.sendMessage({
          author: user.displayName || user.email || '익명',
          authorId: user.uid,
          content: newMessage.trim(),
        });
        
        setNewMessage('');
        toast.success('메시지가 전송되었습니다!');
      } catch (error) {
        console.error('메시지 전송 오류:', error);
        toast.error('메시지 전송에 실패했습니다.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTopicClick = (postId: string) => {
    navigate('/board', { 
      state: { 
        selectedCategory: '전체',
        searchTerm: '',
        postId: postId
      } 
    });
  };

  const handleNewPost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (newPost.title.trim() && newPost.content.trim()) {
      try {
        await postService.createPost({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          category: newPost.category,
          author: user.displayName || user.email || '익명',
          authorId: user.uid,
        });
        
        setNewPost({ title: '', content: '', category: '일반' });
      setShowNewPostModal(false);
      toast.success('게시물이 작성되었습니다!');
        
        // 게시물 목록 새로고침
        const postsData = await postService.getPosts(undefined, 20);
        setPosts(postsData);
      } catch (error) {
        console.error('게시물 작성 오류:', error);
        toast.error('게시물 작성에 실패했습니다.');
      }
    }
  };

  const filteredPosts = selectedTopic 
    ? posts.filter(post => post.id?.toString() === selectedTopic)
    : posts;

  const selectedTopicTitle = selectedTopic 
    ? posts.find(post => post.id?.toString() === selectedTopic)?.title
    : '전체 게시물';

  // 날짜 포맷팅 함수
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '방금 전';
    
    const now = new Date();
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    return `${Math.floor(diffInMinutes / 1440)}일 전`;
  };

  // 로그인 체크
  if (!user) {
    return (
      <CommunityContainer>
        <Header>
          <Title>커뮤니티</Title>
          <Subtitle>다른 트레이더들과 실시간으로 정보를 공유하고 의견을 나누세요</Subtitle>
        </Header>
        
        <InfoBox>
          <InfoTitle>
            <FiMessageCircle size={16} />
            🔐 로그인이 필요합니다
          </InfoTitle>
          <InfoText>
            커뮤니티 기능을 사용하려면 먼저 로그인해주세요.
            로그인 후 실시간 채팅과 게시물 작성이 가능합니다.
          </InfoText>
        </InfoBox>
      </CommunityContainer>
    );
  }

  return (
    <CommunityContainer>
      <Header>
        <Title>커뮤니티</Title>
        <Subtitle>다른 트레이더들과 실시간으로 정보를 공유하고 의견을 나누세요</Subtitle>
      </Header>

      <InfoBox>
        <InfoTitle>
          <FiMessageCircle size={16} />
          💬 실시간 채팅 & 게시물 활성화
        </InfoTitle>
        <InfoText>
          커뮤니티에서 다른 트레이더들과 실시간으로 대화하고, 
          투자 전략과 시장 분석을 게시물로 공유할 수 있습니다.
          Firebase 실시간 데이터베이스와 연동되어 있습니다!
        </InfoText>
      </InfoBox>

      <Content>
          <ChatSection>
            <ChatHeader>
              <FiMessageCircle size={20} />
              <ChatTitle>실시간 채팅</ChatTitle>
            </ChatHeader>
            
            <ChatMessages>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>
                채팅을 불러오는 중...
              </div>
            ) : (
              messages.map((msg) => (
                <Message key={msg.id} isOwn={msg.authorId === user?.uid}>
                  <MessageInfo>
                    <Username>{msg.author}</Username>
                    <Timestamp>{formatDate(msg.createdAt)}</Timestamp>
                  </MessageInfo>
                  <MessageBubble isOwn={msg.authorId === user?.uid}>
                    {msg.content}
                  </MessageBubble>
                </Message>
              ))
            )}
              <div ref={messagesEndRef} />
            </ChatMessages>
            
            <ChatInput>
              <Input
                type="text"
                placeholder="메시지를 입력하세요..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <SendButton
                onClick={handleSendMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiSend size={16} />
                전송
              </SendButton>
            </ChatInput>
          </ChatSection>

        <Sidebar>
          <OnlineUsers>
            <SidebarTitle>
              <FiUsers size={16} />
              온라인 사용자 ({onlineUsers.length})
            </SidebarTitle>
            {onlineUsers.map((user) => (
              <UserItem key={user.id}>
                <UserAvatar>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</UserAvatar>
                <UserInfo>
                  <UserName>{user.displayName || user.email}</UserName>
                  <UserStatus>온라인</UserStatus>
                </UserInfo>
              </UserItem>
            ))}
          </OnlineUsers>

          <TrendingTopics>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
            <SidebarTitle>
              <FiTrendingUp size={16} />
              인기 게시물
            </SidebarTitle>
              <motion.button
                onClick={() => setShowNewPostModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiPlus size={12} />
                새 게시물
              </motion.button>
            </div>
            {popularPosts.map((post, index) => (
              <TopicItem 
                key={post.id}
                isClickable={true}
                onClick={() => handleTopicClick(post.id!)}
                style={{ 
                  background: selectedTopic === post.id?.toString() ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                  borderLeft: selectedTopic === post.id?.toString() ? '3px solid #667eea' : 'none',
                  paddingLeft: selectedTopic === post.id?.toString() ? '12px' : '8px'
                }}
              >
                <TopicTitle>
                  <span style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginRight: '8px'
                  }}>
                    {index + 1}
                  </span>
                  {post.title}
                </TopicTitle>
                <TopicStats>
                  <span>👁️ {post.views || 0}</span>
                  <span>💬 {post.comments || 0}</span>
                  <span>👍 {post.likes || 0}</span>
                </TopicStats>
              </TopicItem>
            ))}
          </TrendingTopics>
        </Sidebar>
      </Content>

      <AnimatePresence>
        {showNewPostModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewPostModal(false)}
          >
            <Modal
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>새 게시물 작성</ModalTitle>
                <CloseButton onClick={() => setShowNewPostModal(false)}>
                  <FiX size={20} />
                </CloseButton>
              </ModalHeader>
              
              <ModalForm onSubmit={handleNewPost}>
                <FormGroup>
                  <FormLabel>카테고리</FormLabel>
                  <FormSelect
                    value={newPost.category}
                    onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="일반">일반</option>
                    <option value="질문">질문</option>
                    <option value="정보">정보</option>
                    <option value="전략">전략</option>
                  </FormSelect>
                </FormGroup>
                
                <FormGroup>
                  <FormLabel>제목</FormLabel>
                  <FormInput
                    type="text"
                    placeholder="게시물 제목을 입력하세요"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel>내용</FormLabel>
                  <FormTextarea
                    placeholder="게시물 내용을 입력하세요"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    required
                  />
                </FormGroup>
                
                <SubmitButton
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  게시물 작성
                </SubmitButton>
              </ModalForm>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </CommunityContainer>
  );
};

export default Community;
