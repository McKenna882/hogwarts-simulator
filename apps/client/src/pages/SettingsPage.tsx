import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUIStore } from '../stores/uiStore';

export default function SettingsPage() {
  const showToast = useUIStore((s) => s.showToast);

  // AI 配置
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    setBaseUrl(localStorage.getItem('api_baseUrl') || '');
    setApiKey(localStorage.getItem('api_apiKey') || '');
    setModel(localStorage.getItem('api_model') || '');
    const savedModels = parseSavedModels(localStorage.getItem('api_models'));
    setModels(savedModels);
  };

  const saveConfig = () => {
    localStorage.setItem('api_baseUrl', baseUrl);
    localStorage.setItem('api_apiKey', apiKey);
    localStorage.setItem('api_model', model);
    showToast('魔法枢纽配置已保存 🔧', 'success');
  };

  const testConnection = async () => {
    if (!baseUrl || !apiKey) {
      showToast('请先填写中转站地址和 API Key', 'error');
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const normalizedBase = baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '');
      const resp = await fetch(normalizedBase + '/v1/models', {
        headers: { Authorization: 'Bearer ' + apiKey },
        signal: AbortSignal.timeout(10000),
      });

      if (resp.ok) {
        const data = await resp.json();
        const modelList = Array.isArray(data.data) ? data.data.map((m: any) => m.id) : [];
        setModels(modelList);
        localStorage.setItem('api_models', JSON.stringify(modelList));
        setTestResult(`✅ 连接成功！检测到 ${modelList.length} 个模型`);
        showToast(`🦉 猫头鹰带回信笺 — 连接成功`, 'success');
      } else if (resp.status === 401) {
        setTestResult('❌ API Key 无效');
      } else {
        setTestResult(`❌ 连接失败 (${resp.status})`);
      }
    } catch (e: any) {
      setTestResult('❌ 连接失败：' + (e.message || '网络错误'));
    } finally {
      setTesting(false);
    }
  };

  const clearCache = () => {
    localStorage.clear();
    showToast('缓存已清理，页面即将刷新 🔄', 'info');
    setTimeout(() => location.reload(), 1000);
  };

  const resetData = () => {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
      localStorage.removeItem('magicCodex_v0.03_state');
      localStorage.removeItem('hogwarts-auth-storage');
      showToast('数据已重置', 'info');
      setTimeout(() => location.reload(), 500);
    }
  };

  const exportConfig = () => {
    const config = {
      api_baseUrl: baseUrl,
      api_model: model,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'magic_config.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('配置已导出 📋', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target?.result as string);
        if (config.api_baseUrl) setBaseUrl(config.api_baseUrl);
        if (config.api_model) setModel(config.api_model);
        showToast('配置已导入 📥', 'success');
      } catch {
        showToast('导入失败：文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gold mb-1">设置</h1>
        <p className="text-parchment/50 text-sm">Settings</p>
      </div>

      <div className="space-y-4">
        {/* AI 配置 */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-gold font-display mb-4">🦉 魔法枢纽 · AI 配置</h3>

          <div className="space-y-3">
            <div>
              <label className="text-parchment/50 text-xs mb-1 block">Base URL（中转站地址）</label>
              <input
                className="input-field"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="text-parchment/50 text-xs mb-1 block">API Key</label>
              <input
                className="input-field"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="text-parchment/50 text-xs mb-1 block">模型名称</label>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  list="model-list"
                />
                <datalist id="model-list">
                  {models.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            {testResult && (
              <motion.p
                className={`text-sm ${testResult.startsWith('✅') ? 'text-green-400' : testResult.startsWith('❌') ? 'text-red-400' : 'text-parchment/60'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {testResult}
              </motion.p>
            )}

            <div className="flex gap-2 pt-2">
              <button className="btn-primary text-sm" onClick={saveConfig}>
                💾 保存设置
              </button>
              <button className="btn-ghost text-sm" onClick={testConnection} disabled={testing}>
                {testing ? '测试中...' : '🦉 测试连接'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* 数据管理 */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-gold font-display mb-4">💾 数据管理</h3>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost text-sm" onClick={clearCache}>
              🧹 清理缓存
            </button>
            <button className="btn-ghost text-sm text-red-400 border-red-400/50 hover:bg-red-900/20" onClick={resetData}>
              ⚠️ 数据重置
            </button>
            <button className="btn-ghost text-sm" onClick={exportConfig}>
              📤 导出配置
            </button>
            <label className="btn-ghost text-sm cursor-pointer">
              📥 导入配置
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
          <p className="text-parchment/20 text-xs mt-3">
            数据重置仅清除浏览器本地存储，不会影响服务器数据
          </p>
        </motion.div>

        {/* 关于 */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-gold font-display mb-3">📖 关于</h3>
          <p className="text-parchment/50 text-sm">猫头鹰邮局 · 魔法即时通讯</p>
          <p className="text-parchment/30 text-xs mt-1">v0.1 · 魔法法典 · 重建版</p>
          <p className="text-parchment/20 text-xs mt-2">
            本项目为霍格沃茨主题的 AI 角色扮演 + 学院成长养成社交应用
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function parseSavedModels(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    localStorage.removeItem('api_models');
    return [];
  }
}
