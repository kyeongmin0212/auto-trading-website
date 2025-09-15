const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
app.use(cors());
app.use(express.json());

// 환경 변수 확인
console.log('🔍 환경 변수 확인:');
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
console.log('MYSQL_USER:', process.env.MYSQL_USER);
console.log('MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '***설정됨***' : '설정되지 않음');
console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE);

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'notkwkd12**',
  database: process.env.MYSQL_DATABASE || 'auto_trading_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 연결 테스트
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL 데이터베이스 연결 실패:', err);
  });

// 사용자 API
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, email, name, display_name, created_at FROM users');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      'SELECT id, email, name, display_name, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, name, display_name } = req.body;
    const userId = 'user_' + Date.now();
    await pool.execute(
      'INSERT INTO users (id, email, name, display_name, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, email, name, display_name || name]
    );
    res.json({ success: true, data: { userId, email, name, display_name } });
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name, display_name } = req.body;
    await pool.execute(
      'UPDATE users SET email = ?, name = ?, display_name = ? WHERE id = ?',
      [email, name, display_name, userId]
    );
    res.json({ success: true, data: { userId, email, name, display_name } });
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 로그인 API
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' });
    }
    const [rows] = await pool.execute(
      'SELECT id, email, name, display_name FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }
    const user = rows[0];
    res.json({ success: true, data: { userId: user.id, email: user.email, name: user.name || user.display_name } });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 회원가입 API
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' });
    }
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, error: '이미 사용 중인 이메일입니다.' });
    }
    const userId = 'user_' + Date.now();
    await pool.execute(
      'INSERT INTO users (id, email, password, name, display_name) VALUES (?, ?, ?, ?, ?)',
      [userId, email, password, name, name]
    );
    res.json({ success: true, data: { userId: userId, email: email, name: name } });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 게시물 API
app.get('/api/posts', async (req, res) => {
  try {
    const { category, limit } = req.query;
    let query = 'SELECT * FROM posts';
    let params = [];
    
    if (category && category !== '전체') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const [rows] = await pool.execute(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('게시물 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute('SELECT * FROM posts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '게시물을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, category, author, author_id, tags } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO posts (title, content, category, author, author_id, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [title, content, category || '일반', author, author_id, JSON.stringify(tags || [])]
    );
    res.json({ success: true, data: { id: result.insertId, title, content, category, author, author_id } });
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;
    await pool.execute(
      'UPDATE posts SET title = ?, content = ?, category = ?, tags = ?, updated_at = NOW() WHERE id = ?',
      [title, content, category, JSON.stringify(tags || []), id]
    );
    res.json({ success: true, data: { id, title, content, category } });
  } catch (error) {
    console.error('게시물 수정 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ success: true, message: '게시물이 삭제되었습니다.' });
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 댓글 API
app.get('/api/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
      [postId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('댓글 목록 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { post_id, content, author, author_id } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO comments (post_id, content, author, author_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [post_id, content, author, author_id]
    );
    res.json({ success: true, data: { id: result.insertId, post_id, content, author, author_id } });
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    await pool.execute(
      'UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?',
      [content, id]
    );
    res.json({ success: true, data: { id, content } });
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ success: true, message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 자동매매 설정 API
app.get('/api/auto-trading/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM auto_trading_configs WHERE user_id = ?',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('자동매매 설정 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auto-trading', async (req, res) => {
  try {
    const { user_id, config_data } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO auto_trading_configs (user_id, config_data, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE config_data = ?, updated_at = NOW()',
      [user_id, JSON.stringify(config_data), JSON.stringify(config_data)]
    );
    res.json({ success: true, data: { user_id, config_data } });
  } catch (error) {
    console.error('자동매매 설정 저장 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 거래 로그 API
app.get('/api/trade-logs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM trade_logs WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('거래 로그 조회 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/trade-logs', async (req, res) => {
  try {
    const { user_id, symbol, action, quantity, price, total_amount } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO trade_logs (user_id, symbol, action, quantity, price, total_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [user_id, symbol, action, quantity, price, total_amount]
    );
    res.json({ success: true, data: { id: result.insertId, user_id, symbol, action, quantity, price, total_amount } });
  } catch (error) {
    console.error('거래 로그 저장 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📊 API 엔드포인트: http://localhost:${PORT}/api`);
});

module.exports = app;
