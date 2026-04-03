---
title: "从 0 到 1：把个人博客部署到 GitHub 并稳定上线（完整实操）"
description: "一篇完整记录：本地运行、SSH 推送、GitHub Pages 配置、上线排错与日常更新流程。"
pubDate: 2026-04-03
tags:
  - github
  - 部署
  - github-pages
  - astro
  - 实操
draft: false
---

这篇文章把我们这次的完整流程整理成一套可复用步骤。
目标是：把本地博客项目推到 GitHub，自动部署到 GitHub Pages，并且后续可以持续更新。

## 一、准备工作

开始之前，先确认 4 件事：

1. 你有一个 GitHub 账号。
2. 本机已经安装 Node.js（建议 LTS 版本）。
3. 项目可以在本地正常运行。
4. 你有权限创建 GitHub 仓库。

## 二、本地把项目跑起来

在项目目录执行：

```bash
npm install
npm run dev
```

本地访问开发地址（例如 `http://127.0.0.1:4321/`），先确认页面显示正常。

开发没问题后，再做生产构建检查：

```bash
npm run build
```

只要 `build` 通过，说明项目具备发布条件。

## 三、创建 GitHub 仓库

去 GitHub 新建仓库，例如：`personal-blog`。

建议：

- 仓库先保持空仓（不要勾选初始化 README）。
- 分支名用 `main`。

## 四、配置 SSH（推荐）

为了避免每次输账号密码，推荐直接走 SSH 推送。

### 1）生成 SSH 密钥

Windows PowerShell：

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

一路回车即可（或自己设置 passphrase）。

### 2）复制公钥

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

复制输出内容。

### 3）添加到 GitHub

GitHub -> `Settings` -> `SSH and GPG keys` -> `New SSH key`。

把公钥贴进去保存。

### 4）测试连接

```powershell
ssh -T git@github.com
```

看到 `Hi <yourname>!` 说明 SSH 正常。

## 五、把本地项目推到 GitHub

在项目目录执行：

```bash
git init
git add .
git commit -m "feat: initialize personal blog"
git branch -M main
git remote add origin git@github.com:<你的用户名>/<你的仓库名>.git
git push -u origin main
```

到这里代码已经上 GitHub 了。

## 六、配置 GitHub Pages 自动部署

### 1）进入仓库设置

`Settings` -> `Pages` -> `Build and deployment`

### 2）Source 选择

选择：`GitHub Actions`

### 3）确认工作流

项目里需要有部署工作流（例如）：

- `.github/workflows/deploy-pages.yml`

然后每次 push 到 `main` 都会自动触发部署。

## 七、如何看部署是否成功

### 1）看 Actions

仓库顶部 `Actions` 里找到部署工作流。

- 绿色勾：部署成功。
- 红色叉：部署失败（点进去看错误日志）。

### 2）打开线上地址

普通仓库（如 `personal-blog`）地址通常是：

`https://<你的用户名>.github.io/<仓库名>/`

例如：

`https://openclaw.github.io/personal-blog/`

## 八、自定义域名后会怎样

如果你在 Pages 绑定了自定义域名（比如 `blog.xxx.com`）：

1. 访问入口会变成你的域名。
2. 发布成功提示也应以你当前域名为准（而不是固定 `github.io`）。
3. 记得配置 DNS（CNAME）并等待解析生效。

## 九、日常更新文章的两种方式

### 方式 A：前端写作台（最快）

打开 `/write/`：

1. 填 GitHub Token + Owner + Repo + Branch。
2. 写标题、简介、标签、正文。
3. 点击发布。

系统会把文章写入：

`src/content/blog/*.md`

并自动触发 GitHub Pages 重建。

### 方式 B：本地改完再提交（更可控）

```bash
git add .
git commit -m "docs: add new blog post"
git push
```

## 十、常见问题排查

### 1）文章链接 404

优先检查：

- 是否使用了正确的 `BASE_URL`。
- 链接是否带上仓库子路径（如 `/personal-blog/`）。

### 2）Actions 失败

常见原因：

- 工作流文件路径不对。
- 分支名不是 `main`。
- 仓库设置里 Pages 不是 `GitHub Actions`。

### 3）手机端布局异常

检查媒体查询（`@media`）是否把组件隐藏或遮挡。

## 十一、推荐发布习惯

1. 每次大改前先本地 `npm run build`。
2. 提交信息写清楚（便于回溯）。
3. 线上异常先看 `Actions` 日志，不要盲改。
4. Token 最小权限、定期轮换。

---

如果你和我一样是边做边学，这套流程基本就够你稳定维护一个长期博客了。
后面再加自定义域名、Cloudflare 代理、写作工作流，都是在这套基础上自然升级。
