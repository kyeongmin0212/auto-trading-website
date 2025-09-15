-- 자동매매 웹사이트 MySQL 마이그레이션 스키마
-- Firebase Firestore에서 MySQL로 데이터베이스 마이그레이션

-- 데이터베이스 생성 (이미 존재하는 경우 무시)
CREATE DATABASE IF NOT EXISTS auto_trading_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE auto_trading_db;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY COMMENT '사용자 ID',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT '이메일',
    password VARCHAR(255) NOT NULL COMMENT '암호화된 비밀번호',
    name VARCHAR(100) NOT NULL COMMENT '실명',
    display_name VARCHAR(100) COMMENT '표시명',
    profile_image VARCHAR(500) COMMENT '프로필 이미지 URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    last_login TIMESTAMP NULL COMMENT '마지막 로그인',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 게시물 테이블
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '게시물 ID',
    number INT NOT NULL COMMENT '게시물 번호',
    title VARCHAR(200) NOT NULL COMMENT '제목',
    content TEXT NOT NULL COMMENT '내용',
    category VARCHAR(50) DEFAULT '일반' COMMENT '카테고리',
    author VARCHAR(100) NOT NULL COMMENT '작성자',
    author_id VARCHAR(255) NOT NULL COMMENT '작성자 ID',
    views INT DEFAULT 0 COMMENT '조회수',
    likes INT DEFAULT 0 COMMENT '좋아요 수',
    comments INT DEFAULT 0 COMMENT '댓글 수',
    tags JSON DEFAULT NULL COMMENT '태그',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_category_created (category, created_at),
    INDEX idx_author_created (author_id, created_at),
    UNIQUE KEY unique_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 게시물 번호 자동 생성 트리거
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS set_post_number
BEFORE INSERT ON posts
FOR EACH ROW
BEGIN
    IF NEW.number IS NULL OR NEW.number = 0 THEN
        SET NEW.number = (SELECT COALESCE(MAX(number), 0) + 1 FROM posts);
    END IF;
END$$
DELIMITER ;

-- 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '댓글 ID',
    post_id INT NOT NULL COMMENT '게시물 ID',
    content TEXT NOT NULL COMMENT '댓글 내용',
    author VARCHAR(100) NOT NULL COMMENT '작성자',
    author_id VARCHAR(255) NOT NULL COMMENT '작성자 ID',
    parent_id INT NULL COMMENT '부모 댓글 ID (대댓글용)',
    likes INT DEFAULT 0 COMMENT '좋아요 수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 자동매매 설정 테이블
CREATE TABLE IF NOT EXISTS auto_trading_configs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '설정 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID',
    config_name VARCHAR(100) NOT NULL COMMENT '설정명',
    config_data JSON NOT NULL COMMENT '설정 데이터',
    is_active BOOLEAN DEFAULT FALSE COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_config (user_id, config_name),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 거래 로그 테이블
CREATE TABLE IF NOT EXISTS trade_logs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '로그 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID',
    symbol VARCHAR(20) NOT NULL COMMENT '거래 심볼',
    action ENUM('buy', 'sell') NOT NULL COMMENT '거래 액션',
    quantity DECIMAL(20, 8) NOT NULL COMMENT '거래 수량',
    price DECIMAL(20, 8) NOT NULL COMMENT '거래 가격',
    total_amount DECIMAL(20, 8) NOT NULL COMMENT '총 거래 금액',
    fee DECIMAL(20, 8) DEFAULT 0 COMMENT '수수료',
    profit_loss DECIMAL(20, 8) DEFAULT 0 COMMENT '손익',
    strategy_name VARCHAR(100) COMMENT '사용된 전략명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '거래일시',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol),
    INDEX idx_created_at (created_at),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '포트폴리오 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID',
    symbol VARCHAR(20) NOT NULL COMMENT '심볼',
    quantity DECIMAL(20, 8) NOT NULL COMMENT '보유 수량',
    average_price DECIMAL(20, 8) NOT NULL COMMENT '평균 매수가',
    current_price DECIMAL(20, 8) DEFAULT 0 COMMENT '현재 가격',
    total_value DECIMAL(20, 8) DEFAULT 0 COMMENT '총 평가금액',
    profit_loss DECIMAL(20, 8) DEFAULT 0 COMMENT '손익',
    profit_loss_rate DECIMAL(5, 2) DEFAULT 0 COMMENT '수익률(%)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_symbol (user_id, symbol),
    INDEX idx_user_id (user_id),
    INDEX idx_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '알림 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID',
    type ENUM('trade', 'price', 'system', 'news') NOT NULL COMMENT '알림 타입',
    title VARCHAR(200) NOT NULL COMMENT '알림 제목',
    message TEXT NOT NULL COMMENT '알림 내용',
    is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '설정 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID',
    setting_key VARCHAR(100) NOT NULL COMMENT '설정 키',
    setting_value TEXT COMMENT '설정 값',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_setting (user_id, setting_key),
    INDEX idx_user_id (user_id),
    INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 뷰 생성: 사용자 통계
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.display_name,
    u.created_at,
    COUNT(DISTINCT p.id) as post_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT tl.id) as trade_count,
    COALESCE(SUM(tl.profit_loss), 0) as total_profit_loss
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
LEFT JOIN comments c ON u.id = c.author_id
LEFT JOIN trade_logs tl ON u.id = tl.user_id
GROUP BY u.id, u.email, u.name, u.display_name, u.created_at;

-- 뷰 생성: 게시물 상세 정보
CREATE OR REPLACE VIEW post_details AS
SELECT 
    p.*,
    u.display_name as author_display_name,
    u.profile_image as author_profile_image,
    COUNT(DISTINCT c.id) as comment_count_actual
FROM posts p
LEFT JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, p.number, p.title, p.content, p.category, p.author, p.author_id, 
         p.views, p.likes, p.comments, p.tags, p.created_at, p.updated_at,
         u.display_name, u.profile_image;

-- 뷰 생성: 거래 로그 상세
CREATE OR REPLACE VIEW trade_log_details AS
SELECT 
    tl.*,
    u.name as user_name,
    u.display_name as user_display_name
FROM trade_logs tl
LEFT JOIN users u ON tl.user_id = u.id;

-- 저장 프로시저: 게시물 조회수 증가
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS IncrementPostViews(IN post_id INT)
BEGIN
    UPDATE posts SET views = views + 1 WHERE id = post_id;
END$$
DELIMITER ;

-- 저장 프로시저: 게시물 좋아요 토글
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS TogglePostLike(IN post_id INT, IN user_id VARCHAR(255))
BEGIN
    DECLARE like_count INT DEFAULT 0;
    DECLARE user_liked BOOLEAN DEFAULT FALSE;
    
    -- 사용자가 이미 좋아요를 눌렀는지 확인
    SELECT COUNT(*) INTO user_liked FROM post_likes WHERE post_id = post_id AND user_id = user_id;
    
    IF user_liked THEN
        -- 좋아요 취소
        DELETE FROM post_likes WHERE post_id = post_id AND user_id = user_id;
        UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = post_id;
    ELSE
        -- 좋아요 추가
        INSERT INTO post_likes (post_id, user_id, created_at) VALUES (post_id, user_id, NOW());
        UPDATE posts SET likes = likes + 1 WHERE id = post_id;
    END IF;
    
    -- 현재 좋아요 수 반환
    SELECT likes FROM posts WHERE id = post_id;
END$$
DELIMITER ;

-- 댓글 테이블 (post_likes 테이블이 없으므로 생성)
CREATE TABLE IF NOT EXISTS post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '좋아요 ID',
    post_id INT NOT NULL COMMENT '게시물 ID',
    user_id VARCHAR(255) NOT NULL COMMENT '사용자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_user_like (post_id, user_id),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 저장 프로시저: 댓글 추가
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS AddComment(
    IN p_post_id INT,
    IN p_content TEXT,
    IN p_author VARCHAR(100),
    IN p_author_id VARCHAR(255),
    IN p_parent_id INT
)
BEGIN
    DECLARE comment_id INT;
    
    -- 댓글 추가
    INSERT INTO comments (post_id, content, author, author_id, parent_id, created_at)
    VALUES (p_post_id, p_content, p_author, p_author_id, p_parent_id, NOW());
    
    SET comment_id = LAST_INSERT_ID();
    
    -- 게시물 댓글 수 증가
    UPDATE posts SET comments = comments + 1 WHERE id = p_post_id;
    
    SELECT comment_id as id;
END$$
DELIMITER ;

-- 저장 프로시저: 댓글 삭제
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS DeleteComment(IN comment_id INT)
BEGIN
    DECLARE p_post_id INT;
    
    -- 게시물 ID 조회
    SELECT post_id INTO p_post_id FROM comments WHERE id = comment_id;
    
    -- 댓글 삭제
    DELETE FROM comments WHERE id = comment_id;
    
    -- 게시물 댓글 수 감소
    UPDATE posts SET comments = GREATEST(comments - 1, 0) WHERE id = p_post_id;
END$$
DELIMITER ;

-- 저장 프로시저: 사용자 데이터 삭제
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS DeleteUserData(IN p_user_id VARCHAR(255))
BEGIN
    -- 관련 데이터 삭제 (외래키 제약조건으로 인해 순서 중요)
    DELETE FROM notifications WHERE user_id = p_user_id;
    DELETE FROM user_settings WHERE user_id = p_user_id;
    DELETE FROM portfolios WHERE user_id = p_user_id;
    DELETE FROM trade_logs WHERE user_id = p_user_id;
    DELETE FROM auto_trading_configs WHERE user_id = p_user_id;
    DELETE FROM post_likes WHERE user_id = p_user_id;
    DELETE FROM comments WHERE author_id = p_user_id;
    DELETE FROM posts WHERE author_id = p_user_id;
    DELETE FROM users WHERE id = p_user_id;
END$$
DELIMITER ;

-- 샘플 데이터 삽입
INSERT IGNORE INTO users (id, email, password, name, display_name, created_at) VALUES
('user_1', 'admin@example.com', 'admin123', '관리자', '관리자', NOW()),
('user_2', 'user@example.com', 'user123', '사용자', '사용자', NOW());

INSERT IGNORE INTO posts (title, content, category, author, author_id, views, likes, comments, created_at) VALUES
('환영합니다!', '자동매매 웹사이트에 오신 것을 환영합니다.', '공지', '관리자', 'user_1', 100, 10, 5, NOW()),
('첫 번째 게시물', '이것은 첫 번째 게시물입니다.', '일반', '사용자', 'user_2', 50, 3, 2, NOW());

-- 완료 메시지
SELECT 'MySQL 마이그레이션 스키마가 성공적으로 생성되었습니다!' as message;
