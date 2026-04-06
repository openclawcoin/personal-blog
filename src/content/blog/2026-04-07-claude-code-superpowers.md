---
title: "Claude Code Superpowers：10 个超能力命令，从会用变高手"
description: "深入解析 Claude Code 的 10 个超能力命令，分入门、方法论、日常工具三层，配三种经典工作流，适合想真正用好 Claude Code 的开发者。"
publishDate: "2026-04-07"
tags: ["Claude Code", "AI 编程", "工具技巧"]
---

# Claude Code Superpowers：10 个超能力命令，从会用变高手

如果你已经在用 Claude Code，但还停留在「粘贴需求 → 等它写代码」的阶段，是时候解锁它的真正能力了。Claude Code 内置了一系列 **Superpower 命令**，组合起来可以覆盖从日常小需求到大项目拆解的完整开发流程。

这篇文章来自大数据之夏的经验总结，经过二次整理，推荐收藏。

---

## 一、先搞清楚：这些命令是什么？

Superpower 命令是 Claude Code 内置的一组技能（Skills），以 `/superpowers:xxx` 或 `/xxx` 的形式触发。它们不是普通的对话指令，而是经过设计的工作流模板——每个命令背后都对应一套标准化的 AI 协作模式。

---

## 二、10 个技能命令，分三层理解

### 第一层：入门

| 命令 | 作用 |
|---|---|
| `/using-superpowers` | 先看这个，了解有哪些能力可用 |
| `/writing-skills` | 学会后，自己写专属技能 |

**适合谁**：刚接触 Claude Code 的同学，先把这两个跑一遍，建立整体认知。

---

### 第二层：开发方法论

| 命令 | 适合场景 |
|---|---|
| `/subagent-driven-development` | 大项目拆解，多 AI 协作并行干活 |
| `/test-driven-development` | TDD 模式，先写测试再写代码 |

**适合谁**：有复杂项目需求，想建立规范开发流程的工程师。

---

### 第三层：具体执行工具（日常高频）

| 命令 | 什么时候用 |
|---|---|
| `/superpowers:brainstorm` | 需求模糊时，让 AI 发散想方案 |
| `/superpowers:write-plan` | 确定方向后，生成可执行计划 |
| `/superpowers:execute-plan` | 拿到计划后，一步步自动执行 |
| `/systematic-debugging` | 遇到 Bug，结构化排查不瞎猜 |
| `/requesting-code-review` | 写完代码，自动审查找问题 |
| `/writing-plans` | 要写技术方案，辅助输出文档 |

**适合谁**：每天都在用 Claude Code 写代码的同学，这几个命令会大幅提升效率。

---

## 三、实战：三种经典工作流

### 工作流 1：从零开发新功能（最常用）

```
需求模糊 → /superpowers:brainstorm
       ↓ 确定方向
/superpowers:write-plan
       ↓ 计划确认
/superpowers:execute-plan
```

这条链路覆盖了从想法到代码的完整闭环，每一步都可以检查和调整。

---

### 工作流 2：修复杂 Bug（救急用）

```
Bug 出现 → /systematic-debugging
        ↓ 定位根因
/superpowers:execute-plan（修复计划）
        ↓
/requesting-code-review（验证）
```

遇到线上紧急问题，用结构化排查代替瞎猜，省时间不返工。

---

### 工作流 3：大项目拆解（高手玩法）

```
大需求 → /subagent-driven-development
       ↓ 拆解任务
多 Agent 并行执行
       ↓
/requesting-code-review 统一验收
```

适合需要多人协作的大型功能或重构项目。

---

## 四、关键设计：为什么这样分层？

| 设计 | 好处 |
|---|---|
| 思考→计划→执行分离 | 每一步可检查、可调整，不盲目 |
| 可任意组合 | 小需求用单技能，大项目用全套 |
| 能自定义 | 用 `/writing-skills` 写自己的工作流 |

核心思想是 **AI 辅助而非 AI 替代**——AI 负责执行，人负责决策。

---

## 五、最小可行路径

如果今天只能记住一件事：

> 用 `/superpowers:brainstorm` + `/superpowers:write-plan` + `/superpowers:execute-plan` 这三个命令组合，覆盖 80% 的日常开发场景。

---

## 六、总结

Claude Code 的超能力命令本质上是一套**结构化 AI 协作框架**：

- **入门**：`/using-superpowers` + `/writing-skills`
- **方法论**：`/subagent-driven-development` + `/test-driven-development`
- **日常工具**：brainstorm → write-plan → execute-plan + debugging + code-review

三条工作流（从零开发 / 修 Bug / 大项目拆解）覆盖了工程开发的典型场景。掌握了这些，你用 Claude Code 的段位就不只是「使用者」，而是「操控者」了。

---

_原文来自公众号「大数据之夏」，经二次整理改编。_
