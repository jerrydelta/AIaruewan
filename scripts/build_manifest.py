#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_manifest.py — 手搓应用「生成工厂」目录生成器
=================================================
读 build_plan_<date>.json（含每条 lead 完整元数据）+
builds/<date>/*.html（实际产物）+ build_report_*.json（构建报告），
生成：
  1. builds/<date>/index.html     —— 可筛选产品目录（按品类过滤，卡片式）
  2. builds/<date>/manifest.json  —— 结构化数据（供小程序/下游消费）
  3. builds/index.html            —— 全局索引（所有日期入口）

用法：
  python scripts/build_manifest.py [DATE]
    DATE 留空=最新 builds/ 下子目录
"""
import json
import glob
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def norm(s):
    return re.sub(r"[^A-Za-z0-9\-]", "_", s or "")


def latest_build_date():
    sub = [d for d in glob.glob(os.path.join(ROOT, "builds", "*")) if os.path.isdir(d)]
    return sorted(sub, reverse=True)[0].split(os.sep)[-1] if sub else None


def main():
    date = sys.argv[1] if len(sys.argv) > 1 else latest_build_date()
    if not date:
        raise SystemExit("builds/ 下没有产物目录")

    plan_path = os.path.join(ROOT, f"build_plan_{date}.json")
    if not os.path.exists(plan_path):
        raise SystemExit(f"找不到 build_plan_{date}.json，请先跑 build_factory.py")
    plan = json.load(open(plan_path, encoding="utf-8"))

    html_dir = os.path.join(ROOT, "builds", date)
    existing = {os.path.splitext(os.path.basename(f))[0]
                for f in glob.glob(os.path.join(html_dir, "*.html"))}

    # 汇总所有 lead
    leads = []
    for agent_key, agent in plan.get("agents", {}).items():
        for lead in agent.get("leads", []):
            nid = norm(lead.get("id", ""))
            # 匹配实际文件：精确 / 前缀（带后缀情况）
            fname = nid if nid in existing else next(
                (b for b in existing if b.startswith(nid)), None)
            leads.append({
                "id": lead.get("id"),
                "category": lead.get("category"),
                "subcategory": lead.get("subcategory"),
                "direction": lead.get("direction"),
                "direction_en": lead.get("direction_en"),
                "tags": lead.get("tags", []),
                "html": f"{fname}.html" if fname else None,
                "built": fname is not None,
            })

    built = sum(1 for l in leads if l["built"])
    missing = [l["id"] for l in leads if not l["built"]]

    # manifest.json
    manifest = {"date": date, "total": len(leads), "built": built,
                "missing": missing, "items": leads}
    with open(os.path.join(html_dir, "manifest.json"), "w", encoding="utf-8") as fp:
        json.dump(manifest, fp, ensure_ascii=False, indent=2)

    # 品类列表（用于筛选）
    cats = sorted({l["category"] for l in leads if l["category"]})

    # index.html
    cards = []
    for l in leads:
        if not l["built"]:
            continue
        tag_html = "".join(f'<span class="tag">{t}</span>' for t in (l["tags"] or [])[:4])
        cards.append(f'''
    <a class="card" href="{l['html']}" target="_blank">
      <div class="meta"><span class="cat">{l['category']}</span></div>
      <div class="title">{l['direction']}</div>
      <div class="en">{l['direction_en']}</div>
      <div class="tags">{tag_html}</div>
    </a>''')

    cat_btns = "".join(
        f'<button class="chip" data-cat="{c}" onclick="filterCat(\'{c}\')">{c}</button>'
        for c in cats)
    cat_btns = '<button class="chip active" data-cat="*" onclick="filterCat(\'*\')">全部</button>' + cat_btns

    html = f'''<!DOCTYPE html>
<html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>手搓应用工厂 · 产品目录 {date}</title>
<style>
:root{{--coral:#FF6B6B;--ink:#2D2D2D;--muted:#8A8A8A;--bg:#F7F7F7;--card:#fff;--line:#ECECEC}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;padding:16px;max-width:920px;margin:0 auto}}
h1{{font-size:22px;margin:10px 0}}
.stat{{color:var(--coral);font-weight:700}}
.chips{{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 18px}}
.chip{{border:1px solid var(--line);background:#fff;color:var(--muted);border-radius:999px;padding:5px 12px;font-size:13px;cursor:pointer}}
.chip.active{{background:var(--coral);color:#fff;border-color:var(--coral)}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}}
.card{{display:block;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px;transition:.15s}}
.card:hover{{box-shadow:0 4px 16px rgba(255,107,107,.15);transform:translateY(-2px)}}
.cat{{font-size:11px;color:var(--coral);background:#FFF0F0;padding:2px 8px;border-radius:999px}}
.title{{font-size:15px;font-weight:600;margin:8px 0 2px}}
.en{{font-size:12px;color:var(--muted);margin-bottom:8px}}
.tags .tag{{font-size:10px;color:var(--coral);background:#FFF0F0;border:1px solid #FFD9D9;border-radius:999px;padding:1px 7px;margin:2px 3px 0 0;display:inline-block}}
</style></head><body>
<h1>🏭 手搓应用工厂 · 产品目录</h1>
<div>批次 <span class="stat">{date}</span> ｜ 产品 <span class="stat">{built}</span> / {len(leads)} 条线索已建成可运行单文件 HTML</div>
<div class="chips">{cat_btns}</div>
<div class="grid" id="grid">{''.join(cards)}</div>
<script>
function filterCat(cat){{
  document.querySelectorAll('.chip').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
  document.querySelectorAll('.card').forEach(c=>{{
    const show = cat==='*' || c.querySelector('.cat').textContent===cat;
    c.style.display = show ? '' : 'none';
  }});
}}
</script></body></html>'''

    with open(os.path.join(html_dir, "index.html"), "w", encoding="utf-8") as fp:
        fp.write(html)

    # 全局索引 builds/index.html
    dates = sorted(
        [os.path.basename(d) for d in glob.glob(os.path.join(ROOT, "builds", "*"))
         if os.path.isdir(d) and os.path.exists(os.path.join(d, "index.html"))],
        reverse=True)
    date_links = "".join(
        f'<li><a href="{d}/index.html">{d}</a> — {len(glob.glob(os.path.join(ROOT,"builds",d,"*.html")))-1} 个产品</li>'
        for d in dates)
    global_html = f'''<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>手搓应用工厂 · 全局索引</title>
<style>body{{font-family:-apple-system,"PingFang SC",sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#2D2D2D}}
h1{{color:#FF6B6B}}li{{margin:8px 0}}a{{color:#FF6B6B}}</style></head>
<body><h1>🏭 手搓应用工厂</h1><p>每日发现管线产出的方向线索 → 自动生成单文件 HTML 工具。批次列表：</p>
<ul>{date_links}</ul></body></html>'''
    with open(os.path.join(ROOT, "builds", "index.html"), "w", encoding="utf-8") as fp:
        fp.write(global_html)

    print(f"批次 {date}: 线索 {len(leads)} / 已建成 {built} / 缺失 {len(missing)}")
    if missing:
        print("缺失:", missing)
    print(f"目录 -> builds/{date}/index.html | 全局 -> builds/index.html")


if __name__ == "__main__":
    import sys
    main()
