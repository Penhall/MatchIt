// src/lib/react-native-web/AsyncStorage.ts - Substituto web para AsyncStorage
export const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignorar erros
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignorar erros
    }
  },

  clear: async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch {
      // Ignorar erros
    }
  }
};

export default AsyncStorage;
