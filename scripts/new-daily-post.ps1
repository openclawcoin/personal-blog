param(
  [string]$Title = "今日记录",
  [string]$Description = "今天更新摘要。",
  [string[]]$Tags = @("日更"),
  [string]$Slug = "",
  [switch]$Publish
)

$ErrorActionPreference = "Stop"

function Normalize-Slug([string]$Value) {
  $result = $Value.Trim().ToLowerInvariant()
  $result = $result -replace "\s+", "-"
  $result = $result -replace "[^\p{L}\p{Nd}\-]", ""
  $result = $result -replace "-{2,}", "-"
  return $result.Trim("-")
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$contentDir = Join-Path $projectRoot "src\content\blog"
if (-not (Test-Path $contentDir)) {
  New-Item -ItemType Directory -Force -Path $contentDir | Out-Null
}

$date = Get-Date
$dateText = $date.ToString("yyyy-MM-dd")

$baseSlug = if (-not [string]::IsNullOrWhiteSpace($Slug)) { $Slug } else { $Title }
$slug = Normalize-Slug $baseSlug
if ([string]::IsNullOrWhiteSpace($slug)) {
  $slug = "post-" + $date.ToString("yyyyMMdd-HHmmss")
}

$baseName = "$dateText-$slug"
$fileName = "$baseName.md"
$filePath = Join-Path $contentDir $fileName
$index = 2
while (Test-Path $filePath) {
  $fileName = "$baseName-$index.md"
  $filePath = Join-Path $contentDir $fileName
  $index++
}

$normalizedTags = @()
foreach ($tag in $Tags) {
  if ($null -eq $tag) { continue }
  $parts = $tag -split "[,，]"
  foreach ($part in $parts) {
    $clean = $part.Trim()
    if (-not [string]::IsNullOrWhiteSpace($clean)) {
      $normalizedTags += $clean
    }
  }
}
if ($normalizedTags.Count -eq 0) {
  $normalizedTags = @("日更")
}

$draftValue = if ($Publish.IsPresent) { "false" } else { "true" }
$tagBlock = ($normalizedTags | ForEach-Object { "  - $_" }) -join "`r`n"

$template = @"
---
title: "$Title"
description: "$Description"
pubDate: $dateText
tags:
$tagBlock
draft: $draftValue
---

今天完成了：

- 

遇到的问题：

- 

下一步：

- 
"@

Set-Content -LiteralPath $filePath -Encoding UTF8 -Value $template
Write-Output "Created: $filePath"
Write-Output "Slug: $($fileName -replace '\.md$','')"
Write-Output "Draft: $draftValue"
