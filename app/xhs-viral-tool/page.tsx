'use client';

import { useState } from 'react';
import { ArrowLeftIcon, SparklesIcon, DocumentTextIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function XhsViralToolPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!input.trim()) {
      setError('请输入小红书文案或URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/xhs-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: input.includes('http') ? '' : input,
          url: input.includes('http') ? input : ''
        }),
      });

      const data = await res.json();
      
      if (!data.ok) {
        throw new Error(data.error || '分析失败');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || '分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="w-5 h-5" />
              </a>
              <h1 className="text-xl font-bold text-gray-900">
                🔥 小红书爆款基因提取器
              </h1>
            </div>
            <a
              href="/pricing"
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
            >
              解锁完整版 ¥199/月
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粘贴小红书文案或URL
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="粘贴小红书爆款文案到这里，或输入笔记URL..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {input.length > 0 ? `${input.length} 字` : '免费版：每天3次拆解'}
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <SparklesIcon className="w-5 h-5 animate-spin" />
                  正在提取爆款基因...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  开始拆解
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Result Section */}
        {result && (
          <div className="space-y-6">
            {/* Title Formula */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  标题公式
                </h2>
                <button
                  onClick={() => handleCopy(result.titleFormula || '')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-gray-800 font-medium">{result.titleFormula}</p>
              </div>
            </div>

            {/* Hook Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  开头钩子
                </h2>
                <button
                  onClick={() => handleCopy(result.hook || '')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <p className="text-gray-800">{result.hook}</p>
              </div>
            </div>

            {/* Structure Analysis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  正文结构
                </h2>
                <button
                  onClick={() => handleCopy(result.structure || '')}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">{result.structure}</p>
              </div>
            </div>

            {/* Template */}
            {result.template && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-sm font-bold">
                      ✨
                    </span>
                    可复用模板
                  </h2>
                  <button
                    onClick={() => handleCopy(result.template)}
                    className="flex items-center gap-1 text-sm bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                    {copied ? '已复制' : '一键复制模板'}
                  </button>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <pre className="text-gray-800 whitespace-pre-wrap font-sans">
                    {result.template}
                  </pre>
                </div>
                <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
                  <DocumentTextIcon className="w-4 h-4" />
                  提示：将 [填入内容] 替换为你的行业关键词即可使用
                </p>
              </div>
            )}

            {/* Variants */}
            {result.variants && result.variants.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  3个变体版本
                </h2>
                <div className="space-y-3">
                  {result.variants.map((variant: string, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          变体 {index + 1}
                        </span>
                        <button
                          onClick={() => handleCopy(variant)}
                          className="text-sm text-orange-500 hover:text-orange-600"
                        >
                          复制
                        </button>
                      </div>
                      <p className="text-gray-800 text-sm">{variant}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watermark Footer */}
            <div className="text-center py-6 border-t border-gray-200">
              <p className="text-sm text-gray-400">
                🔧 由 <span className="text-orange-500 font-medium">爆款基因提取器</span> 生成 · 小红书爆款方法论标杆工具
              </p>
              <a
                href="/pricing"
                className="mt-2 inline-block text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                解锁无限次拆解 + 代运营服务 →
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
