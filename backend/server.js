const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
// const WebSocket = require('ws'); // 未使用，已移除
require('dotenv').config();

// === lowdb 持久化 ===
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

// 1. 创建适配器
const adapter = new JSONFile('db.json');

// 2. 创建数据库实例
const db = new Low(adapter);

// 3. 初始化数据库
async function initDB() {
  await db.read();
  if (!db.data) {
    db.data = { users: [] }; // 关键：必须赋默认值
  }
  if (db.data.users.length === 0) {
    const user1 = { username: 'Cc78988', password: 'cyh123123', id: 'user1' };
    db.data.users.push(user1);
    const user2 = { username: 'admin', password: '123456', id: 'user2' };
    db.data.users.push(user2);
    const user3 = { username: 'test', password: 'test123', id: 'user3' };
    db.data.users.push(user3);
    await db.write();
  }
}
initDB();

const app = express();
const server = http.createServer(app);
// const wss = new WebSocket.Server({ server }); // 未使用，删除
const PORT = process.env.PORT || 9090;

// 中间件
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 根路径测试
app.get('/', (req, res) => {
  res.json({ message: 'JiwuChat API服务器运行正常', timestamp: new Date().toISOString() });
});

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, 'public')));

// JWT
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
// 删除未使用的 verifyToken 函数
const StatusCode = { SUCCESS: 200, TOKEN_ERR: 401, TOKEN_EXPIRED_ERR: 401, TOKEN_DEVICE_ERR: 401, STATUS_OFF_ERR: 403, NOT_FOUND: 404, SERVER_ERROR: 500 };
function successResponse(data, message = '操作成功') { return { code: StatusCode.SUCCESS, message, data }; }
function errorResponse(code, message) { return { code, message }; }

// 注册接口（持久化，含邮箱/手机号唯一性和格式校验）
app.post('/user/register', async (req, res) => {
  const { username, password, email, phone } = req.body;
  if (!username || !password) {
    return res.status(400).json(errorResponse(400, '用户名和密码不能为空'));
  }
  await db.read();
  if (db.data.users.find(u => u.username === username)) {
    return res.status(409).json(errorResponse(409, '用户名已存在'));
  }
  if (email && db.data.users.find(u => u.email === email)) {
    return res.status(409).json(errorResponse(409, '邮箱已被注册'));
  }
  if (phone && db.data.users.find(u => u.phone === phone)) {
    return res.status(409).json(errorResponse(409, '手机号已被注册'));
  }
  // 简单邮箱/手机号格式校验
  if (email && !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
    return res.status(400).json(errorResponse(400, '邮箱格式不正确'));
  }
  if (phone && !/^1\d{10}$/.test(phone)) {
    return res.status(400).json(errorResponse(400, '手机号格式不正确'));
  }
  const userId = 'user' + (db.data.users.length + 1);
  db.data.users.push({ username, password, id: userId, email, phone });
  await db.write();
  const token = generateToken(userId);
  res.json(successResponse(token, '注册成功'));
});

// 邮箱登录接口
app.post('/user/login/email', async (req, res) => {
  const { email, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.email === email && u.password === password);
  if (user) {
    const token = generateToken(user.id);
    res.json(successResponse(token, '登录成功'));
  } else {
    res.status(401).json(errorResponse(401, '邮箱或密码错误'));
  }
});

// 手机验证码存储（开发环境内存模拟）
const smsCodes = new Map(); // phone -> code

// 发送手机验证码接口（开发环境直接返回验证码）
app.get('/user/login/code/:phone', (req, res) => {
  const { phone } = req.params;
  // 生成6位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  smsCodes.set(phone, code);
  // 实际项目应调用短信服务，这里直接返回
  res.json(successResponse(code, '验证码已发送（开发环境直接返回）'));
});

// 手机号+验证码登录接口
app.post('/user/login/phone', async (req, res) => {
  const { phone, code } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.phone === phone);
  if (!user) {
    return res.status(401).json(errorResponse(401, '手机号未注册'));
  }
  const validCode = smsCodes.get(phone);
  if (code && code === validCode) {
    smsCodes.delete(phone); // 用完即删
    const token = generateToken(user.id);
    return res.json(successResponse(token, '登录成功'));
  }
  // 拆分为单语句
  return res.status(401).json(errorResponse(401, '验证码错误或已过期'));
});

// 其余API路由（略，保持原有实现即可）
// ... 你原有的其他 app.get/app.post 路由 ...

// WebSocket连接处理（略，保持原有实现即可）
// ... 你原有的 wss.on('connection', ...) 代码 ...

// 404处理（必须在最后）
app.use((req, res) => {
  res.status(404).json(errorResponse(404, '接口不存在'));
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 JiwuChat API服务器运行在 http://localhost:${PORT}`);
  console.log(`🌐 WebSocket服务运行在 ws://localhost:${PORT}`);
}); 