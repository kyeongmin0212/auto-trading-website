import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiTrash2, FiX, FiCheck, FiKey, FiBell, FiZap } from 'react-icons/fi';
import { 
  updatePassword, 
  deleteUser, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { deleteUserData, getUserInfo, getAutoTradingConfig, saveAutoTradingConfig } from '../firebase/services';
import toast from 'react-hot-toast';

const MyPageContainer = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 25px;
  text-align: center;
`;

const Section = styled(motion.div)`
  background: rgba(26, 31, 46, 0.95);
  border: 1px solid #2d3748;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGroup = styled.div`
  position: relative;
  margin-bottom: 0;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #a0aec0;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 15px 15px 60px;
  background: rgba(45, 55, 72, 0.8);
  border: 1px solid #4a5568;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    border-color: #667eea;
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  height: 20px;
  line-height: 1;
  margin-top: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 15px;
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(45, 55, 72, 0.8);
  color: #ffffff;
  border: 1px solid #4a5568;
  
  &:hover:not(:disabled) {
    background: rgba(45, 55, 72, 1);
  }
`;

const DangerButton = styled(Button)`
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  color: #ffffff;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(229, 62, 62, 0.3);
  }
`;

const InfoText = styled.p`
  color: #a0aec0;
  font-size: 14px;
  margin: 12px 0;
  line-height: 1.5;
`;

const WarningText = styled.p`
  color: #f6ad55;
  font-size: 14px;
  margin: 12px 0;
  line-height: 1.5;
  padding: 15px;
  background: rgba(246, 173, 85, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(246, 173, 85, 0.3);
`;

const Modal = styled(motion.div)`
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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: rgba(26, 31, 46, 0.95);
  border: 1px solid #2d3748;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 20px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
`;

interface UserInfo {
  email: string;
  name: string;
  createdAt: Date;
}

interface ApiSettings {
   kisAppKey: string;
   kisAppSecret: string;
   kisAccountNumber: string;
   telegramToken: string;
   telegramChatId: string;
   openaiApiKey: string;
 }

const MyPage: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
     // API 설정 상태
   const [apiSettings, setApiSettings] = useState<ApiSettings>({
     kisAppKey: '',
     kisAppSecret: '',
     kisAccountNumber: '',
     telegramToken: '',
     telegramChatId: '',
     openaiApiKey: ''
   });
  const [isEditingApi, setIsEditingApi] = useState(false);
  
  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 계정 탈퇴 상태
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadUserInfo();
    loadApiSettings();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Firebase에서 사용자 정보 가져오기
        const userInfo = await getUserInfo(user.uid);
        if (userInfo) {
          setUserInfo({
            email: userInfo.email,
            name: userInfo.name || '',
            createdAt: userInfo.createdAt.toDate()
          });
        } else {
          // 사용자 정보가 없으면 기본값 설정
          setUserInfo({
            email: user.email || '',
            name: '',
            createdAt: new Date(user.metadata.creationTime || Date.now())
          });
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
      toast.error('사용자 정보를 불러올 수 없습니다.');
    }
  };

  const loadApiSettings = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const config = await getAutoTradingConfig(user.uid);
                 if (config) {
           setApiSettings({
             kisAppKey: config.kisAppKey || '',
             kisAppSecret: config.kisAppSecret || '',
             kisAccountNumber: config.kisAccountNumber || '',
             telegramToken: config.telegramToken || '',
             telegramChatId: config.telegramChatId || '',
             openaiApiKey: config.openaiApiKey || ''
           });
         }
      }
    } catch (error) {
      console.error('API 설정 로드 실패:', error);
      toast.error('API 설정을 불러올 수 없습니다.');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('사용자를 찾을 수 없습니다.');

      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 새 비밀번호로 변경
      await updatePassword(user, newPassword);

      toast.success('비밀번호가 성공적으로 변경되었습니다.');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('현재 비밀번호가 올바르지 않습니다.');
      } else {
        toast.error('비밀번호 변경에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) throw new Error('사용자를 찾을 수 없습니다.');

      // 현재 비밀번호로 재인증
      const credential = EmailAuthProvider.credential(user.email || '', deletePassword);
      await reauthenticateWithCredential(user, credential);

      // 사용자 데이터 삭제
      await deleteUserData(user.uid);

      // 계정 삭제
      await deleteUser(user);

      toast.success('계정이 성공적으로 삭제되었습니다.');
      // 로그아웃 처리
      window.location.href = '/';
    } catch (error: any) {
      console.error('계정 삭제 실패:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('비밀번호가 올바르지 않습니다.');
      } else {
        toast.error('계정 삭제에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

     const handleApiSettingsSave = async () => {
     try {
       setLoading(true);
       const user = auth.currentUser;
       if (!user) throw new Error('사용자를 찾을 수 없습니다.');

       console.log('저장 시작 - 현재 API 설정:', apiSettings);

       // 기존 설정 가져오기
       const existingConfig = await getAutoTradingConfig(user.uid);
       console.log('기존 설정:', existingConfig);
       
       if (existingConfig) {
         const updatedConfig = {
           ...existingConfig,
           ...apiSettings
         };
         console.log('업데이트된 설정:', updatedConfig);

         // 설정 저장
         await saveAutoTradingConfig(user.uid, updatedConfig);
         console.log('설정 저장 완료');
         
         toast.success('API 설정이 성공적으로 저장되었습니다.');
         setIsEditingApi(false);
       } else {
         console.log('기존 설정이 없음 - 새로 생성');
         // 기존 설정이 없으면 기본값과 함께 새로 생성
         const newConfig = {
           ...apiSettings,
           paperTrading: true,
           paperTradingBalance: 1000000,
           maxStocks: 5,
           stopLossPercentage: 5,
           takeProfitPercentage: 10,
           dcaPercentage: 10,
           aiScoreThreshold: 50,
           investmentRatio: 5,
           targetMarket: 'NASDAQ',
           tradingHoursStart: 17,
           tradingHoursEnd: 2,
           rsiPeriod: 14,
           macdFast: 12,
           macdSlow: 26,
           macdSignal: 9,
           bollingerPeriod: 20,
           bollingerStd: 2,
           volumeMaPeriod: 20,
           isActive: false
         };
         await saveAutoTradingConfig(user.uid, newConfig);
         console.log('새 설정 생성 완료');
         
         toast.success('API 설정이 성공적으로 저장되었습니다.');
         setIsEditingApi(false);
       }
     } catch (error) {
       console.error('API 설정 저장 실패:', error);
       toast.error('API 설정 저장에 실패했습니다.');
     } finally {
       setLoading(false);
     }
   };

     const handleApiInputChange = (field: keyof ApiSettings, value: string) => {
     setApiSettings(prev => ({
       ...prev,
       [field]: value
     }));
   };

  if (!userInfo) {
    return (
      <MyPageContainer>
        <PageTitle>마이페이지</PageTitle>
        <Section>
          <InfoText>사용자 정보를 불러오는 중...</InfoText>
        </Section>
      </MyPageContainer>
    );
  }

  return (
    <MyPageContainer>
      <PageTitle>마이페이지</PageTitle>

             {/* 사용자 정보 섹션 */}
       <Section
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4 }}
       >
         <SectionTitle>
           <FiUser />
           사용자 정보
         </SectionTitle>
         
         <Form>
           <FormGroup>
             <Label>이메일 주소</Label>
             <IconWrapper>
               <FiMail size={20} />
             </IconWrapper>
             <Input
               type="email"
               value={userInfo.email}
               disabled
             />
           </FormGroup>

           <FormGroup>
             <Label>이름 (닉네임)</Label>
             <IconWrapper>
               <FiUser size={20} />
             </IconWrapper>
             <Input
               type="text"
               value={userInfo.name || '이름이 설정되지 않았습니다'}
               disabled
             />
           </FormGroup>



           <FormGroup>
             <Label>가입일</Label>
             <IconWrapper>
               <FiUser size={20} />
             </IconWrapper>
             <Input
               type="text"
               value={userInfo.createdAt.toLocaleDateString('ko-KR')}
               disabled
             />
           </FormGroup>
         </Form>
       </Section>

       {/* API 설정 섹션 */}
       <Section
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.1 }}
       >
         <SectionTitle>
           <FiKey />
           API 설정
         </SectionTitle>
         
         {isEditingApi ? (
           <Form>
             {/* KIS API 설정 */}
             <div style={{ marginBottom: '25px' }}>
               <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid #4a5568', paddingBottom: '8px' }}>
                 KIS API 설정
               </h3>
               <FormGroup>
                 <Label>KIS App Key</Label>
                 <IconWrapper>
                   <FiKey size={20} />
                 </IconWrapper>
                 <Input
                   type="password"
                   placeholder="KIS App Key를 입력하세요"
                   value={apiSettings.kisAppKey}
                   onChange={(e) => handleApiInputChange('kisAppKey', e.target.value)}
                 />
               </FormGroup>

               <FormGroup>
                 <Label>KIS App Secret</Label>
                 <IconWrapper>
                   <FiKey size={20} />
                 </IconWrapper>
                 <Input
                   type="password"
                   placeholder="KIS App Secret을 입력하세요"
                   value={apiSettings.kisAppSecret}
                   onChange={(e) => handleApiInputChange('kisAppSecret', e.target.value)}
                 />
               </FormGroup>

               <FormGroup>
                 <Label>계좌번호 (앞 8자리)</Label>
                 <IconWrapper>
                   <FiKey size={20} />
                 </IconWrapper>
                 <Input
                   type="text"
                   placeholder="계좌번호 앞 8자리를 입력하세요"
                   value={apiSettings.kisAccountNumber}
                   onChange={(e) => handleApiInputChange('kisAccountNumber', e.target.value)}
                 />
               </FormGroup>
             </div>

             {/* 텔레그램 설정 */}
             <div style={{ marginBottom: '25px' }}>
               <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid #4a5568', paddingBottom: '8px' }}>
                 텔레그램 설정
               </h3>
               <FormGroup>
                 <Label>텔레그램 봇 토큰</Label>
                 <IconWrapper>
                   <FiBell size={20} />
                 </IconWrapper>
                 <Input
                   type="password"
                   placeholder="텔레그램 봇 토큰을 입력하세요"
                   value={apiSettings.telegramToken}
                   onChange={(e) => handleApiInputChange('telegramToken', e.target.value)}
                 />
               </FormGroup>

               <FormGroup>
                 <Label>텔레그램 채팅 ID</Label>
                 <IconWrapper>
                   <FiBell size={20} />
                 </IconWrapper>
                 <Input
                   type="text"
                   placeholder="텔레그램 채팅 ID를 입력하세요"
                   value={apiSettings.telegramChatId}
                   onChange={(e) => handleApiInputChange('telegramChatId', e.target.value)}
                 />
               </FormGroup>
             </div>

             {/* OpenAI 설정 */}
             <div style={{ marginBottom: '25px' }}>
               <h3 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '15px', borderBottom: '1px solid #4a5568', paddingBottom: '8px' }}>
                 OpenAI 설정
               </h3>
               <FormGroup>
                 <Label>OpenAI API Key</Label>
                 <IconWrapper>
                   <FiZap size={20} />
                 </IconWrapper>
                 <Input
                   type="password"
                   placeholder="OpenAI API Key를 입력하세요"
                   value={apiSettings.openaiApiKey}
                   onChange={(e) => handleApiInputChange('openaiApiKey', e.target.value)}
                 />
               </FormGroup>
             </div>

             <ButtonGroup>
               <PrimaryButton
                 onClick={handleApiSettingsSave}
                 disabled={loading}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <FiCheck />
                 저장
               </PrimaryButton>
               <SecondaryButton
                 onClick={() => {
                   setIsEditingApi(false);
                   loadApiSettings(); // 원래 값으로 복원
                 }}
                 disabled={loading}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <FiX />
                 취소
               </SecondaryButton>
             </ButtonGroup>
           </Form>
         ) : (
           <div>
             <InfoText>
               API 키와 설정을 관리할 수 있습니다. 편집하려면 아래 버튼을 클릭하세요.
             </InfoText>
             <div style={{ marginTop: '8px' }}>
               <Button
                 onClick={() => setIsEditingApi(true)}
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.98 }}
               >
                 <FiKey />
                 API 설정 편집
               </Button>
             </div>
           </div>
         )}
       </Section>

       {/* 비밀번호 변경 섹션 */}
      <Section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SectionTitle>
          <FiLock />
          비밀번호 변경
        </SectionTitle>
        
        {isChangingPassword ? (
          <Form>
            <FormGroup>
              <Label>현재 비밀번호</Label>
              <IconWrapper>
                <FiLock size={20} />
              </IconWrapper>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
              />
            </FormGroup>

            <FormGroup>
              <Label>새 비밀번호</Label>
              <IconWrapper>
                <FiLock size={20} />
              </IconWrapper>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호 (최소 6자)"
              />
            </FormGroup>

            <FormGroup>
              <Label>새 비밀번호 확인</Label>
              <IconWrapper>
                <FiLock size={20} />
              </IconWrapper>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
            </FormGroup>

            <ButtonGroup>
              <PrimaryButton
                onClick={handlePasswordChange}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiCheck />
                비밀번호 변경
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiX />
                취소
              </SecondaryButton>
            </ButtonGroup>
          </Form>
        ) : (
          <div>
            <InfoText>
              보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.
            </InfoText>
            <div style={{ marginTop: '8px' }}>
              <Button
                onClick={() => setIsChangingPassword(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiLock />
                비밀번호 변경
              </Button>
            </div>
          </div>
        )}
      </Section>

             {/* 계정 탈퇴 섹션 */}
       <Section
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.4, delay: 0.2 }}
       >
         <SectionTitle>
           <FiTrash2 />
           계정 탈퇴
         </SectionTitle>
         
         <WarningText>
           ⚠️ <strong>주의:</strong> 계정 탈퇴 시 모든 데이터가 영구적으로 삭제되며, 
           복구할 수 없습니다. 신중하게 결정해주세요.
         </WarningText>

         <div style={{ marginTop: '8px' }}>
           <Button
             onClick={() => setShowDeleteModal(true)}
             whileHover={{ scale: 1.02 }}
             whileTap={{ scale: 0.98 }}
           >
             <FiTrash2 />
             계정 탈퇴
           </Button>
         </div>
       </Section>

             {/* 계정 탈퇴 확인 모달 */}
       {showDeleteModal && (
         <Modal
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
         >
           <ModalContent>
             <div style={{ textAlign: 'center', marginBottom: '30px' }}>
               <div style={{ 
                 width: '60px', 
                 height: '60px', 
                 borderRadius: '50%', 
                 background: '#e53e3e',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 margin: '0 auto 16px'
               }}>
                 <FiTrash2 size={24} color="#ffffff" />
               </div>
               <ModalTitle style={{ color: '#ffffff', fontSize: '20px', margin: 0 }}>
                 계정 탈퇴 확인
               </ModalTitle>
             </div>
             
             <div style={{ 
               background: 'rgba(229, 62, 62, 0.05)',
               border: '1px solid rgba(229, 62, 62, 0.2)',
               borderRadius: '12px',
               padding: '20px',
               marginBottom: '24px'
             }}>
               <div style={{ 
                 fontSize: '16px', 
                 color: '#ffffff', 
                 marginBottom: '16px',
                 fontWeight: '600',
                 textAlign: 'center'
               }}>
                 계정 탈퇴 시 다음 데이터가 영구적으로 삭제됩니다
               </div>
               
               <div style={{ 
                 display: 'flex', 
                 flexWrap: 'wrap',
                 gap: '8px',
                 justifyContent: 'center',
                 fontSize: '13px',
                 color: '#a0aec0'
               }}>
                 <span style={{
                   background: 'rgba(229, 62, 62, 0.1)',
                   padding: '6px 12px',
                   borderRadius: '6px',
                   border: '1px solid rgba(229, 62, 62, 0.2)'
                 }}>사용자 정보</span>
                 <span style={{
                   background: 'rgba(229, 62, 62, 0.1)',
                   padding: '6px 12px',
                   borderRadius: '6px',
                   border: '1px solid rgba(229, 62, 62, 0.2)'
                 }}>API 설정</span>
                 <span style={{
                   background: 'rgba(229, 62, 62, 0.1)',
                   padding: '6px 12px',
                   borderRadius: '6px',
                   border: '1px solid rgba(229, 62, 62, 0.2)'
                 }}>거래 기록</span>
                 <span style={{
                   background: 'rgba(229, 62, 62, 0.1)',
                   padding: '6px 12px',
                   borderRadius: '6px',
                   border: '1px solid rgba(229, 62, 62, 0.2)'
                 }}>전략 템플릿</span>
                 <span style={{
                   background: 'rgba(229, 62, 62, 0.1)',
                   padding: '6px 12px',
                   borderRadius: '6px',
                   border: '1px solid rgba(229, 62, 62, 0.2)'
                 }}>알림 설정</span>
                 <span style={{
                   background: 'rgba(229, 62, 62, 0.1)',
                   padding: '6px 12px',
                   borderRadius: '6px',
                   border: '1px solid rgba(229, 62, 62, 0.2)'
                 }}>모든 개인 데이터</span>
               </div>
               
               <div style={{
                 textAlign: 'center',
                 marginTop: '16px',
                 padding: '12px',
                 background: 'rgba(229, 62, 62, 0.1)',
                 borderRadius: '8px',
                 border: '1px solid rgba(229, 62, 62, 0.2)'
               }}>
                 <span style={{
                   fontSize: '13px',
                   color: '#feb2b2',
                   fontWeight: '500'
                 }}>
                   이 작업은 되돌릴 수 없습니다
                 </span>
               </div>
             </div>

                            <Form>
                 <FormGroup>
                   <Label style={{ color: '#a0aec0', fontWeight: '500', fontSize: '14px' }}>
                     현재 비밀번호
                   </Label>
                   <Input
                     type="password"
                     value={deletePassword}
                     onChange={(e) => setDeletePassword(e.target.value)}
                     placeholder="계정 삭제를 위해 비밀번호를 입력하세요"
                     style={{ 
                       borderColor: '#4a5568',
                       background: 'rgba(45, 55, 72, 0.8)',
                       textAlign: 'center',
                       padding: '15px'
                     }}
                   />
                 </FormGroup>

                 <ModalActions>
                   <DangerButton
                     onClick={handleAccountDeletion}
                     disabled={loading || !deletePassword}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <FiTrash2 />
                     계정 탈퇴
                   </DangerButton>
                   <SecondaryButton
                     onClick={() => {
                       setShowDeleteModal(false);
                       setDeletePassword('');
                     }}
                     disabled={loading}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                   >
                     <FiX />
                     취소
                   </SecondaryButton>
                 </ModalActions>
               </Form>
           </ModalContent>
         </Modal>
       )}
    </MyPageContainer>
  );
};

export default MyPage;
