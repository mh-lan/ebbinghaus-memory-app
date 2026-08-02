import { useState, useEffect } from 'react';
import { db, type Card } from '../utils/db';
import { format } from 'date-fns';

export default function List() {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const allCards = await db.getCards();
    setCards(allCards.sort((a, b) => a.nextReviewDate - b.nextReviewDate));
  };

  const getStageLabel = (stage: number) => {
    return `阶段 ${stage}`;
  };

  return (
    <div className="page-container" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>知识点列表</h2>
      
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
          暂无知识点，请前往“设置”页面导入。
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cards.map(card => (
            <div key={card.id} className="glass-panel" style={{ padding: '16px' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '18px' }}>
                {card.front}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '14px', 
                color: 'var(--text-secondary)' 
              }}>
                <span>状态: <span style={{ color: 'var(--accent)' }}>{getStageLabel(card.stage)}</span></span>
                <span>下次复习: {format(card.nextReviewDate, 'MM-dd HH:mm')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
