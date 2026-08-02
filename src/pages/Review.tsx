import { useState, useEffect } from 'react';
import { db, type Card } from '../utils/db';
import { calculateRemember, calculateForget } from '../utils/ebbinghaus';
import SwipeCard from '../components/SwipeCard';
import { FiCheckCircle } from 'react-icons/fi';
import confetti from 'canvas-confetti';

export default function Review() {
  const [allReviewCards, setAllReviewCards] = useState<Card[]>([]);
  const [cardsToReview, setCardsToReview] = useState<Card[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const allCards = await db.getCards();
    const now = Date.now();
    const toReview = allCards.filter(c => c.nextReviewDate <= now);
    
    // 提取所有可用的标签
    const tags = new Set<string>();
    allCards.forEach(c => {
      if (c.tags) {
        c.tags.forEach(t => tags.add(t));
      }
    });
    setAvailableTags(Array.from(tags));
    setAllReviewCards(toReview);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTag === 'all') {
      setCardsToReview(allReviewCards);
    } else {
      setCardsToReview(allReviewCards.filter(c => c.tags?.includes(selectedTag)));
    }
  }, [selectedTag, allReviewCards]);

  const handleSwipe = async (direction: 'up' | 'down') => {
    if (cardsToReview.length === 0) return;
    
    const currentCard = cardsToReview[0];
    let updatedCard: Card;

    if (direction === 'down') {
      const result = calculateForget();
      updatedCard = { ...currentCard, ...result };
    } else {
      const result = calculateRemember(currentCard.stage);
      updatedCard = { ...currentCard, ...result };
      // 触发粒子特效
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#10b981']
      });
    }

    await db.updateCard(updatedCard);
    
    // 同时更新 allReviewCards 和 cardsToReview，移除已经划过的卡片
    setAllReviewCards(prev => prev.filter(c => c.id !== currentCard.id));
  };

  if (loading) {
    return <div className="page-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>加载中...</div>;
  }

  return (
    <div className="page-container" style={{ position: 'relative' }}>
      
      {/* 标签过滤栏 */}
      {availableTags.length > 0 && (
        <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', zIndex: 10, display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', padding: '0 20px' }}>
          <button
            onClick={() => setSelectedTag('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              background: selectedTag === 'all' ? 'var(--accent)' : 'var(--card-bg)',
              color: selectedTag === 'all' ? 'white' : 'var(--text-secondary)',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            全部
          </button>
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                background: selectedTag === tag ? 'var(--accent)' : 'var(--card-bg)',
                color: selectedTag === tag ? 'white' : 'var(--text-secondary)',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s'
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {cardsToReview.length > 0 ? (
        <SwipeCard 
          key={cardsToReview[0].id} 
          card={cardsToReview[0]} 
          onSwipe={handleSwipe} 
        />
      ) : (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)'
        }}>
          <FiCheckCircle size={64} color="var(--success)" style={{ marginBottom: 16 }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>太棒了！</h2>
          <p>您已完成所有复习任务。</p>
        </div>
      )}
    </div>
  );
}
