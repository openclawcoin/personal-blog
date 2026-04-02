# Cloudflare 统一聊天后端（四平台）

这个目录提供一个可直接部署的 Cloudflare Worker：

- DeepSeek
- 千问 Qwen（阿里云百炼 OpenAI 兼容）
- 智谱 GLM
- 豆包（火山方舟）

它统一暴露一个接口：`POST /v1/chat`。
你的博客前端只请求这个接口，API Key 全放在 Worker Secrets，前端不再保存 Key。

## 一、部署步骤（Dashboard 方式）

1. 打开 Cloudflare -> Workers & Pages -> Create application -> Create Worker。
2. 进入 Worker 编辑器，把 `worker.js` 的内容整体粘贴进去。
3. 点击 Settings -> Variables and Secrets：
   - 添加 Secrets：
     - `DEEPSEEK_API_KEY`
     - `QWEN_API_KEY`
     - `ZHIPU_API_KEY`
     - `DOUBAO_API_KEY`
   - 可选添加 Secret：`PROXY_TOKEN`
   - 添加 Variable：`ALLOWED_ORIGINS`
     - 例如：`https://openclawcoin.github.io`
4. Deploy。
5. 复制 Worker 地址，例如：
   - `https://shrimp-chat-proxy.<subdomain>.workers.dev/v1/chat`

## 二、接入你的博客

改 `src/site.config.ts`：

- `chatProxy.endpoint` 填 Worker 地址（带 `/v1/chat`）
- 如果你配置了 `PROXY_TOKEN`，把 `chatProxy.token` 也填同一串值

然后重新构建并发布博客。

## 三、请求格式

前端请求体：

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "你是一个友好助手" },
    { "role": "user", "content": "你好" }
  ],
  "temperature": 0.7,
  "top_p": 1,
  "max_tokens": 1024,
  "stream": false
}
```

`provider` 可选：

- `deepseek`
- `qwen`
- `zhipu`
- `doubao`

## 四、注意事项

- 豆包模型名请以你火山方舟控制台实际可用模型/接入点为准（例如 `ep-xxxx`）。
- `PROXY_TOKEN` 放在前端只是门槛，不是强认证；建议至少配上 `ALLOWED_ORIGINS` 与调用限流。
- 建议在 Worker 里接入 Cloudflare Rate Limiting，防止盗刷额度。
