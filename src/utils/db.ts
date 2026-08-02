import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

export interface Card {
  id: string;
  front: string;
  back: string;
  stage: number;
  nextReviewDate: number;
  createdAt: number;
  tags?: string[];
}

const CARDS_KEY = 'ebbinghaus_cards';

localforage.config({
  name: 'EbbinghausApp',
  storeName: 'cards_store'
});

export const db = {
  async getCards(): Promise<Card[]> {
    const cards = await localforage.getItem<Card[]>(CARDS_KEY);
    return cards || [];
  },

  async saveCards(cards: Card[]): Promise<void> {
    await localforage.setItem(CARDS_KEY, cards);
  },

  async addCards(newCards: Omit<Card, 'id' | 'createdAt' | 'stage' | 'nextReviewDate'>[]): Promise<void> {
    const cards = await this.getCards();
    const now = Date.now();
    
    // Check for existing cards based on front text and tags (if any)
    const cardsToAdd: Card[] = [];
    
    for (const nc of newCards) {
      const exists = cards.find(c => 
        c.front === nc.front && 
        (c.tags || []).join(',') === (nc.tags || []).join(',')
      );
      
      if (!exists) {
        cardsToAdd.push({
          ...nc,
          id: uuidv4(),
          createdAt: now,
          stage: 0,
          nextReviewDate: now,
        });
      } else {
        // If it exists, update the back content (in case it was updated on Gitee)
        exists.back = nc.back;
      }
    }
    
    await this.saveCards([...cards, ...cardsToAdd]);
  },

  async updateCard(updatedCard: Card): Promise<void> {
    const cards = await this.getCards();
    const index = cards.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      cards[index] = updatedCard;
      await this.saveCards(cards);
    }
  },
  
  async deleteCard(id: string): Promise<void> {
    const cards = await this.getCards();
    await this.saveCards(cards.filter(c => c.id !== id));
  },
  
  async clearAll(): Promise<void> {
    await localforage.clear();
  }
};
