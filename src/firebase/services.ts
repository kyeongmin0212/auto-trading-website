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
  limit 
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
