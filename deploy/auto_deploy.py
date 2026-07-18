#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动部署脚本 - 手搓应用生成工厂
功能：自动将新生成的工具推送到GitHub，触发Vercel部署
"""

import os
import subprocess
import json
from datetime import datetime
from pathlib import Path

# 配置
WORKSPACE = Path("D:/WB工作学习记录文档/海外生意怎么做/手搓应用")
BUILDS_DIR = WORKSPACE / "builds"
GITHUB_REPO = "handmade-ai-tools"  # 替换为你的GitHub用户名

def run_command(cmd, cwd=None):
    """执行命令并返回结果"""
    print(f"🔧 执行: {cmd}")
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd or WORKSPACE,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"❌ 错误: {result.stderr}")
        return False
    print(f"✅ 成功: {result.stdout[:100]}...")
    return True

def get_new_tools():
    """获取新增的工具列表"""
    # 读取今天的构建计划
    today = datetime.now().strftime("%Y%m%d")
    plan_file = WORKSPACE / f"scripts/build_plan_{today}.json"
    
    if not plan_file.exists():
        print(f"⚠️ 未找到今天的构建计划: {plan_file}")
        return []
    
    with open(plan_file, 'r', encoding='utf-8') as f:
        plan = json.load(f)
    
    # 筛选出今天新增的工具
    new_tools = []
    for item in plan.get('items', []):
        lead_id = item.get('lead_id')
        html_file = BUILDS_DIR / today / f"{lead_id}.html"
        if html_file.exists():
            new_tools.append(html_file)
    
    return new_tools

def git_add_commit_push(new_tools):
    """Git添加、提交、推送"""
    if not new_tools:
        print("📭 没有新工具需要部署")
        return True
    
    # 添加文件
    for tool in new_tools:
        if not run_command(f'git add "{tool}"'):
            return False
    
    # 提交
    commit_msg = f"自动部署：新增{len(new_tools)}个AI工具 - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    if not run_command(f'git commit -m "{commit_msg}"'):
        return False
    
    # 推送
    if not run_command('git push origin main'):
        return False
    
    return True

def update_index_html():
    """更新产品目录页"""
    today = datetime.now().strftime("%Y%m%d")
    index_file = BUILDS_DIR / today / "index.html"
    
    if not index_file.exists():
        print(f"⚠️ 未找到索引文件: {index_file}")
        return False
    
    # 这里可以添加自动更新索引页的逻辑
    # 例如：扫描所有HTML文件，生成卡片网格
    print(f"📝 索引页已存在: {index_file}")
    return True

def main():
    """主函数"""
    print("=" * 60)
    print("🚀 手搓应用 - 自动部署脚本")
    print("=" * 60)
    print()
    
    # 1. 检查Git状态
    print("【步骤1/4】检查Git仓库状态...")
    if not (WORKSPACE / ".git").exists():
        print("❌ Git仓库未初始化！请先运行 setup_github.bat")
        return False
    
    # 2. 获取新工具
    print("【步骤2/4】扫描新增工具...")
    new_tools = get_new_tools()
    print(f"✅ 发现 {len(new_tools)} 个新工具")
    
    # 3. 更新索引页
    print("【步骤3/4】更新产品目录...")
    update_index_html()
    
    # 4. 推送到GitHub
    print("【步骤4/4】推送到GitHub（触发Vercel部署）...")
    if git_add_commit_push(new_tools):
        print("🎉 部署成功！Vercel将在2-3分钟内自动部署")
        print(f"🌐 访问地址: https://handmade-ai-tools.vercel.app")
        return True
    else:
        print("❌ 部署失败！请检查错误信息")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
