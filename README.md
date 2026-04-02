# Personal Blog (Astro)

## 快速开始

```bash
npm install
npm run dev
npm run build
```

## 首页聊天框（Cloudflare 统一后端）

当前首页聊天框只负责前端 UI，不再在前端保存任何模型 API Key。

支持平台：

- DeepSeek
- 千问 Qwen
- 智谱 GLM
- 豆包 Doubao

前端配置位置：

- `src/site.config.ts`
  - `chatProxy.endpoint`：你的 Worker 地址（例如 `https://xxx.workers.dev/v1/chat`）
  - `chatProxy.token`：可选，对应 Worker 的 `PROXY_TOKEN`

Worker 模板在：

- `cloudflare/chat-proxy/worker.js`
- `cloudflare/chat-proxy/wrangler.toml.example`
- `cloudflare/chat-proxy/README.md`

### Cloudflare 最短部署步骤

1. Cloudflare -> Workers & Pages -> Create Worker。
2. 复制 `cloudflare/chat-proxy/worker.js` 到 Worker 编辑器。
3. 在 Worker Settings -> Variables and Secrets 添加：
   - Secrets：`DEEPSEEK_API_KEY`、`QWEN_API_KEY`、`ZHIPU_API_KEY`、`DOUBAO_API_KEY`
   - 可选 Secret：`PROXY_TOKEN`
   - Variable：`ALLOWED_ORIGINS`（例如 `https://openclawcoin.github.io`）
4. Deploy，得到 `https://xxx.workers.dev/v1/chat`。
5. 把这个地址填进 `src/site.config.ts` 的 `chatProxy.endpoint`。
6. 重新发布博客。

## 前端写作台（`/write/`）

打开 `/write/` 后可直接发布 Markdown 到 GitHub 仓库。

必填项：

- GitHub Token（建议 Fine-grained Token）
- repo owner
- repo name
- branch

写入目标：

- `src/content/blog/YYYY-MM-DD-title.md`

Token 最小权限：

- Repository `Contents: Read and write`

## 部署到 GitHub Pages

1. 在 GitHub 创建仓库。
2. 把项目推送到 `main` 分支。
3. 仓库 `Settings` -> `Pages` -> `Build and deployment` -> Source 选择 `GitHub Actions`。
4. 每次 push 到 `main`，`.github/workflows/deploy-pages.yml` 会自动构建发布。

说明：

- 仓库名是 `yourname.github.io`：站点 URL 为 `https://yourname.github.io/`
- 普通仓库名（如 `personal-blog`）：站点 URL 为 `https://yourname.github.io/personal-blog/`
