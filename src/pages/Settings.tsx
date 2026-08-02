import { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { parseMarkdown } from '../utils/markdown';
import { syncWithWebDAV } from '../utils/sync';

export default function Settings() {
  const [markdown, setMarkdown] = useState('');
  const [message, setMessage] = useState('');
  
  // Network sync settings (Gitee/Github raw)
  const [networkUrl, setNetworkUrl] = useState(localStorage.getItem('network_url') || '');
  const [networkSource, setNetworkSource] = useState(localStorage.getItem('network_source') || 'Gitee');
  const [syncing, setSyncing] = useState(false);

  const handleImportDefault = async () => {
    try {
      setSyncing(true);
      setMessage('正在加载外网更新知识点...');
      const response = await fetch('/default_kb.md');
      if (!response.ok) throw new Error('Failed to fetch');
      const text = await response.text();
      const newCards = parseMarkdown(text, '内置精选');
      if (newCards.length > 0) {
        await db.addCards(newCards);
        setMessage(`成功导入 ${newCards.length} 个《外网更新》职场心理学知识点！`);
      } else {
        setMessage('未能解析出知识点');
      }
    } catch (e) {
      setMessage('导入失败');
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async () => {
    if (!markdown.trim()) {
      setMessage('请输入 Markdown 内容');
      return;
    }
    const newCards = parseMarkdown(markdown);
    if (newCards.length === 0) {
      setMessage('未找到有效的知识点。请确保使用 # 标题');
      return;
    }
    try {
      await db.addCards(newCards);
      setMessage(`成功导入 ${newCards.length} 个知识点！`);
      setMarkdown('');
    } catch (e) {
      setMessage('导入失败');
    }
  };

  const handleNetworkSync = async () => {
    if (!networkUrl || !networkSource) {
      setMessage('请填写完整的网络路径和来源标签');
      return;
    }
    
    localStorage.setItem('network_url', networkUrl);
    localStorage.setItem('network_source', networkSource);
    
    try {
      setSyncing(true);
      setMessage('正在从网络同步...');
      const response = await fetch(networkUrl);
      if (!response.ok) throw new Error('网络请求失败');
      const text = await response.text();
      const newCards = parseMarkdown(text, networkSource);
      if (newCards.length > 0) {
        await db.addCards(newCards);
        setMessage(`成功从 ${networkSource} 同步了 ${newCards.length} 个知识点！`);
      } else {
        setMessage('该链接未包含有效的 Markdown 知识点（需使用 # 标题）');
      }
    } catch (e) {
      setMessage('同步失败，请检查网络链接是否支持跨域访问');
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        // 使用文件名作为来源标签（去掉扩展名）
        const sourceName = file.name.replace(/\.[^/.]+$/, "");
        const newCards = parseMarkdown(text, sourceName);
        if (newCards.length > 0) {
          await db.addCards(newCards);
          setMessage(`成功从本地文件 [${file.name}] 导入了 ${newCards.length} 个知识点！`);
        } else {
          setMessage('该文件未包含有效的 Markdown 知识点');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClear = async () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      await db.clearAll();
      setMessage('数据已清空');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.5)'
  };

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>设置与同步</h2>
      
      {message && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--card-bg)', borderRadius: '8px', color: 'var(--accent)', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>🚀 精选职场心理学题库</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          一键导入“外网更新”文件夹中每日推送的关于管理、职场与心理学的零散知识点，共收录数十条精选内容。
        </p>
        <button 
          onClick={handleImportDefault}
          disabled={syncing}
          style={{ width: '100%', padding: '12px', background: 'var(--success)', color: 'white', borderRadius: '12px', fontWeight: '600', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
        >
          {syncing ? '导入中...' : '一键导入精华知识库'}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>🌐 网络端自动同步 (如 Gitee)</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          输入可通过浏览器直接访问的 Raw 链接（例如 Gitee/Github 的原始数据链接）。此链接在每次打开应用时可自动更新内容。
        </p>
        <input style={inputStyle} type="text" placeholder="来源标签 (如 Gitee)" value={networkSource} onChange={e => setNetworkSource(e.target.value)} />
        <input style={inputStyle} type="text" placeholder="网络 Raw URL" value={networkUrl} onChange={e => setNetworkUrl(e.target.value)} />
        
        <button 
          onClick={handleNetworkSync}
          disabled={syncing}
          style={{ width: '100%', padding: '12px', background: 'var(--accent-gradient)', color: 'white', borderRadius: '12px', fontWeight: '600' }}
        >
          {syncing ? '同步中...' : '从网络路径同步'}
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>📁 本地导入</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            方法一：选择本地 Markdown 文件导入（文件名将自动作为标签）
          </p>
          <input 
            type="file" 
            accept=".md,.txt" 
            onChange={handleFileUpload}
            style={{ width: '100%', padding: '8px', border: '1px dashed var(--accent)', borderRadius: '8px', cursor: 'pointer' }}
          />
        </div>

        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            方法二：直接粘贴文本内容
          </p>
          <textarea 
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="# 什么是艾宾浩斯遗忘曲线？\n\n描述了人类大脑对新事物遗忘的规律..."
            style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '12px', resize: 'vertical', marginBottom: '12px' }}
          />
          <button 
            onClick={handleImport}
            style={{ width: '100%', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '12px', fontWeight: '600' }}
          >
            解析并导入剪贴板文本
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--danger)' }}>危险操作</h3>
        <button 
          onClick={handleClear}
          style={{ width: '100%', padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '12px', fontWeight: '600' }}
        >
          清空所有数据
        </button>
      </div>
    </div>
  );
}
