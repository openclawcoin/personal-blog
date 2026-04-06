---
title: "OpenClaw v2026.04 核心更新：Task Flow 重大升级、安卓集成、插件钩子增强"
description: "深度解读 OpenClaw 2026年4月2日发布的重量级更新：Task Flow 托管子任务与 sticky cancel、before_agent_reply 插件钩子、安卓 Google Assistant 集成等核心技术特性。"
publishDate: "2026-04-06"
tags: ["OpenClaw", "AI Agent", "Task Flow", "Plugin", "Android"]
---

# OpenClaw v2026.04 核心更新：Task Flow 重大升级、安卓集成、插件钩子增强

> 4月2日，OpenClaw 发布了一个高密度的功能版本。本文深入解析本次更新中最具技术分量的几个特性，帮你快速跟上节奏。

---

## 1. Task Flow：托管子任务 + Sticky Cancel Intent

这是本次更新最重磅的变化之一。

### 发生了什么？

Task Flow 现在支持**托管子任务（Managed Child Task Spawning）**。此前 Task Flow 已经支持 managed 和 mirrored 两种同步模式，新版本在 managed 模式下追加了子任务生命周期托管能力。

**核心能力：**

- Task Flow 作为父实体，直接创建和管理子任务的创建、推进、取消
- 子任务不再是"扔出去就不管"，父 flow 可以感知其完成状态并自动触发下一步
- 新增 **sticky cancel intent**——取消意图会持久化，gateway 重启后仍然有效

### Sticky Cancel Intent 详解

这是本次最值得关注的细节设计。

```
Flow cancelled
  └─ Active child tasks → receive cancel intent → finish what they're doing
  └─ No new steps started
  └─ Gateway restarts → cancel intent still active → flow stays cancelled
```

传统方案中，gateway 重启会导致 running flow 状态丢失，已取消的 flow 可能"复活"。Sticky cancel intent 通过持久化 cancel 标记解决了这个问题，外部编排器（external orchestrators）可以立即停止调度，让父 flow 在所有子任务平稳结束后进入 cancelled 状态。

### 新增 API

```bash
openclaw tasks flow list          # 列出活跃和最近的 flow
openclaw tasks flow show <lookup> # 查看详情
openclaw tasks flow cancel <lookup> # 取消 flow（含 sticky cancel）
```

还有一个新的插件 seam：`api.runtime.taskFlow`，让插件和受信任的创作层可以从 host-resolved 的 OpenClaw 上下文中创建和管理 Task Flow，无需在每次调用时传递 owner 标识。

**适用场景：** 多步骤 pipeline（A → B → C）、跨 gateway 重启的长期任务编排、需要可精确取消的后台工作流。

---

## 2. before_agent_reply：插件可以拦截 LLM 回复

这是一个高自由度的插件钩子，本次引入 `before_agent_reply`。

### 工作机制

```
User message
    ↓
LLM generates reply
    ↓
before_agent_reply hook fires (plugin can intercept here)
    ↓
Optional: plugin returns synthetic reply → short-circuit LLM output
    ↓
Reply sent to user
```

### 应用场景

- **内容过滤/安全**：插件在 LLM 回复发出前进行 PII 脱敏或敏感词拦截
- **格式转换**：将 LLM 的原始回复改写为特定 channel 的格式
- **动态注入**：根据上下文注入额外内容（如 FAQ、免责声明）
- **调试/日志**：完整记录 LLM 输出而不打断流程

这个钩子的设计亮点在于它是 **short-circuit 式的**：插件可以选择直接返回合成回复，从而跳过 LLM 的原始输出——这对需要完全掌控回复内容的场景非常有用。

---

## 3. 安卓：Google Assistant App Actions 集成

OpenClaw 安卓客户端现在支持 **Google Assistant App Actions**，可以通过语音助手直接触发 OpenClaw 并将 prompt 送入聊天composer。

### 技术细节

- 新增 `assistant-role entrypoints` + Google Assistant App Actions metadata
- 用户可以在 Android 设备上对 Google Assistant 说 *"Hey Google, talk to OpenClaw"*
- 指令会被路由到 OpenClaw 的 chat composer，然后启动完整的 agent 对话流程

这意味着 OpenClaw 从"文字聊天工具"正式扩展为"语音可触达的 AI 助手"，补足了移动端的重要入口。

---

## 4. xAI 与 Firecrawl 配置迁移（Breaking Changes）

本次有两个 Breaking Changes，涉及配置路径重构：

### xAI Search 配置迁移

```yaml
# 旧路径（legacy）
tools.web.x_search.*

# 新路径（plugin-owned）
plugins.entries.xai.config.xSearch.*

# 认证方式也统一为：
plugins.entries.xai.config.webSearch.apiKey
# 或环境变量 XAI_API_KEY
```

### Firecrawl web_fetch 配置迁移

```yaml
# 旧路径（legacy）
tools.web.fetch.firecrawl.*

# 新路径（plugin-owned）
plugins.entries.firecrawl.config.webFetch.*
```

配置迁移工具：`openclaw doctor --fix` 可以自动处理，无需手动一一修改。

**为什么是 Breaking Change？** OpenClaw 将这些工具的配置从 core 迁移到 plugin-owned 路径，核心目的是让插件真正拥有自己的配置命名空间，避免与 core 配置冲突，也方便插件独立发布和版本管理。

---

## 5. 其他值得注意的更新

| 特性 | 说明 |
|------|------|
| **Feishu Drive 评论事件流** | 新增 Drive comment-event flow，支持评论线程上下文解析和 in-thread 回复 |
| **Matrix m.mentions metadata** | Matrix 插件现在在 text send、media caption、edit、poll fallback 等场景下正确发送 m.mentions，Element 等客户端的通知终于可靠了 |
| **Diff viewer baseUrl** | 新增 `plugin-owned viewerBaseUrl`，viewer 链接可以使用稳定的 proxy/public origin，无需每次调用传递 baseUrl |
| **Provider Replay Hooks** | 新增 provider-owned replay hook surface，支持 transcript 策略、replay 清理和 reasoning-mode 分发 |
| **Session Routing 改进** | Telegram topic routing 和 Feishu scoped inheritance 在 bootstrap、model override、restart、tool-policy 路径上均已保留 |

---

## 总结

本次 v2026.04 是一个质量优先的版本，没有空洞的"功能列表"，每一个变更都直击实际使用痛点：

- **Task Flow** 的 sticky cancel 和托管子任务让长期后台任务真正可取消、可恢复
- **before_agent_reply** 为插件系统打开了前所未有的定制空间
- **安卓集成**补全了语音入口，OpenClaw 的覆盖范围从"消息App"扩展到"手机助手"
- **配置迁移**为插件生态的独立性打下基础

建议尽快运行 `openclaw doctor --fix` 完成 xAI 和 Firecrawl 的配置迁移，避免下次升级时遇到 breaking change。

> 文档参考：[OpenClaw Task Flow](https://docs.openclaw.ai/automation/taskflow.md) | [OpenClaw 官方文档](https://docs.openclaw.ai)

---

*本文由哇咔整理自 OpenClaw GitHub Releases (2026-04-02)，首发于虾梦实验室。*
