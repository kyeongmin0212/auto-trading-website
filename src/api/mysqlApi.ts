// MySQL API 클라이언트
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class MySQLApi {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API 요청 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      };
    }
  }

  // 사용자 API
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/users');
  }

  async getUser(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`);
  }

  async createUser(userData: any): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async loginUser(email: string, password: string): Promise<ApiResponse<any>> {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async registerUser(email: string, password: string, name: string): Promise<ApiResponse<any>> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  // 게시물 API
  async getPosts(category?: string, limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/posts?${queryString}` : '/posts';
    return this.request(endpoint);
  }

  async getPost(postId: number): Promise<ApiResponse<any>> {
    return this.request(`/posts/${postId}`);
  }

  async createPost(postData: any): Promise<ApiResponse<any>> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updatePost(postId: number, postData: any): Promise<ApiResponse<any>> {
    return this.request(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deletePost(postId: number): Promise<ApiResponse<any>> {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // 댓글 API
  async getComments(postId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/comments/${postId}`);
  }

  async createComment(commentData: any): Promise<ApiResponse<any>> {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async updateComment(commentId: number, commentData: any): Promise<ApiResponse<any>> {
    return this.request(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(commentId: number): Promise<ApiResponse<any>> {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // 자동매매 설정 API
  async getAutoTradingConfig(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/auto-trading/${userId}`);
  }

  async saveAutoTradingConfig(userId: string, configData: any): Promise<ApiResponse<any>> {
    return this.request('/auto-trading', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, config_data: configData }),
    });
  }

  // 거래 로그 API
  async getTradeLogs(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/trade-logs/${userId}`);
  }

  async saveTradeLog(tradeLogData: any): Promise<ApiResponse<any>> {
    return this.request('/trade-logs', {
      method: 'POST',
      body: JSON.stringify(tradeLogData),
    });
  }
}

export const mysqlApi = new MySQLApi();
export default mysqlApi;
