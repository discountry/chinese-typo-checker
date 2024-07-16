# 中文错别字检查器

[![版本](https://vsmarketplacebadges.dev/version/discountry.chinese-typo-checker.svg)](https://marketplace.visualstudio.com/items?itemName=discountry.chinese-typo-checker)
[![安装](https://vsmarketplacebadges.dev/installs/discountry.chinese-typo-checker.svg)](https://marketplace.visualstudio.com/items?itemName=discountry.chinese-typo-checker)
[![评级](https://vsmarketplacebadges.dev/rating-short/discountry.chinese-typo-checker.svg)](https://marketplace.visualstudio.com/items?itemName=discountry.chinese-typo-checker)

[English Readme](./README_en.md)

在 VS Code 中自动检查中文拼写错误并提供快速修复。

## 安装

[Youtube 视频简介](https://www.youtube.com/watch?v=HVVXktaCCPk)

从 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=discountry.chinese-typo-checker) 下载并安装

### 使用 ollama

ollama 是在本地运行开源语言模型的平台，下载安装 [ollama](https://ollama.com/)

安装完成后加载模型：

```bash
ollama run llama3
```

在 VS Code 中使用：

```
ctrl + shift + p
```

输入并选择 `检查中文错别字`。

![使用](./assets/usage.png)

观看魔法。

## 设置

实测本地 7b 级别的模型均无法稳定完成修改错别字的任务，理解能力不如 gpt3.5，如果你可以使用 gpt 服务，建议下载安装本插件的[0.1.7版本](https://marketplace.visualstudio.com/_apis/public/gallery/publishers/discountry/vsextensions/chinese-typo-checker/0.1.7/vspackage)

![设置](./assets/settings.png)

## 预览

![预览](./assets/trailer.gif)
