# JiwuChat API服务器

这是一个为JiwuChat应用提供API服务的Express服务器。

## 功能特性

- ✅ 用户认证和授权
- ✅ 聊天消息管理
- ✅ 好友系统
- ✅ 群组管理
- ✅ 社区帖子
- ✅ 用户钱包
- ✅ 文件上传
- ✅ 翻译工具
- ✅ 设备管理
- ✅ 账单系统

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务器

开发模式（自动重启）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

### 3. 访问API

服务器将在 `http://localhost:9090` 启动

## API接口列表

### 认证相关
- `POST /user/login/pwd/all` - 用户名密码登录
- `POST /user/login/email` - 邮箱登录
- `POST /user/login/phone` - 手机号登录
- `POST /user/register` - 用户注册

### 用户信息
- `GET /user/info` - 获取用户信息
- `PUT /user/info` - 更新用户信息
- `PUT /user/pwd` - 修改密码

### 聊天功能
- `GET /chat/contact/list/:cursor/:size` - 获取联系人列表
- `GET /chat/message/list/:cursor/:size` - 获取消息列表
- `POST /chat/message` - 发送消息

### 好友系统
- `GET /chat/user/friend/list/:cursor/:size` - 获取好友列表
- `POST /chat/user/friend/apply` - 申请好友
- `GET /chat/user/friend/apply/list/:cursor/:size` - 获取好友申请列表

### 群组管理
- `GET /chat/group/list/:cursor/:size` - 获取群组列表
- `POST /chat/group` - 创建群组
- `GET /chat/group/member/:groupId/:cursor/:size` - 获取群成员

### 社区功能
- `POST /community/post/list/:page/:size` - 获取帖子列表
- `GET /community/post/:id` - 获取帖子详情
- `POST /community/post` - 发布帖子

### 系统配置
- `GET /res/oss/constant` - 获取OSS配置
- `GET /res/app/latest` - 获取最新版本信息

## 测试账号

- 用户名：`admin`
- 密码：`123456`

## 响应格式

所有API都返回统一的响应格式：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

## 认证

需要认证的接口需要在请求头中包含 `Authorization` token：

```
Authorization: <your-jwt-token>
```

## 开发说明

这是一个模拟服务器，数据存储在内存中，重启后数据会丢失。在生产环境中，你需要：

1. 连接真实的数据库
2. 实现完整的业务逻辑
3. 添加数据验证
4. 实现WebSocket支持
5. 添加文件上传功能
6. 实现缓存机制

## 许可证

ISC 