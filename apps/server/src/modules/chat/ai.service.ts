import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    this.apiKey = process.env.AI_API_KEY || '';
    this.model = process.env.AI_MODEL || 'gpt-4o-mini';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getModel(): string {
    return this.model;
  }

  // 非流式（保留兼容）
  async chatCompletion(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    const url = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.8,
        max_tokens: 800,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '（角色没有回复）';
  }

  // 流式回复 — 通过回调逐 chunk 推送
  async streamChatCompletion(
    messages: { role: string; content: string }[],
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    if (!this.apiKey) {
      onChunk('🦉 请先在环境变量中配置 AI_API_KEY');
      return;
    }

    const url = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.8,
        max_tokens: 800,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI API error ${response.status}: ${text.slice(0, 200)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('无法读取 AI 响应流');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) onChunk(content);
        } catch {
          // 忽略解析错误
        }
      }
    }

    // 处理剩余 buffer
    if (buffer.trim().startsWith('data: ')) {
      const data = buffer.trim().slice(6);
      if (data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || '';
          if (content) onChunk(content);
        } catch (e) { /* skip */ }
      }
    }
  }

  getFriendlyError(error: any): string {
    const msg = String(error.message || error);
    if (msg.includes('401') || msg.includes('Unauthorized'))
      return '🔑 API Key 无效，请在环境变量中配置 AI_API_KEY';
    if (msg.includes('timeout') || msg.includes('Timeout'))
      return '⏳ 猫头鹰飞得太久，连接超时了';
    if (msg.includes('NetworkError') || msg.includes('fetch'))
      return '🦉 猫头鹰迷路了，请检查网络或 AI 中转站配置';
    if (msg.includes('429'))
      return '⏱️ 请求过于频繁，请稍后再试';
    return '🦉 AI 回复失败：' + msg;
  }
}
