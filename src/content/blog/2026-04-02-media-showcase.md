---
title: "图文音视频发布演示"
description: "演示在博客正文中插入图片、音频和视频"
pubDate: 2026-04-02
tags:
  - showcase
  - media
  - notes
draft: false
---

这篇文章用来演示：图片、音乐、视频都能直接写进 BLOG。

## 1) 图片示例

<figure class="media-block">
  <img src="/media/shrimp-lab.svg" alt="虾梦实验室示例图" loading="lazy" />
  <figcaption>这张图是放在 `public/media/shrimp-lab.svg` 的本地图片。</figcaption>
</figure>

## 2) 音频示例

<figure class="media-block">
  <audio controls preload="metadata">
    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3" type="audio/mpeg" />
    你的浏览器暂不支持 audio。
  </audio>
  <figcaption>可替换为你自己的音频：例如 `/media/your-song.mp3`。</figcaption>
</figure>

## 3) 视频示例

<figure class="media-block">
  <video controls playsinline preload="metadata" poster="/media/shrimp-lab.svg">
    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
    你的浏览器暂不支持 video。
  </video>
  <figcaption>可替换为你自己的视频：例如 `/media/your-video.mp4`。</figcaption>
</figure>

## 日常更新建议

1. 媒体文件先放到 `public/media/`。
2. 写文章时直接用绝对路径，比如 `/media/xxx.mp4`。
3. 发布前在本地打开文章页确认能播放即可。
