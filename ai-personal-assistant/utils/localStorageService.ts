import { HistoryItemType } from '../types';

const APP_PREFIX = 'aiPersonalAssistant_';

export const storageService = {
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(APP_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  },

  setItem: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(APP_PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(APP_PREFIX + key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
    }
  },

  getHistory: <T extends HistoryItemType>(key: string): T[] => {
    return storageService.getItem<T[]>(key) || [];
  },

  addHistoryItem: <T extends HistoryItemType>(key: string, item: T): T[] => {
    const history = storageService.getHistory<T>(key);
    const updatedHistory = [item, ...history].slice(0, 50); // Keep last 50 items
    storageService.setItem(key, updatedHistory);
    return updatedHistory;
  },

  removeHistoryItem: <T extends HistoryItemType>(key: string, itemId: string): T[] => {
    const history = storageService.getHistory<T>(key);
    const updatedHistory = history.filter(item => item.id !== itemId);
    storageService.setItem(key, updatedHistory);
    return updatedHistory;
  },
};
