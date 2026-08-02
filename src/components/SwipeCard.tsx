import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Card as CardType } from '../utils/db';
import './SwipeCard.css';

interface Props {
  card: CardType;
  onSwipe: (direction: 'left' | 'right') => void;
}

export default function SwipeCard({ card, onSwipe }: Props) {
  const [showBack, setShowBack] = useState(false);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Reset state when card changes
  useEffect(() => {
    setShowBack(false);
    x.set(0);
    controls.set({ x: 0, rotate: 0, scale: 1, filter: "blur(0px)", opacity: 1 });
  }, [card, x, controls]);

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!showBack) setShowBack(true);
      }
      
      if (showBack) {
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          // 右滑：没记住
          await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
          onSwipe('right'); 
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          // 左滑：记住了
          await controls.start({ 
            x: -200,
            scale: 1.1, 
            filter: "blur(12px)", 
            opacity: 0, 
            transition: { duration: 0.3, ease: "easeOut" } 
          });
          onSwipe('left');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showBack, controls, onSwipe]);

  const rotate = useTransform(x, [-200, 200], [-10, 10]);

  const handleDragEnd = async (_event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      // 右滑：没记住
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      // 左滑：记住了
      await controls.start({ 
        x: -200,
        scale: 1.1, 
        filter: "blur(12px)", 
        opacity: 0, 
        transition: { duration: 0.3, ease: "easeOut" } 
      });
      onSwipe('left'); 
    } else {
      controls.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="card-container">
      <motion.div
        className="card"
        drag={showBack ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x, rotate }}
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
    </div>
  );
}
