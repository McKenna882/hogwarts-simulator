/* ──────────────── 魔法枢纽 API 管理器 v0.02 ──────────────── */

const apiManager = {
  config: {
    baseUrl: localStorage.getItem('api_baseUrl') || '',
    apiKey: localStorage.getItem('api_apiKey') || '',
    model: localStorage.getItem('api_model') || 'gpt-3.5-turbo'
  },

  loadConfig() {
    this.config.baseUrl = localStorage.getItem('api_baseUrl') || '';
    this.config.apiKey = localStorage.getItem('api_apiKey') || '';
    this.config.model = localStorage.getItem('api_model') || 'gpt-3.5-turbo';
    return this.config;
  },

  saveConfig(baseUrl, apiKey, model) {
    this.config.baseUrl = baseUrl;
    this.config.apiKey = apiKey;
    this.config.model = model;
    localStorage.setItem('api_baseUrl', baseUrl);
    localStorage.setItem('api_apiKey', apiKey);
    localStorage.setItem('api_model', model);
  },

  isConfigured() {
    return !!(this.config.baseUrl && this.config.apiKey);
  },

  getFriendlyError(err) {
    const msg = String(err.message || err);
    if (/\b401\b/.test(msg) || msg.includes('Unauthorized'))
      return '🔑 API密钥无效，请检查你的魔法枢纽设置。';
    if (/\b403\b/.test(msg) || msg.includes('Forbidden'))
      return '🚫 访问被拒绝，猫头鹰被挡在窗外了。';
    if (/\b404\b/.test(msg) || msg.includes('Not Found'))
      return '🔍 找不到中转站，请确认地址是否正确。';
    if (msg.includes('timeout') || msg.includes('Timeout') || msg.includes('abort'))
      return '⏳ 猫头鹰飞得太久，连接超时了。请检查网络或中转站状态。';
    if (msg.includes('NetworkError') || msg.includes('Failed to fetch') || msg.includes('fetch'))
      return '🦉 猫头鹰迷路了，请检查你的魔法枢纽设置和网络连接。';
    if (/\b429\b/.test(msg))
      return '⏱️ 猫头鹰太累了（请求过于频繁），请稍后再试。';
    if (/\b500\b/.test(msg) || /\b502\b/.test(msg) || /\b503\b/.test(msg))
      return '🏚️ 中转站似乎出故障了，请稍后再试。';
    return '🦉 猫头鹰遇到了未知问题：' + msg;
  },

  _normalizeBase(raw) {
    // 去掉末尾斜杠，再处理 /v1 避免双重路径
    let base = raw.replace(/\/+$/, '');
    if (base.endsWith('/v1')) {
      base = base.slice(0, -3);
    }
    return base;
  },

  async testConnection() {
    const base = this._normalizeBase(this.config.baseUrl);
    const key = this.config.apiKey;
    const results = { success: false, models: [], modelCount: 0, error: '', method: '' };

    if (!base || !key) {
      results.error = '请先填写中转站地址和API Key。';
      return results;
    }

    // 尝试 /v1/models
    try {
      const resp = await fetch(base + '/v1/models', {
        headers: { 'Authorization': 'Bearer ' + key },
        signal: AbortSignal.timeout(10000)
      });
      if (resp.ok) {
        const data = await resp.json();
        let models = [];
        if (Array.isArray(data.data)) {
          models = data.data.map(m => m.id);
        } else if (Array.isArray(data)) {
          models = data.map(m => m.id || m);
        }
        results.success = true;
        results.method = 'models';
        results.models = models;
        results.modelCount = models.length;
        return results;
      }
      if (resp.status === 401) throw new Error('401');
      if (resp.status === 403) throw new Error('403');
    } catch (e) {
      if (e.message === '401' || e.message === '403') throw e;
    }

    // 降级 ping
    try {
      const resp = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5
        }),
        signal: AbortSignal.timeout(10000)
      });
      if (resp.ok || resp.status === 400) {
        results.success = true;
        results.method = 'ping';
        results.models = [];
        results.modelCount = 0;
        return results;
      }
      if (resp.status === 401) throw new Error('401');
      if (resp.status === 403) throw new Error('403');
      throw new Error('ping_failed: ' + resp.status);
    } catch (e) {
      if (e.message === '401' || e.message === '403') {
        results.error = this.getFriendlyError(new Error(e.message));
      } else {
        results.error = this.getFriendlyError(e);
      }
      return results;
    }
  },

  async listModels() {
    const base = this._normalizeBase(this.config.baseUrl);
    const key = this.config.apiKey;
    try {
      const resp = await fetch(base + '/v1/models', {
        headers: { 'Authorization': 'Bearer ' + key },
        signal: AbortSignal.timeout(10000)
      });
      if (!resp.ok) throw new Error('Failed to list models: ' + resp.status);
      const data = await resp.json();
      let models = [];
      if (Array.isArray(data.data)) models = data.data.map(m => m.id);
      else if (Array.isArray(data)) models = data.map(m => m.id || m);
      return { models, count: models.length };
    } catch (e) {
      return { models: [], count: 0, error: this.getFriendlyError(e) };
    }
  },

  async chatCompletion(messages, modelOverride) {
    const base = this._normalizeBase(this.config.baseUrl);
    const key = this.config.apiKey;
    const model = modelOverride || this.config.model;
    if (!base || !key) throw new Error('not_configured');

    const resp = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.8,
        max_tokens: 600
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(String(resp.status) + (text ? ': ' + text.slice(0, 200) : ''));
    }

    const data = await resp.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Unexpected response format');
  }
};
