import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

// 사용자 설정 타입
export interface UserSettings {
  userId: string;
  apiKey: string;
  apiSecret: string;
  exchange: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  priceAlerts: boolean;
  tradeAlerts: boolean;
  maxTradeAmount: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  createdAt: Date;
  updatedAt: Date;
}

// 자동매매 봇 설정 타입
export interface AutoTradingConfig {
  userId: string;
  userEmail: string; // 사용자 이메일 추가
  // KIS API 설정
  kisAppKey: string;
  kisAppSecret: string;
  kisAccountNumber: string;
  
  // Telegram 설정
  telegramToken: string;
  telegramChatId: string;
  
  // OpenAI 설정
  openaiApiKey: string;
  
  // 거래 설정
  paperTrading: boolean;
  paperTradingBalance: number;
  maxStocks: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
  dcaPercentage: number;
  aiScoreThreshold: number;
  investmentRatio: number;
  targetMarket: string;
  tradingHoursStart: number;
  tradingHoursEnd: number;
  
  // 메타데이터
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// 전략 템플릿 타입
export interface StrategyTemplate {
  id?: string;
  userId: string;
  name: string;
  description: string;
  exchange: string;
  indicators: string[];
  actions: string[];
  conditions: string[];
  settings: Partial<UserSettings>;
  code: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 실시간 설정 리스너 타입
export interface TradingConfig {
  userId: string;
  isActive: boolean;
  apiKey: string;
  apiSecret: string;
  exchange: string;
  symbols: string[];
  // 한국투자증권 해외주식 API 설정
  kisApi: {
    appKey: string;
    appSecret: string;
    accountNumber: string;
    accountCode: string;
    exchange: string;
    isConnected: boolean;
    lastConnection: string | null;
  };

  indicators: {
    rsi: {
      enabled: boolean;
      period: number;
      overbought: number;
      oversold: number;
    };
    macd: {
      enabled: boolean;
      fastPeriod: number;
      slowPeriod: number;
      signalPeriod: number;
    };
    bollinger: {
      enabled: boolean;
      period: number;
      standardDeviation: number;
    };
    // 새로운 지표들 추가
    movingAverage: {
      enabled: boolean;
      shortPeriod: number;
      longPeriod: number;
      type: 'sma' | 'ema' | 'wma';
    };
    stochastic: {
      enabled: boolean;
      kPeriod: number;
      dPeriod: number;
      overbought: number;
      oversold: number;
    };
    volume: {
      enabled: boolean;
      period: number;
      multiplier: number;
    };
    atr: {
      enabled: boolean;
      period: number;
    };
    adx: {
      enabled: boolean;
      period: number;
      threshold: number;
    };
    // 추가 고급 지표들
    williamsR: {
      enabled: boolean;
      period: number;
      overbought: number;
      oversold: number;
    };
    parabolicSAR: {
      enabled: boolean;
      acceleration: number;
      maximum: number;
    };
    ichimoku: {
      enabled: boolean;
      tenkanPeriod: number;
      kijunPeriod: number;
      senkouSpanBPeriod: number;
      displacement: number;
    };
    cci: {
      enabled: boolean;
      period: number;
      overbought: number;
      oversold: number;
    };
    obv: {
      enabled: boolean;
      period: number;
    };
    mfi: {
      enabled: boolean;
      period: number;
      overbought: number;
      oversold: number;
    };
    keltner: {
      enabled: boolean;
      period: number;
      multiplier: number;
    };
    donchian: {
      enabled: boolean;
      period: number;
    };
    pivotPoints: {
      enabled: boolean;
      type: 'standard' | 'fibonacci' | 'camarilla';
    };
  };
  riskManagement: {
    stopLossPercentage: number;
    takeProfitPercentage: number;
    maxTradeAmount: number;
    maxDailyLoss: number;
    maxDailyTrades: number;
    trailingStop: boolean;
    trailingStopPercentage: number;
  };
  tradingRules: {
    minVolume: number;
    minPriceChange: number;
    tradingHours: {
      start: string;
      end: string;
    };
    timeframes: string[];
    maxSpread: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    telegram: boolean;
    telegramBotToken?: string;
    telegramChatId?: string;
    // 추가 알림 채널들
    discord: boolean;
    discordWebhookUrl?: string;
    slack: boolean;
    slackWebhookUrl?: string;
    line: boolean;
    lineChannelAccessToken?: string;
    lineUserId?: string;
    // 알림 설정
    tradeNotifications: boolean;
    priceAlerts: boolean;
    systemAlerts: boolean;
    errorAlerts: boolean;
    // 알림 템플릿
    customMessageTemplate?: string;
    // 알림 스케줄
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
  lastUpdated: Date;
}

// 실시간 설정 리스너 설정
export const subscribeToTradingConfig = (
  userId: string, 
  callback: (config: TradingConfig | null) => void
): Unsubscribe => {
  const docRef = doc(db, 'tradingConfigs', userId);
  
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data() as TradingConfig;
      callback(data);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('실시간 설정 리스너 오류:', error);
    callback(null);
  });
};

// 거래 로그 타입
export interface TradeLog {
  id?: string;
  userId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  strategy: string;
  profit?: number;
  stopLoss?: number;
  takeProfit?: number;
}

// 사용자 설정 저장
export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  try {
    const userSettings: UserSettings = {
      userId,
      apiKey: settings.apiKey || '',
      apiSecret: settings.apiSecret || '',
      exchange: settings.exchange || 'binance',
      emailNotifications: settings.emailNotifications ?? true,
      pushNotifications: settings.pushNotifications ?? false,
      priceAlerts: settings.priceAlerts ?? true,
      tradeAlerts: settings.tradeAlerts ?? true,
      maxTradeAmount: settings.maxTradeAmount || 1000000,
      stopLossPercentage: settings.stopLossPercentage || 5,
      takeProfitPercentage: settings.takeProfitPercentage || 10,
      twoFactorAuth: settings.twoFactorAuth ?? false,
      sessionTimeout: settings.sessionTimeout || 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'userSettings', userId), userSettings);
    return { success: true, data: userSettings };
  } catch (error) {
    console.error('설정 저장 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 사용자 설정 불러오기
export const getUserSettings = async (userId: string) => {
  try {
    const docRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() as UserSettings };
    } else {
      return { success: false, error: '설정을 찾을 수 없습니다.' };
    }
  } catch (error) {
    console.error('설정 불러오기 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 전략 템플릿 저장
export const saveStrategyTemplate = async (template: Omit<StrategyTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const strategyTemplate: StrategyTemplate = {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'strategyTemplates'), strategyTemplate);
    return { success: true, data: { ...strategyTemplate, id: docRef.id } };
  } catch (error) {
    console.error('전략 템플릿 저장 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 사용자의 전략 템플릿 목록 불러오기
export const getUserStrategyTemplates = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'strategyTemplates'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const templates: StrategyTemplate[] = [];
    
    querySnapshot.forEach((doc) => {
      templates.push({ ...doc.data(), id: doc.id } as StrategyTemplate);
    });
    
    return { success: true, data: templates };
  } catch (error) {
    console.error('전략 템플릿 불러오기 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 공개 전략 템플릿 목록 불러오기
export const getPublicStrategyTemplates = async (limitCount: number = 10) => {
  try {
    const q = query(
      collection(db, 'strategyTemplates'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const templates: StrategyTemplate[] = [];
    
    querySnapshot.forEach((doc) => {
      templates.push({ ...doc.data(), id: doc.id } as StrategyTemplate);
    });
    
    return { success: true, data: templates };
  } catch (error) {
    console.error('공개 전략 템플릿 불러오기 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 전략 템플릿 업데이트
export const updateStrategyTemplate = async (templateId: string, updates: Partial<StrategyTemplate>) => {
  try {
    const docRef = doc(db, 'strategyTemplates', templateId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('전략 템플릿 업데이트 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 전략 템플릿 삭제
export const deleteStrategyTemplate = async (templateId: string) => {
  try {
    await deleteDoc(doc(db, 'strategyTemplates', templateId));
    return { success: true };
  } catch (error) {
    console.error('전략 템플릿 삭제 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 특정 전략 템플릿 불러오기
export const getStrategyTemplate = async (templateId: string) => {
  try {
    const docRef = doc(db, 'strategyTemplates', templateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { ...docSnap.data(), id: docSnap.id } as StrategyTemplate };
    } else {
      return { success: false, error: '전략 템플릿을 찾을 수 없습니다.' };
    }
  } catch (error) {
    console.error('전략 템플릿 불러오기 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 거래 설정 저장
export const saveTradingConfig = async (config: TradingConfig) => {
  try {
    const updatedConfig = {
      ...config,
      lastUpdated: new Date()
    };
    
    await setDoc(doc(db, 'tradingConfigs', config.userId), updatedConfig);
    return { success: true, data: updatedConfig };
  } catch (error) {
    console.error('거래 설정 저장 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 거래 설정 불러오기
export const getTradingConfig = async (userId: string) => {
  try {
    const docRef = doc(db, 'tradingConfigs', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() as TradingConfig };
    } else {
      return { success: false, error: '거래 설정을 찾을 수 없습니다.' };
    }
  } catch (error) {
    console.error('거래 설정 불러오기 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 거래 로그 저장
export const saveTradeLog = async (tradeLog: Omit<TradeLog, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'tradeLogs'), tradeLog);
    return { success: true, data: { ...tradeLog, id: docRef.id } };
  } catch (error) {
    console.error('거래 로그 저장 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};



// 사용자 정보를 저장하는 함수
export const saveUserInfo = async (userId: string, userEmail: string, name?: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      userId,
      email: userEmail,
      name: name || '',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('사용자 정보 저장 중 오류:', error);
  }
};

// 자동매매 설정을 저장하는 함수 (사용자 이메일 기반)
export const saveAutoTradingConfig = async (
  userId: string,
  config: Omit<AutoTradingConfig, 'userId' | 'userEmail' | 'userOrder' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
  try {
    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    // 사용자 이메일을 문서 ID로 사용
    const configRef = doc(db, 'autoTradingConfigs', userEmail);
    
    const autoTradingConfig: AutoTradingConfig = {
      userId,
      userEmail,
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(configRef, autoTradingConfig);
  } catch (error) {
    console.error('자동매매 설정 저장 중 오류:', error);
    throw error;
  }
};

// 자동매매 설정을 가져오는 함수 (사용자 이메일 기반)
export const getAutoTradingConfig = async (userId: string): Promise<AutoTradingConfig | null> => {
  try {
    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    // 사용자 이메일로 설정 가져오기
    const configRef = doc(db, 'autoTradingConfigs', userEmail);
    const configDoc = await getDoc(configRef);
    
    if (!configDoc.exists()) {
      return null;
    }
    
    return configDoc.data() as AutoTradingConfig;
  } catch (error) {
    console.error('자동매매 설정 가져오기 중 오류:', error);
    return null;
  }
};

// 자동매매 설정을 업데이트하는 함수
export const updateAutoTradingConfig = async (
  userId: string,
  updates: Partial<Omit<AutoTradingConfig, 'userId' | 'userEmail' | 'userOrder' | 'createdAt'>>
): Promise<void> => {
  try {
    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    // 사용자 이메일로 설정 업데이트
    const configRef = doc(db, 'autoTradingConfigs', userEmail);
    await updateDoc(configRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('자동매매 설정 업데이트 중 오류:', error);
    throw error;
  }
};

// 자동매매 설정을 삭제하는 함수
export const deleteAutoTradingConfig = async (userId: string): Promise<void> => {
  try {
    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('사용자 정보를 찾을 수 없습니다.');
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    // 사용자 이메일로 설정 삭제
    const configRef = doc(db, 'autoTradingConfigs', userEmail);
    await deleteDoc(configRef);
  } catch (error) {
    console.error('자동매매 설정 삭제 중 오류:', error);
    throw error;
  }
};

// 사용자의 거래 로그 불러오기
export const getUserTradeLogs = async (userId: string, limitCount: number = 50) => {
  try {
    const q = query(
      collection(db, 'tradeLogs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const logs: TradeLog[] = [];
    
    querySnapshot.forEach((doc) => {
      logs.push({ ...doc.data(), id: doc.id } as TradeLog);
    });
    
    return { success: true, data: logs };
  } catch (error) {
    console.error('거래 로그 불러오기 실패:', error);
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' };
  }
};

// 사용자 정보를 가져오는 함수
export const getUserInfo = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        email: data.email,
        name: data.name || '',
        createdAt: data.createdAt
      };
    }
    return null;
  } catch (error) {
    console.error('사용자 정보 가져오기 중 오류:', error);
    return null;
  }
};

// 사용자 정보를 업데이트하는 함수
export const updateUserInfo = async (userId: string, updates: Partial<{ email: string }>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('사용자 정보 업데이트 중 오류:', error);
    throw error;
  }
};

// 사용자 데이터를 완전히 삭제하는 함수
export const deleteUserData = async (userId: string): Promise<void> => {
  try {
    // 사용자 정보 가져오기
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return;
    }
    
    const userData = userDoc.data();
    const userEmail = userData.email;
    
    // 모든 관련 데이터 삭제
    const batch = writeBatch(db);
    
    // 사용자 정보 삭제
    batch.delete(userRef);
    
    // 자동매매 설정 삭제
    if (userEmail) {
      const configRef = doc(db, 'autoTradingConfigs', userEmail);
      batch.delete(configRef);
    }
    
    // 거래 설정 삭제
    const tradingConfigRef = doc(db, 'tradingConfigs', userId);
    batch.delete(tradingConfigRef);
    
    // 사용자 설정 삭제
    const userSettingsRef = doc(db, 'userSettings', userId);
    batch.delete(userSettingsRef);
    
    // 거래 로그 삭제
    const tradeLogsQuery = query(collection(db, 'tradeLogs'), where('userId', '==', userId));
    const tradeLogsSnapshot = await getDocs(tradeLogsQuery);
    tradeLogsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // 전략 템플릿 삭제
    const strategyTemplatesQuery = query(collection(db, 'strategyTemplates'), where('userId', '==', userId));
    const strategyTemplatesSnapshot = await getDocs(strategyTemplatesQuery);
    strategyTemplatesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // 배치 실행
    await batch.commit();
  } catch (error) {
    console.error('사용자 데이터 삭제 중 오류:', error);
    throw error;
  }
};

// 커뮤니티 관련 타입 정의
export interface Post {
  id?: string;
  title: string;
  content: string;
  category: string;
  author: string;
  authorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  views: number;
  likes: number;
  comments: number;
  tags?: string[];
}

export interface Comment {
  id?: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
}

export interface ChatMessage {
  id?: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: Timestamp;
  isSystem?: boolean;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  isOnline: boolean;
  lastSeen: Timestamp;
}

// 게시물 서비스
export const postService = {
  // 게시물 목록 조회
  async getPosts(category?: string, limitCount?: number): Promise<Post[]> {
    try {
      let q = query(collection(db, 'posts'));
      
      if (category && category !== '전체') {
        q = query(q, where('category', '==', category));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
    } catch (error) {
      console.error('게시물 조회 오류:', error);
      throw error;
    }
  },

  // 게시물 상세 조회
  async getPost(postId: string): Promise<Post | null> {
    try {
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Post;
      }
      return null;
    } catch (error) {
      console.error('게시물 상세 조회 오류:', error);
      throw error;
    }
  },

  // 게시물 작성
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'likes' | 'comments'>): Promise<string> {
    try {
      const now = serverTimestamp() as Timestamp;
      const post: Omit<Post, 'id'> = {
        ...postData,
        createdAt: now,
        updatedAt: now,
        views: 0,
        likes: 0,
        comments: 0
      };
      
      const docRef = await addDoc(collection(db, 'posts'), post);
      return docRef.id;
    } catch (error) {
      console.error('게시물 작성 오류:', error);
      throw error;
    }
  },

  // 게시물 수정
  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      throw error;
    }
  },

  // 게시물 삭제
  async deletePost(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      throw error;
    }
  },

  // 조회수 증가
  async incrementViews(postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        views: increment(1)
      });
    } catch (error) {
      console.error('조회수 증가 오류:', error);
      throw error;
    }
  },

  // 좋아요 토글
  async toggleLike(postId: string, userId: string): Promise<void> {
    try {
      const docRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(docRef);
      
      if (postSnap.exists()) {
        const post = postSnap.data() as Post;
        const likes = post.likes || 0;
        
        // 사용자별 좋아요 상태를 추적하는 별도 컬렉션 사용
        const likeRef = doc(db, 'postLikes', `${postId}_${userId}`);
        const likeSnap = await getDoc(likeRef);
        
        if (likeSnap.exists()) {
          // 좋아요 취소
          await deleteDoc(likeRef);
          await updateDoc(docRef, { likes: likes - 1 });
        } else {
          // 좋아요 추가
          await setDoc(likeRef, { userId, postId, createdAt: serverTimestamp() });
          await updateDoc(docRef, { likes: likes + 1 });
        }
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      throw error;
    }
  }
};

// 댓글 서비스
export const commentService = {
  // 댓글 목록 조회
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      throw error;
    }
  },

  // 댓글 작성
  async createComment(commentData: Omit<Comment, 'id' | 'createdAt' | 'likes'>): Promise<string> {
    try {
      const comment: Omit<Comment, 'id'> = {
        ...commentData,
        createdAt: serverTimestamp() as Timestamp,
        likes: 0
      };
      
      const docRef = await addDoc(collection(db, 'comments'), comment);
      
      // 게시물의 댓글 수 증가
      const postRef = doc(db, 'posts', commentData.postId);
      await updateDoc(postRef, {
        comments: increment(1)
      });
      
      return docRef.id;
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      throw error;
    }
  },

  // 댓글 삭제
  async deleteComment(commentId: string, postId: string): Promise<void> {
    try {
      const docRef = doc(db, 'comments', commentId);
      await deleteDoc(docRef);
      
      // 게시물의 댓글 수 감소
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comments: increment(-1)
      });
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      throw error;
    }
  }
};

// 실시간 채팅 서비스
export const chatService = {
  // 실시간 메시지 구독
  subscribeToMessages(callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, 'chatMessages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      callback(messages);
    });
    
    return unsubscribe;
  },

  // 메시지 전송
  async sendMessage(messageData: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<string> {
    try {
      const message: Omit<ChatMessage, 'id'> = {
        ...messageData,
        createdAt: serverTimestamp() as Timestamp
      };
      
      const docRef = await addDoc(collection(db, 'chatMessages'), message);
      return docRef.id;
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      throw error;
    }
  },

  // 시스템 메시지 전송
  async sendSystemMessage(content: string): Promise<string> {
    return this.sendMessage({
      author: '시스템',
      authorId: 'system',
      content,
      isSystem: true
    });
  }
};

// 사용자 서비스
export const userService = {
  // 온라인 사용자 목록 구독
  subscribeToOnlineUsers(callback: (users: User[]) => void): () => void {
    const q = query(
      collection(db, 'users'),
      where('isOnline', '==', true),
      orderBy('lastSeen', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      callback(users);
    });
    
    return unsubscribe;
  },

  // 사용자 온라인 상태 업데이트
  async updateUserStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      // 문서가 없어도 동작하도록 merge 옵션으로 setDoc 사용
      await setDoc(
        userRef,
        {
          isOnline,
          lastSeen: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('사용자 상태 업데이트 오류:', error);
      throw error;
    }
  },

  // 사용자 정보 조회
  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as User;
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      throw error;
    }
  }
};

// increment는 firebase/firestore에서 가져옵니다.


