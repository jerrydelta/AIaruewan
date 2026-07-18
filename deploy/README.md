# 自动部署系统 - 使用指南

## 系统架构

```
生成工厂 (Layer 2)
    ↓
自动部署脚本 (Layer 3)
    ↓
GitHub仓库
    ↓
Vercel自动部署
    ↓
公网可访问的AI工具
```

## 快速开始（3步）

### 步骤1：创建GitHub仓库

1. 访问 https://github.com/new
2. 仓库名：`handmade-ai-tools`
3. 选择 **Public**
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 "Create repository"

### 步骤2：运行设置脚本

双击运行 `deploy/setup_github.bat`，按提示操作。

### 步骤3：配置Vercel自动部署

1. 访问 https://vercel.com/new
2. 选择刚创建的GitHub仓库 `handmade-ai-tools`
3. Vercel会自动检测 `vercel.json` 配置
4. 点击 "Deploy"
5. 等待2-3分钟，部署完成！

## 自动化工作流

### 每日自动部署（推荐）

在自动化任务中添加：

```yaml
名称: 每日自动部署
时间: 每天 10:30（生成工厂完成后）
脚本: python deploy/auto_deploy.py
```

### 手动部署

```bash
cd /d/WB工作学习记录文档/海外生意怎么做/手搓应用
python deploy/auto_deploy.py
```

## 文件说明

- `vercel.json` - Vercel部署配置
- `deploy/setup_github.bat` - GitHub仓库设置脚本（Windows）
- `deploy/auto_deploy.py` - 自动部署Python脚本
- `deploy/README.md` - 本文件

## 常见问题

### Q: 部署后多久能访问？

A: Vercel部署通常需要2-3分钟。部署完成后，会在 `https://handmade-ai-tools.vercel.app` 自动生效。

### Q: 如何更新已部署的工具？

A: 只需再次运行 `auto_deploy.py`，脚本会自动检测变更并推送。

### Q: 如何查看部署日志？

A: 访问 Vercel Dashboard: https://vercel.com/dashboard

## 下一步

部署完成后，继续实施：
- Layer 4: 自动营销管道（SEO+社交媒体）
- Layer 5: 自动变现管道（支付+订阅）

---

**目标：让全世界都能访问你生成的288个AI工具！**
