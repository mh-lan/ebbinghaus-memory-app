import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Review from './pages/Review';
import List from './pages/List';
import Settings from './pages/Settings';
import { db } from './utils/db';
import { parseMarkdown } from './utils/markdown';

export default function App() {
  useEffect(() => {
    // 自动检查网络更新
    const checkNetworkUpdates = async () => {
      const networkUrl = localStorage.getItem('network_url');
      const networkSource = localStorage.getItem('network_source');
      if (networkUrl && networkSource) {
        try {
          const response = await fetch(networkUrl);
          if (response.ok) {
            const text = await response.text();
            const newCards = parseMarkdown(text, networkSource);
            if (newCards.length > 0) {
              await db.addCards(newCards);
              console.log(`Auto-synced ${newCards.length} cards from ${networkSource}`);
            }
          }
        } catch (e) {
          console.error("Auto-sync failed", e);
        }
      }
    };
    checkNetworkUpdates();
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Review />} />
        <Route path="/list" element={<List />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
