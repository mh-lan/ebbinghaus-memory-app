export function parseMarkdown(markdown: string, sourceName?: string): { front: string, back: string, tags?: string[] }[] {
  // 简单的 Markdown 解析逻辑：
  // 假设 H1, H2, H3 (## 标题) 是正面 (front)
  // 标题下面的内容是背面 (back)
  
  const lines = markdown.split('\n');
  const cards: { front: string, back: string, tags?: string[] }[] = [];
  
  let currentFront = '';
  let currentBack: string[] = [];

  const addCard = () => {
    if (currentFront) {
      const card: any = {
        front: currentFront.trim(),
        back: currentBack.join('\n').trim()
      };
      if (sourceName) {
        card.tags = [sourceName];
      }
      cards.push(card);
    }
  };

  for (const line of lines) {
    if (line.match(/^#{1,4}\s/)) {
      addCard();
      currentFront = line.replace(/^#{1,4}\s/, '');
      currentBack = [];
    } else {
      if (currentFront) {
         currentBack.push(line);
      }
    }
  }
  
  addCard(); // Add the last one
  
  return cards;
}
