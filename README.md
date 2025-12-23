# AI 你画我猜

在线你画我猜小游戏：在画布上绘画，后端调用 Gemini API 识别你的作品。

## 运行

1. 安装 Node.js 18+
2. 安装依赖
   ```bash
   npm install
   ```
3. 配置环境变量
   ```bash
   cp .env.example .env.local
   ```
4. 启动开发服务器
   ```bash
   npm run dev
   ```

## 说明

- 技术栈：Next.js（App Router）
- 后端直接通过 `fetch` 调用 Gemini REST API，无任何 SDK
- 接口：`POST /api/guess`

