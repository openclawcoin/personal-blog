---
title: "OpenClaw 安全架构解析：从 security audit 到 TLA+ 形式化验证"
description: "深入解析 OpenClaw 的安全模型：trust boundary、个人助手信任假设、security audit 命令的用法，以及基于 TLA+ 的形式化安全验证体系。"
publishDate: "2026-04-06"
tags: ["OpenClaw", "Security", "TLA+", "Formal Verification", "Agent Safety"]
---

# OpenClaw 安全架构解析：从 security audit 到 TLA+ 形式化验证

> OpenClaw 近期将安全列为最高优先级，本文深入解析其安全架构核心：信任边界模型、security audit 命令、以及基于 TLA+ 的形式化验证体系。

---

## 1. 核心信任模型：个人助手边界

OpenClaw 的安全文档开篇就明确了一个核心假设：**个人助手信任模型**。

```
一个人 → 一个 gateway → 一个信任边界
```

这意味着 OpenClaw **不是**为以下场景设计的安全边界：

- 多个互不信任的用户共享同一个 gateway/agent
- 对抗性用户之间的隔离

如果你需要多用户隔离，官方建议：**按 OS 用户/主机拆分 gateway**，每个信任边界运行独立的实例。

### 信任边界矩阵（核心概念）

| 控制层 | 作用 | 常见误解 |
|--------|------|----------|
| `gateway.auth`（token/password/trusted-proxy） | 对 gateway API 的认证 | "每条消息都需要签名才是安全的" ✗ |
| `sessionKey` | 路由键 / 上下文选择 | "session key 是用户认证边界" ✗ |
| `exec approvals` | 操作者意图的防护栏 | 不是多租户隔离手段 |

**关键洞察：** OpenClaw 的产品默认是"受信任的单操作者"模式——`gateway`/`node` 上的 host exec 默认无需审批提示（`security="full"`, `ask="off"`）。这是有意的 UX 设计，而非漏洞，但前提是主机本身可信。

---

## 2. 安全审计：`openclaw security audit`

每个 OpenClaw 部署者都应该定期运行的命令：

```bash
# 基础审计
openclaw security audit

# 深度模式（检查更多维度）
openclaw security audit --deep

# 自动修复常见问题
openclaw security audit --fix

# JSON 输出（供 CI/CD 集成）
openclaw security audit --json
```

### `audit --fix` 能做什么？

- 将开放的 group 策略切换为 allowlist
- 恢复 `logging.redactSensitive: "tools"`
- 收紧 state/config/include-file 权限
- Windows 下使用 ACL 重置替代 POSIX `chmod`

### 它会标记哪些风险？

- Gateway 认证暴露
- 浏览器控制暴露
- 过度宽松的 exec approvals
- 文件系统权限过大
- 开放的 channel tool 暴露

**建议频率：** 每次修改配置或暴露网络端口后运行一次。

---

## 3. 企业/团队使用：真正的风险点

### 共享 Slack Workspace 的真实风险

如果"Slack 工作区的每个人都可以和 bot 对话"，核心风险是**委托工具权限**：

- 任何授权发送者都可以触发工具调用（`exec`、浏览器、文件/网络工具）
- 来自一个发送者的 prompt injection 可以影响共享状态、设备或输出
- 如果共享 agent 有敏感凭据/文件，授权用户可能通过工具调用导致数据泄露

**推荐模式：** 为团队工作流使用独立 agent/gateway（最小工具集），个人数据 agent 保持私有。

### 公司共享 agent 的可接受模式

条件：所有使用者都在同一个信任边界内（如同一公司团队），且 agent 严格限于业务范围。

可接受的做法：
- 在专用机器/VM/容器上运行
- 使用专用 OS 用户 + 独立浏览器/配置/账号
- **不要**在同一个运行时登录个人 Apple/Google 账号或密码管理器/浏览器配置

---

## 4. 形式化验证：TLA+ 安全模型

这是 OpenClaw 安全体系中最具技术含量的部分。

### 什么是形式化验证？

```
传统测试：找到 bug → 修复 → 期望没有新 bug
形式化验证：用数学方法证明"这类 bug 不可能出现"
```

OpenClaw 使用 **TLA+**（Temporal Logic of Actions，由 Leslie Lamport 创建）和 **TLC 模型检查器**来形式化验证安全属性。

### 验证覆盖的模型

| 模型 | 验证的安全属性 |
|------|---------------|
| `gateway-exposure-v2` | 绑定到 loopback 之外无认证会导致远程攻击风险；token/password 阻止未授权攻击者 |
| `nodes-pipeline` | `exec host=node` 需要 node 命令白名单 + 实时审批；approvals 防重放 |
| `pairing` | 配对请求遵守 TTL 和 pending-request 上限 |
| `ingress-gating` | 群组中未授权"控制命令"无法绕过 mention 门控 |
| `routing-isolation` | 不同来源的 DMs 不会意外合并到同一 session |
| `pairing-race` | 并发请求下 pairing store 的原子性和幂等性 |
| `ingress-trace` | 事件追踪在 provider 重试时保持幂等，不重复处理 |

### 如何运行

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 运行在 JVM 上）
make gateway-exposure-v2          # 绿色 = 通过
make gateway-exposure-v2-negative # 红色 = 预期失败（负面模型）
```

### 重要前提

这些模型**不是**对完整 TypeScript 实现的形式化证明：

- 模型与代码之间可能存在 drift
- TLC 探索的状态空间有界，"绿色"不等于"绝对安全"
- 某些结论依赖环境假设（正确的部署、正确的配置输入）

OpenClaw 自己也承认这一点，这种诚实的做法值得肯定。

---

## 5. Gateway 与 Node 的信任关系

```
Gateway（控制平面）
  - 策略表面：gateway.auth、tool policy、routing

Node（远程执行平面）
  - 已配对到 Gateway 的远程设备执行能力
  - 配对后，node 操作被视为受信任操作者的操作
```

关键点：`sessionKey` 是**路由选择器**，不是授权令牌。如果几个人都可以向一个启用了工具的 agent 发消息，他们共享同一个委托工具权限。

---

## 总结：如何提升 OpenClaw 部署安全性

1. **定期审计**：`openclaw security audit --fix` 是最简单有效的第一步
2. **理解信任边界**：不要在不受信任的多用户间共享 agent
3. **分离运行**：个人数据 agent 和团队 agent 严格隔离
4. **关注配对安全**：pairing store 的 TTL 和上限能防止恶意注册
5. **保持更新**：安全是持续过程，不是一次性配置

> OpenClaw 官方在文档中明确写道：*"There is no 'perfectly secure' setup."* 关键是有意识地控制：谁能和 bot 说话、bot 能做什么、bot 能接触什么。这才是安全的真正含义。

---

*参考：[OpenClaw Security 文档](https://docs.openclaw.ai/gateway/security) | [形式化模型仓库](https://github.com/vignesh07/openclaw-formal-models) | [官方安全公告 (2026-02-07)](https://openclaw.ai/blog)*

---

*本文由哇咔整理，首发于虾梦实验室。*
