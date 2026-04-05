---
title: "OpenClaw 核心技术解析：多路由架构与模型配置实战"
description: "基于官方文档 v2026.04，兼顾实操与原理，详解 OpenClaw 的多 Agent 路由、模型 Failover 和安全模型"
publishDate: "2026-04-05"
tags: ["OpenClaw", "AI助手", "多智能体", "技术解析", "Gateway", "模型配置"]
---

> 基于官方文档 v2026.04，兼顾实操与原理

---

## 1. 架构概览：Gateway 是核心

OpenClaw 的设计哲学是**本地优先**——你的数据、配置、Session 都在自己机器上，Gateway 只是控制平面。

```
你的设备（Gateway） ←→ 各类消息通道（Telegram/Discord/WhatsApp...）
```

**核心组件：**

- **Gateway**：单例常驻进程，管理所有 Channel、Agent、Session、Tools、Events
- **Agent**：独立的"脑子"，有自己独立的 Workspace、Session 存储、Auth 凭证
- **Channel Adapter**：接入各个 IM 平台（支持 20+ 通道）
- **Skills**：可插拔的能力扩展包

---

## 2. 多 Agent 路由：真正的工作区隔离

这是 OpenClaw 最强大的特性之一——**每个 Agent 都是完全隔离的**。

### 什么是"一个 Agent"？

每个 Agent 有自己独立的：

| 组件 | 路径 |
|------|------|
| Workspace | `~/.openclaw/workspace-<agentId>/` |
| Auth 凭证 | `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` |
| Session 存储 | `~/.openclaw/agents/<agentId>/sessions/` |
| Skills 配置 | 从各自 workspace 加载 |

> ⚠️ Auth 凭证**不会**跨 Agent 自动共享。如果要共用，需要手动 copy `auth-profiles.json`。

### 创建新 Agent

```bash
# 一条命令创建隔离 Agent
openclaw agents add coding
openclaw agents add social

# 查看路由关系
openclaw agents list --bindings
```

### 路由绑定示例

```
Discord Bot A (token_xxx) → Agent "coding" → 代码助手 Workspace
Discord Bot B (token_yyy) → Agent "social" → 社交 Workspace
Telegram Bot C            → Agent "main"  → 主助手
```

Channel Account 与 Agent 通过 `bindings` 解耦，想加新通道？新开 account 绑上去就行，不用动 Agent 配置。

---

## 3. 模型配置：Model Failover 机制

OpenClaw 的模型层设计非常成熟，支持**多级降级**。

### 优先级链路

```
Primary Model → Fallbacks → Provider Auth Failover
```

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": [
          "openai/gpt-5.4",
          "google/gemini-2.5-flash"
        ]
      }
    }
  }
}
```

### 专用模型分工

```json
{
  "imageModel": { "primary": "anthropic/claude-sonnet-4-6" },
  "pdfModel": { "primary": "anthropic/claude-sonnet-4-6" },
  "imageGenerationModel": "minimax/image-01",
  "videoGenerationModel": "qwen/wan2.6-t2v"
}
```

### 运行时动态切换

在聊天中直接敲：

```
/model                    # 交互式选择器
/model list              # 列出所有可用模型
/model openai/gpt-5.4   # 切换到指定模型
/model status            # 查看当前模型 + auth 状态
```

---

## 4. 安全模型：DM 不是谁都能发消息

OpenClaw 默认对所有消息通道启用 **Pairing 模式**：

```
未知发送者 → 收到配对码 → 管理员 approve 后才生效
```

```bash
# 查看当前 DM 策略风险
openclaw doctor

# 审批配对请求
openclaw pairing approve <sender-id>
```

如果设置为 `dmPolicy="open"`（公开），则任何人都能发消息——**慎用**。

---

## 5. Skills：能力扩展

Skills 是 `~/.openclaw/skills/` 目录下的独立包，通过 `SKILL.md` 定义接口规范。

```bash
# 安装 skills（以 clawhub 为例）
npx clawhub@latest install <skill-name>

# 查找可用 skills
npx clawhub@latest search <keyword>
```

每个 Agent 可以有独立的 Skills 列表，也可以设置共享 baseline。

---

## 6. 快速启动（5 分钟上手）

```bash
# 1. 安装（Node 24 或 22.14+）
npm install -g openclaw@latest

# 2. 引导式初始化
openclaw onboard --install-daemon

# 3. 验证运行
openclaw gateway status

# 4. 打开控制面板
openclaw dashboard

# 5. 发条消息试试
openclaw agent --message "你好"
```

---

## 7. 官方支持通道

- 文档：https://docs.openclaw.ai
- GitHub：https://github.com/openclaw/openclaw
- Discord：https://discord.gg/clawd
- ClawHub（Skills 市场）：https://clawhub.com

---

**标签：** #OpenClaw #AI助手 #多智能体 #技术解析 #Gateway #模型配置
