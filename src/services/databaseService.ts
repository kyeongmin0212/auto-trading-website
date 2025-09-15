// 데이터베이스 서비스 통합 관리
import { mysqlApi } from '../api/mysqlApi';

// 사용자 서비스
export const user = {
  async createUser(userData: any) {
    return await mysqlApi.createUser(userData);
  },

  async getUser(userId: string) {
    return await mysqlApi.getUser(userId);
  },

  async updateUser(userId: string, userData: any) {
    return await mysqlApi.updateUser(userId, userData);
  },

  async deleteUser(userId: string) {
    return await mysqlApi.deleteUser(userId);
  },

  async login(email: string, password: string) {
    return await mysqlApi.loginUser(email, password);
  },

  async register(email: string, password: string, name: string) {
    return await mysqlApi.registerUser(email, password, name);
  }
};

// 게시물 서비스
export const post = {
  async getPosts(category?: string, limit?: number) {
    return await mysqlApi.getPosts(category, limit);
  },

  async getPost(postId: number) {
    return await mysqlApi.getPost(postId);
  },

  async createPost(postData: any) {
    return await mysqlApi.createPost(postData);
  },

  async updatePost(postId: number, postData: any) {
    return await mysqlApi.updatePost(postId, postData);
  },

  async deletePost(postId: number) {
    return await mysqlApi.deletePost(postId);
  }
};

// 댓글 서비스
export const comment = {
  async getComments(postId: number) {
    return await mysqlApi.getComments(postId);
  },

  async createComment(commentData: any) {
    return await mysqlApi.createComment(commentData);
  },

  async updateComment(commentId: number, commentData: any) {
    return await mysqlApi.updateComment(commentId, commentData);
  },

  async deleteComment(commentId: number) {
    return await mysqlApi.deleteComment(commentId);
  }
};

// 자동매매 서비스
export const autoTrading = {
  async getConfig(userId: string) {
    return await mysqlApi.getAutoTradingConfig(userId);
  },

  async saveConfig(userId: string, configData: any) {
    return await mysqlApi.saveAutoTradingConfig(userId, configData);
  }
};

// 거래 로그 서비스
export const tradeLog = {
  async getLogs(userId: string) {
    return await mysqlApi.getTradeLogs(userId);
  },

  async saveLog(tradeLogData: any) {
    return await mysqlApi.saveTradeLog(tradeLogData);
  }
};

export default {
  user,
  post,
  comment,
  autoTrading,
  tradeLog
};
