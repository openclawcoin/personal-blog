# Personal Blog (Astro)

## Static Deploy Mode

This project is pure static output.

```bash
npm install
npm run dev
npm run build
```

## Home Chat Box (Simple UI)

Only the home page (`/`) shows the chat box.
The UI keeps only:

- provider switch
- model switch
- message input + send

No advanced parameters are exposed.

Official endpoints used:

- DeepSeek: `https://api.deepseek.com/v1/chat/completions`
- Qwen (DashScope): `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- Doubao (Ark): `https://ark.cn-beijing.volces.com/api/v3/chat/completions`

Set your keys in:

- `src/components/ChatSidebar.astro`

Fields to fill:

- `PROVIDERS.deepseek.apiKey`
- `PROVIDERS.qwen.apiKey`
- `PROVIDERS.doubao.apiKey`

Important:

- In static frontend mode, keys are visible to users.
- Free quota / free model availability depends on provider policy and may change.
- Some providers may restrict browser direct calls by CORS/security policy.

## Frontend Writer (`/write/`)

You can open `/write/` and publish a Markdown post directly to GitHub from browser.

Required inputs on page:

- GitHub token (recommended fine-grained token)
- repo owner
- repo name
- branch

Write target:

- `src/content/blog/YYYY-MM-DD-title.md`

After publish:

- a commit is created in your repo
- your static host rebuilds and the post goes live

Token permission (minimum):

- Repository `Contents: Read and write`

## Deploy to GitHub Pages (Simple Steps)

1. Create a repository on GitHub.
2. Upload this project to branch `main`.
3. In GitHub repo settings:
   - `Settings` -> `Pages` -> `Build and deployment`
   - Source: `GitHub Actions`
4. Push to `main` branch. Workflow `.github/workflows/deploy-pages.yml` will build and deploy automatically.
5. Wait for workflow success, then open your Pages URL.

Notes:

- If repo name is `yourname.github.io`, site URL is `https://yourname.github.io/`
- If repo name is normal project (for example `personal-blog`), site URL is `https://yourname.github.io/personal-blog/`
