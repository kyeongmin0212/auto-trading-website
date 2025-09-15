// MySQL 전용 서비스 (Firebase 완전 제거)
import { mysqlApi } from '../api/mysqlApi';

// 인터페이스 정의
export interface Post {
  id: number;
  number: number;
  title: string;
  content: string;
  category: string;
  author: string;
  author_id: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  content: string;
  author: string;
  author_id: string;
  parent_id?: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  display_name: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  authorId: string;
  author: string;
  content: string;
  createdAt: string;
  timestamp: number;
  likes: number;
}

export interface AutoTradingConfig {
  id: number;
  user_id: string;
  config_name: string;
  config_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradeLog {
  id: number;
  user_id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_amount: number;
  fee: number;
  profit_loss: number;
  strategy_name?: string;
  created_at: string;
}

// 게시물 서비스
export const postService = {
  async getPosts(category?: string, limit?: number): Promise<Post[]> {
    try {
      const response = await mysqlApi.getPosts(category, limit);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('게시물 목록 조회 오류:', error);
      return [];
    }
  },

  async getPost(postId: number): Promise<Post | null> {
    try {
      const response = await mysqlApi.getPost(postId);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('게시물 조회 오류:', error);
      return null;
    }
  },

  async createPost(postData: Partial<Post>): Promise<Post | null> {
    try {
      const response = await mysqlApi.createPost(postData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('게시물 생성 오류:', error);
      return null;
    }
  },

  async updatePost(postId: number, postData: Partial<Post>): Promise<Post | null> {
    try {
      const response = await mysqlApi.updatePost(postId, postData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      return null;
    }
  },

  async deletePost(postId: number): Promise<boolean> {
    try {
      const response = await mysqlApi.deletePost(postId);
      return response.success;
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      return false;
    }
  },

  async incrementViews(postId: number): Promise<boolean> {
    try {
      // 조회수 증가는 서버에서 처리되므로 별도 API 호출 불필요
      return true;
    } catch (error) {
      console.error('조회수 증가 오류:', error);
      return false;
    }
  }
};

// 댓글 서비스
export const commentService = {
  async getComments(postId: number): Promise<Comment[]> {
    try {
      const response = await mysqlApi.getComments(postId);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('댓글 목록 조회 오류:', error);
      return [];
    }
  },

  async createComment(commentData: Partial<Comment>): Promise<Comment | null> {
    try {
      const response = await mysqlApi.createComment(commentData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('댓글 생성 오류:', error);
      return null;
    }
  },

  async updateComment(commentId: number, commentData: Partial<Comment>): Promise<Comment | null> {
    try {
      const response = await mysqlApi.updateComment(commentId, commentData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      return null;
    }
  },

  async deleteComment(commentId: number): Promise<boolean> {
    try {
      const response = await mysqlApi.deleteComment(commentId);
      return response.success;
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      return false;
    }
  }
};

// 채팅 서비스 (목업)
export const chatService = {
  async getMessages(): Promise<ChatMessage[]> {
    // 실제 구현에서는 MySQL API 호출
    return [
      {
        id: '1',
        userId: 'user_1',
        authorId: 'user_1',
        author: '관리자',
        content: '안녕하세요! 자동매매 웹사이트에 오신 것을 환영합니다.',
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        likes: 0
      }
    ];
  },

  async sendMessage(message: Partial<ChatMessage>): Promise<ChatMessage | null> {
    // 실제 구현에서는 MySQL API 호출
    return {
      id: Date.now().toString(),
      userId: message.userId || 'user_1',
      authorId: message.authorId || 'user_1',
      author: message.author || '사용자',
      content: message.content || '',
      createdAt: new Date().toISOString(),
      timestamp: Date.now(),
      likes: 0
    };
  }
};

// 사용자 서비스 (목업)
export const userService = {
  async getOnlineUsers(): Promise<User[]> {
    // 실제 구현에서는 MySQL API 호출
    return [
      {
        id: 'user_1',
        email: 'admin@example.com',
        name: '관리자',
        display_name: '관리자',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
    ];
  },

  async updateUserStatus(userId: string, isOnline: boolean): Promise<boolean> {
    // 실제 구현에서는 MySQL API 호출
    return true;
  }
};

// 자동매매 서비스
export const autoTradingService = {
  async getConfig(userId: string): Promise<AutoTradingConfig | null> {
    try {
      const response = await mysqlApi.getAutoTradingConfig(userId);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('자동매매 설정 조회 오류:', error);
      return null;
    }
  },

  async saveConfig(userId: string, configData: any): Promise<AutoTradingConfig | null> {
    try {
      const response = await mysqlApi.saveAutoTradingConfig(userId, configData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('자동매매 설정 저장 오류:', error);
      return null;
    }
  }
};

// 거래 로그 서비스
export const tradeLogService = {
  async getLogs(userId: string): Promise<TradeLog[]> {
    try {
      const response = await mysqlApi.getTradeLogs(userId);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('거래 로그 조회 오류:', error);
      return [];
    }
  },

  async saveLog(tradeLogData: Partial<TradeLog>): Promise<TradeLog | null> {
    try {
      const response = await mysqlApi.saveTradeLog(tradeLogData);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('거래 로그 저장 오류:', error);
      return null;
    }
  }
};

// 사용자 정보 서비스
export const userInfoService = {
  async saveUserInfo(userId: string, email: string, name: string): Promise<boolean> {
    try {
      const response = await mysqlApi.createUser({ id: userId, email, name, display_name: name });
      return response.success;
    } catch (error) {
      console.error('사용자 정보 저장 오류:', error);
      return false;
    }
  },

  async getUserInfo(userId: string): Promise<User | null> {
    try {
      const response = await mysqlApi.getUser(userId);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('사용자 정보 조회 오류:', error);
      return null;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const response = await mysqlApi.deleteUser(userId);
      return response.success;
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      return false;
    }
  },

  async saveUserSettings(userId: string, settings: any): Promise<boolean> {
    // 실제 구현에서는 MySQL API 호출
    return true;
  },

  async getUserSettings(userId: string): Promise<any> {
    // 실제 구현에서는 MySQL API 호출
    return {};
  },

  async saveAutoTradingConfig(userId: string, configData: any): Promise<boolean> {
    try {
      const response = await mysqlApi.saveAutoTradingConfig(userId, configData);
      return response.success;
    } catch (error) {
      console.error('자동매매 설정 저장 오류:', error);
      return false;
    }
  },

  async getAutoTradingConfig(userId: string): Promise<AutoTradingConfig | null> {
    try {
      const response = await mysqlApi.getAutoTradingConfig(userId);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('자동매매 설정 조회 오류:', error);
      return null;
    }
  },

  async saveTradeLog(userId: string, tradeLogData: any): Promise<boolean> {
    try {
      const response = await mysqlApi.saveTradeLog({ ...tradeLogData, user_id: userId });
      return response.success;
    } catch (error) {
      console.error('거래 로그 저장 오류:', error);
      return false;
    }
  },

  async getUserTradeLogs(userId: string): Promise<TradeLog[]> {
    try {
      const response = await mysqlApi.getTradeLogs(userId);
      return response.success ? response.data || [] : [];
    } catch (error) {
      console.error('사용자 거래 로그 조회 오류:', error);
      return [];
    }
  }
};

// Firebase 호환성을 위한 래퍼 함수들
export const getUserInfo = userInfoService.getUserInfo;
export const saveUserInfo = userInfoService.saveUserInfo;
export const deleteUserData = userInfoService.deleteUser;
export const saveUserSettings = userInfoService.saveUserSettings;
export const getUserSettings = userInfoService.getUserSettings;
export const saveAutoTradingConfig = userInfoService.saveAutoTradingConfig;
export const getAutoTradingConfig = userInfoService.getAutoTradingConfig;
export const saveTradeLog = userInfoService.saveTradeLog;
export const getUserTradeLogs = userInfoService.getUserTradeLogs;

export default {
  postService,
  commentService,
  chatService,
  userService,
  autoTradingService,
  tradeLogService,
  userInfoService
};
