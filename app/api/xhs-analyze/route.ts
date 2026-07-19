import { NextRequest, NextResponse } from 'next/server';
import { callAi } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, url } = body || {};

    if (!content && !url) {
      return NextResponse.json(
        { ok: false, error: '请提供文案内容或URL' },
        { status: 400 }
      );
    }

    // 构建分析prompt
    const prompt = `
你是一个小红书爆款文案分析专家。请分析以下文案，拆解其爆款基因。

分析维度：
1. 标题公式（类型+句式结构）
2. 开头钩子（前3行如何抓住注意力）
3. 正文结构（分段逻辑+情绪递进）
4. 情绪触发点（焦虑/好奇/共鸣/惊喜）
5. 话题标签策略（#标签的选择逻辑）
6. 可复用模板（提取可套用的结构）

文案内容：
${content || 'URL: ' + url}

请以JSON格式输出：
{
  "titleFormula": "标题公式描述",
  "hook": "开头钩子分析",
  "structure": "正文结构分析",
  "emotions": ["情绪标签1", "情绪标签2"],
  "hashtags": ["#推荐标签1", "#推荐标签2"],
  "template": "可复用模板（用[填入内容]标记变量）",
  "variants": ["变体版本1", "变体版本2", "变体版本3"]
}
`;

    const data = await callAi('coach', { prompt });
    
    // 解析AI返回的内容
    let result;
    try {
      result = JSON.parse(data.content || data);
    } catch {
      // 如果不是JSON，尝试提取JSON部分
      const match = (data.content || data).match(/\{[\s\S]*\}/);
      if (match) {
        result = JSON.parse(match[0]);
      } else {
        result = { raw: data.content || data };
      }
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (err: any) {
    console.error('[api/xhs-analyze] error:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || '分析失败' },
      { status: 500 }
    );
  }
}
