import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Card as CardType } from '../utils/db';
import './SwipeCard.css';

interface Props {
  card: CardType;
  onSwipe: (direction: 'up' | 'down') => void;
}

export default function SwipeCard({ card, onSwipe }: Props) {
  const [showBack, setShowBack] = useState(false);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Reset state when card changes
  useEffect(() => {
    setShowBack(false);
    y.set(0);
    controls.set({ y: 0, rotate: 0, scale: 1, filter: "blur(0px)", opacity: 1 });
  }, [card, y, controls]);

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!showBack) setShowBack(true);
      }
      
      if (showBack) {
        if (e.code === 'ArrowDown') {
          e.preventDefault();
          // 下滑：没记住
          await controls.start({ y: window.innerHeight, opacity: 0, transition: { duration: 0.3 } });
          onSwipe('down'); 
        } else if (e.code === 'ArrowUp') {
          e.preventDefault();
          // 上滑：记住了
          await controls.start({ 
            y: -window.innerHeight,
            scale: 1.1, 
            filter: "blur(12px)", 
            opacity: 0, 
            transition: { duration: 0.3, ease: "easeOut" } 
          });
          onSwipe('up');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBack, controls, onSwipe]);

  const rotate = useTransform(y, [-200, 200], [-10, 10]);

  const handleDragEnd = async (_event: any, info: any) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    
    // 使用 Swipe Power 算法结合静态距离阈值
    // 既保证了快速轻微拨动能触发（高速度），又防止了小幅度的误触（低速度+小距离）
    const swipePower = Math.abs(offset) * velocity;
    const swipeConfidenceThreshold = 8000;

    const isDownSwipe = offset > 80 || swipePower > swipeConfidenceThreshold;
    const isUpSwipe = offset < -80 || swipePower < -swipeConfidenceThreshold;

    if (isDownSwipe) {
      // 下滑：没记住
      await controls.start({ y: window.innerHeight, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('down');
    } else if (isUpSwipe) {
      // 上滑：记住了
      await controls.start({ 
        y: -window.innerHeight,
        scale: 1.1, 
        filter: "blur(12px)", 
        opacity: 0, 
        transition: { duration: 0.3, ease: "easeOut" } 
      });
      onSwipe('up'); 
    } else {
      controls.start({ y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const handleRemember = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await controls.start({ 
      y: -window.innerHeight,
      scale: 1.1, 
      filter: "blur(12px)", 
      opacity: 0, 
      transition: { duration: 0.3, ease: "easeOut" } 
    });
    onSwipe('up');
  };

  const handleForget = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await controls.start({ y: window.innerHeight, opacity: 0, transition: { duration: 0.3 } });
    onSwipe('down');
  };

  return (
    <div className="card-container">
      <motion.div
        className="card"
        drag={showBack ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        style={{ y, rotate }}
        animate={controls}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (!showBack) setShowBack(true);
        }}
        whileTap={!showBack ? { scale: 0.98 } : {}}
      >
        <div className="card-content">
          <div className="front">
            <h2>{card.front}</h2>
          </div>
          {showBack && (
            <motion.div 
              className="back markdown-body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back}</ReactMarkdown>
            </motion.div>
          )}
        </div>
        
        {!showBack && (
          <div className="tap-hint">点击显示答案</div>
        )}
      </motion.div>
      
      {showBack && (
        <div className="action-buttons">
          <button onClick={handleRemember} className="btn-remember">记住了</button>
          <button onClick={handleForget} className="btn-forget">没记住</button>
        </div>
      )}
    </div>
  );
}
