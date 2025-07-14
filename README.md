<div align=center>
 <div align=center margin="10em" style="margin:4em 0 0 0;font-size: 30px;letter-spacing:0.3em;">
<img src="./" width="140px" height="140px" alt="图片名称" align=center />
 </div>
 <h2 align=center style="margin: 2em 0;">语灵聊天 APP</h2>

<div>
      <a href="https://github.com/Kiwi233333/jiwu-mall-chat-tauri" target="_blank">
        <img class="disabled-img-view" src="https://img.shields.io/badge/Github-项目地址-blueviolet.svg?style=plasticr" alt="项目地址" >
      </a>
      <a href="https://github.com/Yeye78988/jiwu-mall-chat-tauri/stargazers" target="_blank">
      </a>
    </div>
      <a href="`https://github.com/Kiwi233333/jiwu-mall-chat-tauri/blob/main/LICENSE`" target="_blank">
          <img class="disabled-img-view" alt="License"
          src="https://img.shields.io/github/license/Kiwi233333/jiwu-mall-chat-tauri">
      </a>
      <a href="https://app.netlify.com/sites/jiwuchat/deploys" target="_blank">
          <img src="https://api.netlify.com/api/v1/badges/b68ad9ac-53e5-4c5a-ac56-a8882ffe7697/deploy-status" alt="+QQ群"/>
      </a>
      <a href="https://qm.qq.com/q/iSaETNVdKw" target="_blank">
        <img src="https://img.shields.io/badge/QQ群:939204073 -blue?logo=tencentqq&logoColor=white" alt="QQ群"/>
      </a>
    </div>
    <div>
      <a href="https://www.deepseek.com/" target="_blank" style="margin: 2px;">
        <img alt="DeepSeek AI" src="https://github.com/deepseek-ai/DeepSeek-V2/blob/main/figures/badge.svg?raw=true" />
      </a>
    </div>



## 🌌 系统功能

![Modules](.doc/JiwuChat%20功能导图.png)

<details>
  <summary>功能表格【展开/折叠】</summary>

| 模块 | 子模块 | 功能描述 | 是否达成 |
|------|--------|----------|----------|
| 用户模块 | 账户管理 | 用户注册、登录、历史登录账号选择 | ✅ |
|  | 账号安全 | 邮箱/手机号绑定提醒、设备管理、账号安全验证 | ✅ |
| 消息模块 | 基础聊天 | 文本消息、图片消息、视频消息、文件上传、消息撤回、消息已读状态 | ✅ |
|  | 数据同步 | 多设备消息同步、阅读状态同步 | ✅ |
|  | 高级聊天 | 消息引用回复、@提及功能、公告、撤回消息重新编辑 | ✅ |
| 会话模块 | 会话管理 | 会话列表、置顶会话、隐藏会话、会话未读数统计、会话排序 | ✅ |
| 群聊模块 | 群聊操作 | 创建群聊、退出群聊、查看群聊详情 | ✅ |
|  | 群成员管理 | 群成员管理、设置管理员、撤销管理员、获取@列表 | ✅ |
| 联系人模块 | 好友操作 | 好友申请、好友搜索、好友列表、拒绝好友申请、删除好友 | ✅ |
|  | 资料与通知 | 好友详情查看、申请未读数统计 | ✅ |
| AI模块 | 对话功能 | 私聊AI、群聊AI、多AI同时聊天 | ✅ |
|  | 模型管理 | 支持Gmini、Kimi AI、DeepSeek、硅基流动等多厂商模型、模型列表、token计算 | ✅ |
|  | 广场功能 | AI机器人广场展示 | ✅ |
| 通讯模块 | 音视频通话 | 基于WebRtc的语音通话、视频通话、屏幕共享 | ✅ |
|  | 通话记录 | 通话状态更新、挂断记录 | ✅ |
| 通知系统 | 消息通知 | 桌面通知、系统托盘提醒、铃声设置、消息免打扰 | ✅ |
| 扩展功能 | 综合集成 | 商城集成、博客集成、更新日志面板 | ✅ |
| 其他模块 | 其他功能 | 聊天社交功能、AI购物功能、文件下载管理、翻译工具（AI翻译/腾讯翻译）功能 | ✅ |
|  | 文件与播放 | 图片预览器、视频播放器、文件下载、批量图片上传 | ✅ |
|  | 主题配置 | 深浅色主题切换、系统主题跟随、字体设置、自适应布局 | ✅ |
|  | 平台兼容 | Windows、MacOS、Linux、Android、Web端适配 | ✅ |

</details>

## ⏳ 起步

### 📦 安装依赖

```sh
# node 版本 >= 18
npm install -g pnpm

pnpm install
```

### ✨ 开发

- 详细操作文档可查看 [Run.md](./Run.md)

- 📌 若`没有`后端服务，修改`.env.development`环境变量，或使用`.env.production`配置文件。

```sh
# 终端1：启动nuxt (发布环境)
pnpm run prod:nuxt
# 终端2：启动tauri
pnpm run dev:tauri
```

- 若`有`后端服务，可采用自定义修改开发`.env.development`环境变量文件进行开发

```sh
# 建议分开运行
# 终端1：启动nuxt
pnpm run dev:nuxt
# 终端2：启动tauri
pnpm run dev:tauri
```

### 📦 打包

```sh
pnpm run build:tauri
```

### ❌ pnpm install error

查看源

```sh
pnpm get registry
```

临时修改

```sh
pnpm --registry https://registry.npm.taobao.org install any-touch
```

持久使用

```sh
pnpm config set registry https://registry.npm.taobao.org
```

还原

```sh
pnpm config set registry https://registry.npmjs.org
```

## 🔧 涉及技术栈 | Tech Stack

| 类别         | 技术/组件          | 版本号       |
| ------------- | ------------------ | ------------ |
| 框架         | Nuxt             | ^3.14.159+       |
|                 | Tauri               | ^2.1.0        |
| UI 组件库     | Element Plus       | ^2.8.4        |
| 状态管理     | Pinia              | 2.1.7        |
| 工具库       | Vueuse             | 10.11.0      |
| 构建与开发工具 | Nuxi               | lts        |
|              | Vite               | lts         |
| 代码质量     | ESLint             | 8.56.0       |
|              | Prettier           | 3.3.2        |
| 类型检查     | TypeScript         | 5.3.2        |
| 样式处理     | Sass               | 1.77.6       |



