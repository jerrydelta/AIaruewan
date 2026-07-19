import { AiType } from './types';
import { buildMessages } from './prompts';
import { COST_TABLE } from './cost-analysis';

const HY3_URL =
  process.env.HY3_URL || 'https://tokenhub.tencentmaas.com/v1/chat/completions';
const HY3_API_KEY = process.env.HY3_API_KEY || '';
const HY3_MODEL = process.env.HY3_MODEL || 'hy3';

// L1 内存缓存 + L2 持久化缓存
interface CacheEntry {
  value: unknown;
  expiresAt: number;
  cost: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30分钟

// 成本统计（运行时累计，重启清零）
export const costStats = {
  totalCalls: 0,
  totalCost: 0,
  cacheHits: 0,
  byType: {} as Record<string, { calls: number; cost: number }>,
};

export function parseJsonSafe(raw: string): any {
  let text = (raw || '').trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) text = text.slice(first, last + 1);
  return JSON.parse(text);
}

/** 获取某类型的预估成本 */
function getCostEstimate(type: AiType): number {
  const c = COST_TABLE.find(x => x.type === type);
  return c?.costPerCall ?? 0.03;
}

export async function callAi<T = any>(type: AiType, payload: any = {}): Promise<T> {
  const cacheKey = type + ':' + JSON.stringify(payload);
  const now = Date.now();

  // ── L1 缓存命中 ──
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    costStats.cacheHits++;
    return hit.value as T;
  }

  const { system, user } = buildMessages(type, payload);
  const timeoutMs = type === 'builder' || type === 'content_team' ? 150000 : 90000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const estimatedCost = getCostEstimate(type);

  try {
    const resp = await fetch(HY3_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + HY3_API_KEY,
      },
      body: JSON.stringify({
        model: HY3_MODEL,
        response_format: { type: 'json_object' },
        temperature: type === 'quick_hook' ? 0.5 : type === 'podcast' ? 0.6 : 0.3,
        max_tokens: type === 'builder' ? 14000 : type === 'content_team' ? 12000 : 8000,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      throw new Error(`HY3 upstream error: ${resp.status} ${resp.statusText}`);
    }

    const json: any = await resp.json();
    const content: string | undefined =
      json?.choices?.[0]?.message?.content ?? json?.data?.choices?.[0]?.message?.content;
    // 实际用量
    const usage = json?.usage ?? json?.data?.usage;
    const actualCost = usage
      ? (usage.prompt_tokens * 1 + usage.completion_tokens * 4) / 1_000_000
      : estimatedCost;

    if (!content) throw new Error('HY3 returned empty content');

    const result = parseJsonSafe(content) as T;

    // 缓存
    cache.set(cacheKey, { value: result, expiresAt: now + CACHE_TTL_MS, cost: actualCost });

    // 统计
    costStats.totalCalls++;
    costStats.totalCost += actualCost;
    if (!costStats.byType[type]) costStats.byType[type] = { calls: 0, cost: 0 };
    costStats.byType[type].calls++;
    costStats.byType[type].cost += actualCost;

    // 日志（生产可关闭）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AI] ${type} | cost: ¥${actualCost.toFixed(4)} | total: ¥${costStats.totalCost.toFixed(2)} | calls: ${costStats.totalCalls}`);
    }

    return result;
  } finally {
    clearTimeout(timer);
  }
}

/** 获取成本统计摘要 */
export function getCostSummary() {
  return {
    ...costStats,
    estimatedSavings: costStats.cacheHits * 0.02, // 预估缓存节省
    summary: `总调用${costStats.totalCalls}次 | 总成本¥${costStats.totalCost.toFixed(2)} | 缓存命中${costStats.cacheHits}次`,
  };
}
