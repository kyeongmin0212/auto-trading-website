import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiPlus, FiX, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../components/Auth';
import { 
  postService, 
  commentService,
  Post, 
  Comment 
} from '../firebase/services';

const BoardContainer = styled.div`
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

const Controls = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchBox = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #2d3748;
  border-radius: 8px;
  padding: 12px 16px 12px 40px;
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

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
`;

const CategoryFilter = styled.select`
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
  
  option {
    background: #1a202c;
    color: #ffffff;
  }
`;

const NewPostButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
`;

const BoardContent = styled.div`
  background: rgba(26, 31, 46, 0.8);
  border: 1px solid #2d3748;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  overflow: hidden;
`;

const BoardHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px 80px 80px;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(45, 55, 72, 0.5);
  border-bottom: 1px solid #2d3748;
  font-weight: 600;
  color: #a0aec0;
  font-size: 14px;
`;

const BoardList = styled.div`
  max-height: 600px;
  overflow-y: auto;
`;

const PostRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px 80px 80px;
  gap: 20px;
  padding: 16px 20px;
  border-bottom: 1px solid #2d3748;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const PostNumber = styled.div`
  color: #718096;
  font-size: 14px;
  text-align: center;
`;

const PostTitle = styled.div`
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PostCategory = styled.span<{ category: string }>`
  background: ${props => {
    switch (props.category) {
      case '공지': return 'rgba(229, 62, 62, 0.2)';
      case '일반': return 'rgba(102, 126, 234, 0.2)';
      case '질문': return 'rgba(237, 137, 54, 0.2)';
      case '정보': return 'rgba(72, 187, 120, 0.2)';
      default: return 'rgba(102, 126, 234, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.category) {
      case '공지': return '#e53e3e';
      case '일반': return '#667eea';
      case '질문': return '#ed8936';
      case '정보': return '#48bb78';
      default: return '#667eea';
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const PostAuthor = styled.div`
  color: #a0aec0;
  font-size: 14px;
  text-align: center;
`;

const PostDate = styled.div`
  color: #718096;
  font-size: 14px;
  text-align: center;
`;

const PostStats = styled.div`
  color: #718096;
  font-size: 14px;
  text-align: center;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #2d3748;
`;

const PageButton = styled.button<{ isActive?: boolean }>`
  background: ${props => props.isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(45, 55, 72, 0.8)'};
  border: 1px solid ${props => props.isActive ? '#667eea' : '#2d3748'};
  border-radius: 6px;
  padding: 8px 12px;
  color: #ffffff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
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
  
  option {
    background: #1a202c;
    color: #ffffff;
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

// 샘플 데이터
const categories = ['전체', '공지', '일반', '질문', '정보'];

const samplePosts = [
  {
    id: 1,
    number: 1,
    title: '비트코인 45,000 달러 돌파 가능성 분석',
    category: '정보',
    author: '트레이더김',
    date: '2024-01-15',
    views: 245,
    likes: 12,
    content: `안녕하세요! 오늘 비트코인 차트를 분석한 결과를 공유드립니다.

최근 비트코인 차트를 분석한 결과, 45,000 달러 돌파 가능성이 높아 보입니다. 

주요 분석 포인트:
• RSI 지표가 과매도 상태에서 벗어나고 있음
• 볼린저 밴드 하단에서 반등하는 모습을 보임
• 4시간 차트에서 MACD 골든크로스 발생
• 거래량이 점진적으로 증가하는 추세

투자 시 주의사항:
- 42,500 달러 지지선 확인 필요
- 47,000 달러 저항선 돌파 시 추가 상승 가능
- 리스크 관리 철저히 하시기 바랍니다

개인적인 의견이므로 투자 결정은 본인의 판단에 따라 하시기 바랍니다.`
  },
  {
    id: 2,
    number: 2,
    title: 'AI 분석 결과: 비트코인 상승 신호 감지',
    category: '정보',
    author: 'AI매매러',
    date: '2024-01-14',
    views: 156,
    likes: 18,
    content: `AI 모델이 분석한 결과를 공유드립니다.

AI 모델이 분석한 결과, 비트코인에 강한 상승 신호가 감지되었습니다.

AI 분석 결과:
✅ 상승 확률: 78%
✅ 목표가: 48,500 달러
✅ 추천 진입가: 43,200 달러

특히 4시간 차트에서 MACD 골든크로스가 발생했고, 거래량도 증가하는 추세입니다.

AI 모델이 학습한 패턴과 현재 시장 상황이 매우 유사한 것으로 나타났습니다.

주의: AI 분석은 참고용이며, 실제 투자는 본인의 판단에 따라 결정하세요.`
  },
  {
    id: 3,
    number: 3,
    title: '성공적인 AI 자동매매 전략 공유',
    category: '일반',
    author: '암호화폐왕',
    date: '2024-01-13',
    views: 203,
    likes: 25,
    content: `지난 한 달간 AI 자동매매로 15% 수익을 달성했습니다!

성공 요인을 분석해보니 다음과 같습니다:

📈 전략 구성:
- 이동평균선(MA20, MA50) 크로스오버
- RSI 과매수/과매도 신호
- 볼린저 밴드 활용
- 거래량 가중 이동평균

⚙️ 설정값:
- RSI 상단: 70, 하단: 30
- 볼린저 밴드: 20일, 2표준편차
- 손절: 3%, 익절: 8%

💡 핵심 포인트:
1. 리스크 관리가 가장 중요
2. 감정적 거래 금지
3. 지속적인 백테스팅
4. 시장 상황에 따른 파라미터 조정

질문 있으시면 댓글로 남겨주세요!`
  },
  {
    id: 4,
    number: 4,
    title: '이더리움 2.0 업데이트 완료 소식',
    category: '정보',
    author: '투자고수',
    date: '2024-01-12',
    views: 178,
    likes: 32,
    content: `이더리움 2.0 업데이트가 성공적으로 완료되었습니다! 🎉

주요 업데이트 내용:
🔄 합의 메커니즘: PoW → PoS 전환
⚡ 거래 속도: 초당 15 → 100,000 TPS
💰 가스비: 평균 80% 감소
🌱 환경 친화적: 에너지 소비 99.95% 감소

투자자들에게 미치는 영향:
✅ 장기적 가격 상승 기대
✅ DeFi 생태계 확장 가속화
✅ 기관 투자자들의 관심 증가
✅ 스테이킹 수익률 4-6% 예상

앞으로의 전망:
- Layer 2 솔루션 활성화
- NFT 시장 성장 가속화
- DeFi 프로토콜 혁신

이더리움 홀더분들 축하드립니다! 🚀`
  },
  {
    id: 5,
    number: 5,
    title: '암호화폐 포트폴리오 구성 가이드',
    category: '질문',
    author: '차트분석가',
    date: '2024-01-11',
    views: 134,
    likes: 15,
    content: `초보자를 위한 암호화폐 포트폴리오 구성 방법을 공유합니다.

📊 추천 포트폴리오 비율:
• 비트코인 (BTC): 40%
• 이더리움 (ETH): 30%
• 기타 대형 코인: 20%
• 소형 코인: 10%

🎯 리스크 분산 전략:
1. 시가총액별 분산
2. 섹터별 분산 (DeFi, NFT, Layer1 등)
3. 지역별 분산
4. 시간별 분산 (DCA)

❓ 질문:
- 현재 1000만원으로 시작하려고 하는데 어떤 비율로 구성하시겠어요?
- 소형 코인 중에서 추천하는 것이 있나요?
- 리스크 관리 방법에 대해 더 자세히 알고 싶습니다.

고수님들의 의견도 댓글로 부탁드립니다!`
  },
  {
    id: 6,
    number: 6,
    title: '자동매매 시스템 이용 안내',
    category: '공지',
    author: '관리자',
    date: '2024-01-10',
    views: 189,
    likes: 8,
    content: `자동매매 시스템 이용에 대한 안내사항입니다.

🔧 시스템 점검 일정:
- 매주 일요일 새벽 2시 ~ 4시
- 긴급 점검 시 사전 공지

📋 이용 규칙:
1. API 키는 본인만 사용
2. 타인과 공유 금지
3. 과도한 거래량 제한
4. 시스템 남용 시 제재

⚠️ 주의사항:
- 투자 손실에 대한 책임은 사용자에게 있음
- 시스템 오류 시 즉시 신고
- 백업 데이터 정기적 확인

💬 문의사항:
- 고객센터: support@autotrading.com
- 카카오톡: @자동매매고객센터
- 전화: 1588-1234

안전하고 편리한 자동매매 이용 부탁드립니다.`
  },
  {
    id: 7,
    number: 7,
    title: 'API 키 설정 오류 해결 방법',
    category: '질문',
    author: '초보자',
    date: '2024-01-09',
    views: 67,
    likes: 3,
    content: `API 키 설정 중 오류가 발생해서 도움을 요청합니다.

❌ 발생한 오류:
"API 키 인증 실패" 메시지가 계속 나타납니다.

🔍 시도한 방법:
1. API 키 재생성
2. 권한 설정 확인 (거래, 조회 모두 체크)
3. IP 화이트리스트 설정
4. 브라우저 캐시 삭제

❓ 질문:
- 혹시 다른 해결 방법이 있나요?
- API 키 권한 설정에서 어떤 옵션들을 체크해야 하나요?
- IP 화이트리스트는 어떻게 설정하나요?

고수님들의 도움 부탁드립니다! 🙏`
  },
  {
    id: 8,
    number: 8,
    title: '성공적인 매매 경험담',
    category: '일반',
    author: '성공투자자',
    date: '2024-01-08',
    views: 234,
    likes: 32,
    content: `3년간의 투자 경험을 바탕으로 성공 요인을 공유합니다.

📈 수익률:
- 2021년: +45%
- 2022년: +23%
- 2023년: +67%

💡 성공 요인:
1. 감정적 거래 완전 차단
2. 철저한 리스크 관리 (최대 2% 손실)
3. 장기적 관점 유지
4. 지속적인 학습과 연구

🎯 핵심 전략:
- 비트코인을 기준으로 시장 방향성 판단
- 알트코인은 비트코인 상승 시에만 투자
- 분할 매수/매도로 평균단가 관리
- 익절은 단계별로 설정

💪 심리적 관리:
- 손실 시에도 침착함 유지
- 수익 시 과신하지 않기
- 매일 차트 분석 습관화
- 커뮤니티 정보 참고하되 독립적 판단

궁금한 점 있으시면 언제든 댓글로!`
  },
];

const Board: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({ title: '', category: '일반', content: '' });
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const postsPerPage = 5;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // 게시물 로드
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const postsData = await postService.getPosts();
        setPosts(postsData);
        setFilteredPosts(postsData);
      } catch (error) {
        console.error('게시물 로드 오류:', error);
        toast.error('게시물을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  // 커뮤니티에서 전달받은 상태 처리
  useEffect(() => {
    if (location.state) {
      const { selectedCategory: category, searchTerm: term, postId } = location.state as any;
      if (category) {
        setSelectedCategory(category);
      }
      if (term) {
        setSearchTerm(term);
      }
      if (postId) {
        // 특정 게시물을 바로 보여주기
        const post = posts.find(p => p.id === postId);
        if (post) {
          setSelectedPost(post);
          setShowPostDetailModal(true);
          loadComments(postId);
        }
      }
    }
  }, [location.state, posts]);

  // 댓글 로드
  const loadComments = async (postId: string) => {
    try {
      const commentsData = await commentService.getComments(postId);
      setComments(commentsData);
    } catch (error) {
      console.error('댓글 로드 오류:', error);
      toast.error('댓글을 불러오는데 실패했습니다.');
    }
  };

  // 게시물 상세 보기 시 댓글 로드
  useEffect(() => {
    if (selectedPost) {
      loadComments(selectedPost.id!);
    }
  }, [selectedPost]);

  useEffect(() => {
    let filtered = posts;
    
    // 카테고리 필터링
    if (selectedCategory !== '전체') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    // 검색어 필터링
    if (searchTerm.trim()) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 작성일 기준 최신순 정렬
    filtered = filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredPosts(filtered);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  }, [posts, searchTerm, selectedCategory]);

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
        
        setNewPost({ title: '', category: '일반', content: '' });
        setShowNewPostModal(false);
        toast.success('게시물이 작성되었습니다!');
        
        // 게시물 목록 새로고침
        const postsData = await postService.getPosts();
        setPosts(postsData);
      } catch (error) {
        console.error('게시물 작성 오류:', error);
        toast.error('게시물 작성에 실패했습니다.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePostClick = async (post: Post) => {
    setSelectedPost(post);
    setShowPostDetailModal(true);
    
    // 조회수 증가
    try {
      await postService.incrementViews(post.id!);
      // 로컬 상태 업데이트
      setPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, views: p.views + 1 } : p
      ));
    } catch (error) {
      console.error('조회수 증가 오류:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (newComment.trim() && selectedPost) {
      try {
        await commentService.createComment({
          postId: selectedPost.id!,
          author: user.displayName || user.email || '익명',
          authorId: user.uid,
          content: newComment.trim(),
        });
        
        setNewComment('');
        toast.success('댓글이 작성되었습니다!');
        
        // 댓글 목록 새로고침
        await loadComments(selectedPost.id!);
        
        // 게시물의 댓글 수 업데이트
        setPosts(prev => prev.map(p => 
          p.id === selectedPost.id ? { ...p, comments: p.comments + 1 } : p
        ));
      } catch (error) {
        console.error('댓글 작성 오류:', error);
        toast.error('댓글 작성에 실패했습니다.');
      }
    }
  };

  const handleCommentKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

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

  // 현재 게시물의 댓글만 필터링
  const currentComments = comments.filter(comment => comment.postId === selectedPost?.id);

  // 로그인 체크
  if (!user) {
    return (
      <BoardContainer>
        <Header>
          <Title>게시판</Title>
          <Subtitle>자동매매 시스템 관련 공지사항과 자유로운 소통 공간입니다</Subtitle>
        </Header>
        
        <InfoBox>
          <InfoTitle>
            <FiFilter size={16} />
            🔐 로그인이 필요합니다
          </InfoTitle>
          <InfoText>
            게시판 기능을 사용하려면 먼저 로그인해주세요.
            로그인 후 게시물 작성과 댓글이 가능합니다.
          </InfoText>
        </InfoBox>
      </BoardContainer>
    );
  }

  return (
    <BoardContainer>
      <Header>
        <Title>게시판</Title>
        <Subtitle>자동매매 시스템 관련 공지사항과 자유로운 소통 공간입니다</Subtitle>
      </Header>

      <InfoBox>
        <InfoTitle>
          <FiFilter size={16} />
          📋 게시판 이용 안내
        </InfoTitle>
        <InfoText>
          공지사항, 질문, 정보 공유 등 다양한 주제로 자유롭게 소통할 수 있습니다. 
          검색과 카테고리 필터를 활용하여 원하는 게시물을 쉽게 찾아보세요.
        </InfoText>
      </InfoBox>

      <Controls>
        <SearchBox>
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="제목 또는 작성자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchBox>
        
        <CategoryFilter
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </CategoryFilter>
        
        <NewPostButton
          onClick={() => setShowNewPostModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiPlus size={16} />
          새 글 작성
        </NewPostButton>
      </Controls>

      <BoardContent>
        <BoardHeader>
          <div>번호</div>
          <div>제목</div>
          <div>작성자</div>
          <div>작성일</div>
          <div>조회</div>
          <div>추천</div>
        </BoardHeader>
        
        <BoardList>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#a0aec0', 
              padding: '40px',
              fontSize: '16px'
            }}>
              게시물을 불러오는 중...
            </div>
          ) : currentPosts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#a0aec0', 
              padding: '40px',
              fontSize: '16px'
            }}>
              게시물이 없습니다.
            </div>
          ) : (
            currentPosts.map((post, index) => (
              <PostRow
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}
                onClick={() => handlePostClick(post)}
              >
                <PostNumber>{startIndex + index + 1}</PostNumber>
                <PostTitle>
                  {post.category === '공지' && (
                    <PostCategory category={post.category}>{post.category}</PostCategory>
                  )}
                  {post.title}
                </PostTitle>
                <PostAuthor>{post.author}</PostAuthor>
                <PostDate>{formatDate(post.createdAt)}</PostDate>
                <PostStats>{post.views}</PostStats>
                <PostStats>{post.likes}</PostStats>
              </PostRow>
            ))
          )}
        </BoardList>
        
        {totalPages > 1 && (
          <Pagination>
            <PageButton
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </PageButton>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PageButton
                key={page}
                isActive={currentPage === page}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </PageButton>
            ))}
            
            <PageButton
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </PageButton>
          </Pagination>
        )}
      </BoardContent>

      {/* 게시물 상세 보기 모달 */}
      <AnimatePresence>
        {showPostDetailModal && selectedPost && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPostDetailModal(false)}
          >
            <Modal
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '95%', maxWidth: '1000px', display: 'flex', gap: '20px' }}
            >
              {/* 게시물 내용 */}
              <div style={{ flex: '1', minWidth: '0' }}>
                <ModalHeader>
                  <ModalTitle>게시물</ModalTitle>
                  <CloseButton onClick={() => setShowPostDetailModal(false)}>
                    <FiX size={20} />
                  </CloseButton>
                </ModalHeader>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    marginBottom: '10px',
                    color: '#a0aec0',
                    fontSize: '14px'
                  }}>
                    <span>작성자: {selectedPost.author}</span>
                    <span>•</span>
                    <span>작성일: {formatDate(selectedPost.createdAt)}</span>
                    <span>•</span>
                    <span>조회수: {selectedPost.views}</span>
                    <span>•</span>
                    <span>추천수: {selectedPost.likes}</span>
                  </div>
                  
                  <div style={{ 
                    color: '#a0aec0',
                    lineHeight: '1.6',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedPost.content || '게시물 내용이 없습니다.'}
                  </div>
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div style={{ 
                flex: '1', 
                minWidth: '0',
                borderLeft: '1px solid #2d3748',
                paddingLeft: '20px'
              }}>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#ffffff',
                  marginBottom: '15px'
                }}>
                  댓글 ({currentComments.length})
                </div>
                
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {/* 댓글 목록 */}
                  {currentComments.map(comment => (
                    <div key={comment.id} style={{ 
                      background: 'rgba(45, 55, 72, 0.5)',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          color: '#667eea', 
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {comment.author}
                        </span>
                        <span style={{ color: '#718096', fontSize: '12px' }}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <div style={{ 
                        color: '#ffffff',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 댓글 작성 */}
                <div style={{ 
                  marginTop: '15px',
                  paddingTop: '15px',
                  borderTop: '1px solid #2d3748'
                }}>
                  <div style={{ 
                    background: 'rgba(45, 55, 72, 0.8)',
                    border: '1px solid #2d3748',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <input
                      type="text"
                      placeholder="댓글을 입력하세요..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={handleCommentKeyPress}
                      style={{
                        flex: '1',
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button 
                      onClick={handleCommentSubmit}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      작성
                    </button>
                  </div>
                </div>
              </div>
            </Modal>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* 새 게시물 작성 모달 */}
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
    </BoardContainer>
  );
};

export default Board;
