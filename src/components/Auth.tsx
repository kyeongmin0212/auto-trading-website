import React, { useState, createContext, useContext, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMail, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { saveUserInfo } from '../firebase/services';
import toast from 'react-hot-toast';

// AuthContext 생성
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// AuthProvider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast.error('로그아웃에 실패했습니다.');
    }
  };

  const value = {
    user,
    loading,
    signOut: handleSignOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
`;

const AuthCard = styled(motion.div)`
  background: rgba(26, 31, 46, 0.95);
  border: 1px solid #2d3748;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  backdrop-filter: blur(20px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30px;
  color: #ffffff;
  word-break: keep-all;
  line-height: 1.2;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const FormGroup = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 15px 50px 15px 50px;
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
  
  &::placeholder {
    color: #718096;
  }
  
  &::-webkit-input-placeholder {
    color: #718096;
  }
  
  &::-moz-placeholder {
    color: #718096;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #667eea;
  }
`;

const EmailIconWrapper = styled.div`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const PasswordIconWrapper = styled.div`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ToggleText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #a0aec0;
  font-size: 14px;
  line-height: 1.4;
  
  span {
    color: #667eea;
    cursor: pointer;
    text-decoration: underline;
    
    &:hover {
      color: #764ba2;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  text-align: center;
  font-size: 14px;
  margin-top: 10px;
  line-height: 1.4;
  word-break: keep-all;
`;

interface AuthProps {}

const Auth: React.FC<AuthProps> = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 회원가입 단계 관리
  const [signupStep, setSignupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  
  // 약관 동의
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);

  // 이메일 인증 관련 함수들
  const sendVerificationEmail = async () => {
    try {
      setLoading(true);
      // 임시로 이메일 전송 성공으로 처리 (실제로는 Firebase Auth의 이메일 인증 사용)
      setVerificationSent(true);
      toast.success('인증 이메일이 전송되었습니다. 이메일을 확인해주세요.');
    } catch (error) {
      console.error('인증 이메일 전송 실패:', error);
      toast.error('인증 이메일 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async () => {
    try {
      setLoading(true);
      // 임시로 이메일 인증 성공으로 처리 (실제로는 Firebase Auth의 이메일 인증 사용)
      if (verificationCode === '123456') { // 테스트용 코드
        setEmailVerified(true);
        toast.success('이메일 인증이 완료되었습니다.');
        setSignupStep(3);
      } else {
        toast.error('인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('이메일 인증 실패:', error);
      toast.error('이메일 인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // 로그인
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        toast.success('로그인 성공!');
      } else {
        // 회원가입
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        // 사용자 정보를 Firebase에 저장 (가입 순서 포함)
        await saveUserInfo(userId, email, name);
        
        toast.success('회원가입 성공!');
      }
    } catch (error: any) {
      let errorMessage = '인증에 실패했습니다.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = '등록되지 않은 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '잘못된 비밀번호입니다.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. (최소 6자)';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSignupStep(1);
    setEmailVerified(false);
    setVerificationSent(false);
  };

  // 회원가입 단계별 렌더링
  const renderSignupStep = () => {
    switch (signupStep) {
      case 1:
        return (
          <>
            <FormGroup>
              <Input
                type="text"
                placeholder="이름 (닉네임)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <EmailIconWrapper>
                <FiMail size={20} />
              </EmailIconWrapper>
            </FormGroup>
            
            <FormGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호 (최소 6자)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <PasswordIconWrapper>
                <FiLock size={20} />
              </PasswordIconWrapper>
              <IconWrapper onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </IconWrapper>
            </FormGroup>
            
            <FormGroup>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <PasswordIconWrapper>
                <FiLock size={20} />
              </PasswordIconWrapper>
              <IconWrapper onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
              </IconWrapper>
            </FormGroup>
            
            <Button
              type="button"
              onClick={async () => {
                if (!name.trim()) {
                  setError('이름을 입력해주세요.');
                  return;
                }
                if (password !== confirmPassword) {
                  setError('비밀번호가 일치하지 않습니다.');
                  return;
                }
                if (password.length < 6) {
                  setError('비밀번호는 최소 6자 이상이어야 합니다.');
                  return;
                }
                // 이메일 인증 코드 발송
                await sendVerificationEmail();
                setSignupStep(2);
                setError('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              다음 단계
            </Button>
          </>
        );
      
      case 2:
        return (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: '#a0aec0', marginBottom: '10px' }}>
                {email}로 인증 코드를 발송했습니다.
              </p>
              <Button
                type="button"
                onClick={sendVerificationEmail}
                disabled={verificationSent}
                style={{ 
                  background: 'rgba(45, 55, 72, 0.8)',
                  marginBottom: '20px'
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {verificationSent ? '발송됨' : '인증 코드 발송'}
              </Button>
            </div>
            
            <FormGroup>
              <Input
                type="text"
                placeholder="인증 코드 6자리 입력"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                style={{ textAlign: 'center' }}
              />
            </FormGroup>
            
            <Button
              type="button"
              onClick={verifyEmail}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              인증 확인
            </Button>
            
            <Button
              type="button"
              onClick={() => setSignupStep(1)}
              style={{ 
                background: 'rgba(45, 55, 72, 0.8)',
                marginTop: '10px'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              이전 단계
            </Button>
          </>
        );
      
      case 3:
        return (
          <>
            <div style={{ 
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#667eea', margin: 0 }}>
                ✅ 이메일 인증이 완료되었습니다!
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', color: '#ffffff', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    <span style={{ color: '#e53e3e' }}>*</span> 서비스 이용약관에 동의합니다
                  </span>
                </label>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', color: '#ffffff', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={agreeToPrivacy}
                    onChange={(e) => setAgreeToPrivacy(e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ fontSize: '14px' }}>
                    <span style={{ color: '#e53e3e' }}>*</span> 개인정보 처리방침에 동의합니다
                  </span>
                </label>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', color: '#ffffff', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={agreeToMarketing}
                    onChange={(e) => setAgreeToMarketing(e.target.checked)}
                    style={{ marginRight: '10px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#a0aec0' }}>
                    마케팅 정보 수신에 동의합니다 (선택사항)
                  </span>
                </label>
              </div>
            </div>
            
            <Button
              type="button"
              onClick={() => {
                if (!agreeToTerms || !agreeToPrivacy) {
                  setError('필수 약관에 동의해주세요.');
                  return;
                }
                setSignupStep(4);
                setError('');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              약관 동의 및 가입 완료
            </Button>
            
            <Button
              type="button"
              onClick={() => setSignupStep(2)}
              style={{ 
                background: 'rgba(45, 55, 72, 0.8)',
                marginTop: '10px'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              이전 단계
            </Button>
          </>
        );
      
      case 4:
        return (
          <>
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#22c55e', margin: '0 0 10px 0' }}>
                🎉 회원가입이 완료되었습니다!
              </h3>
              <p style={{ color: '#a0aec0', margin: 0, fontSize: '14px' }}>
                이제 로그인하여 서비스를 이용하실 수 있습니다.
              </p>
            </div>
            
            <Button
              type="button"
              onClick={async () => {
                try {
                  setLoading(true);
                  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                  const userId = userCredential.user.uid;
                  
                  // 사용자 정보를 Firebase에 저장
                  await saveUserInfo(userId, email, name);
                  
                  toast.success('회원가입 성공!');
                } catch (error: any) {
                  let errorMessage = '회원가입에 실패했습니다.';
                  
                  if (error.code === 'auth/email-already-in-use') {
                    errorMessage = '이미 사용 중인 이메일입니다.';
                  } else if (error.code === 'auth/weak-password') {
                    errorMessage = '비밀번호가 너무 약합니다. (최소 6자)';
                  } else if (error.code === 'auth/invalid-email') {
                    errorMessage = '유효하지 않은 이메일 형식입니다.';
                  }
                  
                  setError(errorMessage);
                  toast.error(errorMessage);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? '처리 중...' : '로그인하기'}
            </Button>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <AuthContainer>
      <AuthCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>{isLogin ? '로그인' : '회원가입'}</Title>

        <Form onSubmit={handleSubmit}>
          {isLogin ? (
            // 로그인 폼
            <>
          <FormGroup>
            <Input
              type="email"
                  placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
                <EmailIconWrapper>
                  <FiMail size={20} />
                </EmailIconWrapper>
          </FormGroup>

          <FormGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호 (최소 6자)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
                  minLength={6}
                />
                <PasswordIconWrapper>
                  <FiLock size={20} />
                </PasswordIconWrapper>
                <IconWrapper onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </IconWrapper>
          </FormGroup>

              {error && <ErrorMessage>{error}</ErrorMessage>}
              
              <Button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? '처리 중...' : '로그인'}
              </Button>
            </>
          ) : (
            // 회원가입 단계별 폼
            <>
              {renderSignupStep()}
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </>
          )}
        </Form>

        <ToggleText>
          {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          <br />
          <span onClick={toggleMode}>
            {isLogin ? '회원가입하기' : '로그인하기'}
          </span>
        </ToggleText>
      </AuthCard>
    </AuthContainer>
  );
};

export default Auth;
