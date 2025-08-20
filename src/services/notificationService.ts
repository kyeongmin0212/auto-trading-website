// 알림 서비스
export interface NotificationConfig {
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  email: {
    enabled: boolean;
    smtpHost: string;
    smtpPort: number;
    username: string;
    password: string;
    to: string;
  };
  push: {
    enabled: boolean;
    vapidPublicKey: string;
  };
  // 추가 알림 채널들
  discord: {
    enabled: boolean;
    webhookUrl: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
  };
  line: {
    enabled: boolean;
    channelAccessToken: string;
    userId: string;
  };
}

export interface NotificationMessage {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp?: Date;
  data?: any;
}

class NotificationService {
  private config: NotificationConfig;

  constructor(config: NotificationConfig) {
    this.config = config;
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // 텔레그램 알림 전송
  async sendTelegramNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.config.telegram.enabled || !this.config.telegram.botToken || !this.config.telegram.chatId) {
      return false;
    }

    try {
      const text = this.formatTelegramMessage(message);
      const url = `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.telegram.chatId,
          text: text,
          parse_mode: 'HTML'
        })
      });

      return response.ok;
    } catch (error) {
      console.error('텔레그램 알림 전송 실패:', error);
      return false;
    }
  }

  // Discord 알림 전송
  async sendDiscordNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.config.discord.enabled || !this.config.discord.webhookUrl) {
      return false;
    }

    try {
      const embed = {
        title: message.title,
        description: message.message,
        color: this.getDiscordColor(message.type),
        timestamp: new Date().toISOString(),
        footer: {
          text: '자동매매 시스템'
        }
      };

      const response = await fetch(this.config.discord.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Discord 알림 전송 실패:', error);
      return false;
    }
  }

  // Slack 알림 전송
  async sendSlackNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.config.slack.enabled || !this.config.slack.webhookUrl) {
      return false;
    }

    try {
      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${message.title}*\n${message.message}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `자동매매 시스템 • ${new Date().toLocaleString('ko-KR')}`
            }
          ]
        }
      ];

      const response = await fetch(this.config.slack.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocks: blocks
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Slack 알림 전송 실패:', error);
      return false;
    }
  }

  // LINE 알림 전송
  async sendLineNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.config.line.enabled || !this.config.line.channelAccessToken || !this.config.line.userId) {
      return false;
    }

    try {
      const text = this.formatLineMessage(message);
      const url = 'https://api.line.me/v2/bot/message/push';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.line.channelAccessToken}`
        },
        body: JSON.stringify({
          to: this.config.line.userId,
          messages: [
            {
              type: 'text',
              text: text
            }
          ]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('LINE 알림 전송 실패:', error);
      return false;
    }
  }

  // 이메일 알림 전송 (클라이언트 사이드에서는 제한적)
  async sendEmailNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.config.email.enabled) {
      return false;
    }

    // 클라이언트 사이드에서는 이메일 전송이 제한적이므로
    // 서버 사이드에서 처리해야 함
    console.log('이메일 알림 (서버에서 처리 필요):', message);
    return false;
  }

  // 푸시 알림 전송
  async sendPushNotification(message: NotificationMessage): Promise<boolean> {
    if (!this.config.push.enabled) {
      return false;
    }

    try {
      // 브라우저 푸시 알림 API 사용
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(message.title, {
          body: message.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'trading-notification'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('푸시 알림 전송 실패:', error);
      return false;
    }
  }

  // 모든 알림 전송
  async sendNotification(message: NotificationMessage): Promise<void> {
    const promises = [
      this.sendTelegramNotification(message),
      this.sendDiscordNotification(message),
      this.sendSlackNotification(message),
      this.sendLineNotification(message),
      this.sendEmailNotification(message),
      this.sendPushNotification(message)
    ];

    await Promise.allSettled(promises);
  }

  // 거래 알림 전송
  async sendTradeNotification(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price: number,
    status: string
  ): Promise<void> {
    const message: NotificationMessage = {
      title: `거래 실행: ${side.toUpperCase()}`,
      message: `${symbol} ${side} 주문이 실행되었습니다.\n가격: ${price.toLocaleString()}원\n수량: ${amount}\n상태: ${status}`,
      type: 'success',
      data: { symbol, side, amount, price, status }
    };

    await this.sendNotification(message);
  }

  // 가격 알림 전송
  async sendPriceAlert(
    symbol: string,
    currentPrice: number,
    targetPrice: number,
    direction: 'above' | 'below'
  ): Promise<void> {
    const message: NotificationMessage = {
      title: `가격 알림: ${symbol}`,
      message: `${symbol} 가격이 ${targetPrice.toLocaleString()}원 ${direction === 'above' ? '이상' : '이하'}로 ${currentPrice.toLocaleString()}원에 도달했습니다.`,
      type: 'info',
      data: { symbol, currentPrice, targetPrice, direction }
    };

    await this.sendNotification(message);
  }

  // 시스템 알림 전송
  async sendSystemNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    const notificationMessage: NotificationMessage = {
      title,
      message,
      type
    };

    await this.sendNotification(notificationMessage);
  }

  // 오류 알림 전송
  async sendErrorNotification(
    error: string,
    context?: string
  ): Promise<void> {
    const message: NotificationMessage = {
      title: '시스템 오류',
      message: `${context ? `[${context}] ` : ''}${error}`,
      type: 'error'
    };

    await this.sendNotification(message);
  }

  // 텔레그램 메시지 포맷팅
  private formatTelegramMessage(message: NotificationMessage): string {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    return `${emoji[message.type]} <b>${message.title}</b>\n\n${message.message}\n\n⏰ ${new Date().toLocaleString('ko-KR')}`;
  }

  // LINE 메시지 포맷팅
  private formatLineMessage(message: NotificationMessage): string {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    return `${emoji[message.type]} ${message.title}\n\n${message.message}\n\n⏰ ${new Date().toLocaleString('ko-KR')}`;
  }

  // Discord 색상 매핑
  private getDiscordColor(type: string): number {
    switch (type) {
      case 'success': return 0x00ff00; // 녹색
      case 'warning': return 0xffaa00; // 주황색
      case 'error': return 0xff0000;   // 빨간색
      default: return 0x0099ff;        // 파란색
    }
  }
}

// 기본 설정
const defaultConfig: NotificationConfig = {
  telegram: {
    enabled: false,
    botToken: '',
    chatId: ''
  },
  email: {
    enabled: false,
    smtpHost: '',
    smtpPort: 587,
    username: '',
    password: '',
    to: ''
  },
  push: {
    enabled: false,
    vapidPublicKey: ''
  },
  discord: {
    enabled: false,
    webhookUrl: ''
  },
  slack: {
    enabled: false,
    webhookUrl: ''
  },
  line: {
    enabled: false,
    channelAccessToken: '',
    userId: ''
  }
};

// 싱글톤 인스턴스 생성
export const notificationService = new NotificationService(defaultConfig);

export default NotificationService;
