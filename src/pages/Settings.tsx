import { useState, useEffect } from 'react';
import { db } from '../utils/db';
import { parseMarkdown } from '../utils/markdown';
import { FiCheckCircle, FiCircle, FiDownloadCloud, FiPlus, FiTrash2 } from 'react-icons/fi';

interface KnowledgeBank {
  id: string;
  name: string;
  url: string;
}

const DEFAULT_BANKS: KnowledgeBank[] = [
  {
    id: 'default_kb',
    name: '职场管理心理学题库 (GitHub内置)',
    url: 'https://raw.githubusercontent.com/mh-lan/ebbinghaus-memory-app/main/public/default_kb.md'
  }
];

export default function Settings() {
  const [banks, setBanks] = useState<KnowledgeBank[]>([]);
  const [importedTags, setImportedTags] = useState<string[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [message, setMessage] = useState('');
  const [markdown, setMarkdown] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('knowledge_banks');
    if (saved) {
      setBanks(JSON.parse(saved));
    } else {
      setBanks(DEFAULT_BANKS);
      localStorage.setItem('knowledge_banks', JSON.stringify(DEFAULT_BANKS));
    }
    loadImportedTags();
  }, []);

  const loadImportedTags = async () => {
    const cards = await db.getCards();
    const tags = new Set<string>();
    cards.forEach(c => {
      if (c.tags) c.tags.forEach(t => tags.add(t));
    });
    setImportedTags(Array.from(tags));
  };

  const saveBanks = (newBanks: KnowledgeBank[]) => {
    setBanks(newBanks);
    localStorage.setItem('knowledge_banks', JSON.stringify(newBanks));
  };

  const handleAddBank = () => {
    if (!newName.trim() || !newUrl.trim()) {
      setMessage('请输入完整的题库名称和路径');
      return;
    }
    const newBank: KnowledgeBank = { id: Date.now().toString(), name: newName.trim(), url: newUrl.trim() };
    saveBanks([...banks, newBank]);
    setNewName('');
    setNewUrl('');
    setMessage(`已添加题库: ${newBank.name}`);
  };

  const handleRemoveBank = (id: string) => {
    if (window.confirm('确定要从列表中移除该题库吗？（本地已导入的知识点不会被删除）')) {
      saveBanks(banks.filter(b => b.id !== id));
    }
  };

  const handleSyncBank = async (bank: KnowledgeBank) => {
    try {
      setSyncingId(bank.id);
      setMessage(`正在拉取更新：${bank.name}...`);
      const response = await fetch(bank.url);
      if (!response.ok) throw new Error('网络请求失败');
      const text = await response.text();
      const newCards = parseMarkdown(text, bank.name);
      if (newCards.length > 0) {
        await db.addCards(newCards);
        setMessage(`成功更新了 ${newCards.length} 个来自【${bank.name}】的知识点！重复项已覆盖且进度保留。`);
        await loadImportedTags();
      } else {
        setMessage('链接未包含有效的知识点');
      }
    } catch (e) {
      setMessage(`更新失败，请检查网络链接（Github Raw 可能需要代理）`);
    } finally {
      setSyncingId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const sourceName = file.name.replace(/\.[^/.]+$/, "");
        const newCards = parseMarkdown(text, sourceName);
        if (newCards.length > 0) {
          await db.addCards(newCards);
          setMessage(`成功从本地文件 [${file.name}] 导入了 ${newCards.length} 个知识点！`);
          await loadImportedTags();
        } else {
          setMessage('该文件未包含有效的 Markdown 知识点');
        }
      }
    };
    reader.readAsText(file);
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

  const handleClear = async () => {
    if (window.confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      await db.clearAll();
      setImportedTags([]);
      setMessage('数据已清空');
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255,255,255,0.5)',
    fontSize: '14px'
  };

  return (
    <div className="page-container" style={{ padding: '20px', paddingBottom: '80px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>知识库管理</h2>
      
      {message && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--card-bg)', borderRadius: '8px', color: 'var(--accent)', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* 网络题库模块 */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiDownloadCloud /> 网络端题库同步
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          在此统一管理所有网络题库。每次点击导入/更新都会从原网址抓取最新数据，自动覆盖变更内容并**保留您的复习时间记录**。
        </p>
        
        {/* 题库列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {banks.map(bank => {
            const isImported = importedTags.includes(bank.name);
            return (
              <div key={bank.id} style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '12px', padding: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>{bank.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: isImported ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {isImported ? <FiCheckCircle /> : <FiCircle />}
                    {isImported ? '已导入' : '未导入'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', wordBreak: 'break-all', marginBottom: '12px', opacity: 0.8 }}>
                  {bank.url}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleSyncBank(bank)}
                    disabled={syncingId !== null}
                    style={{ flex: 1, padding: '8px', background: 'var(--accent)', color: 'white', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    {syncingId === bank.id ? '更新中...' : '导入 / 更新'}
                  </button>
                  {bank.id !== 'default_kb' && (
                    <button 
                      onClick={() => handleRemoveBank(bank.id)}
                      style={{ padding: '8px 12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 添加题库 */}
        <div style={{ borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>+ 添加自定义题库</h4>
          <input style={inputStyle} type="text" placeholder="题库名称 (将作为标签)" value={newName} onChange={e => setNewName(e.target.value)} />
          <input style={inputStyle} type="text" placeholder="网络 Raw URL (如 Gitee/Github Raw)" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
          <button 
            onClick={handleAddBank}
            style={{ width: '100%', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <FiPlus /> 添加到列表
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>📁 本地离线导入</h3>
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            方法一：选择本地 Markdown 文件（文件名即标签）
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
            placeholder="# 什么是艾宾浩斯遗忘曲线？\n\n描述了规律..."
            style={{ width: '100%', height: '80px', background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', padding: '12px', resize: 'vertical', marginBottom: '12px' }}
          />
          <button 
            onClick={handleImport}
            style={{ width: '100%', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '12px', fontWeight: '600' }}
          >
            解析并导入
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', color: 'var(--danger)' }}>危险操作</h3>
        <button 
          onClick={handleClear}
          style={{ width: '100%', padding: '12px', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '12px', fontWeight: '600' }}
        >
          清空所有本地数据
        </button>
      </div>
    </div>
  );
}
