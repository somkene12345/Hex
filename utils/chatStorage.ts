import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'chatHistory';

export const saveChatToHistory = async (chatId: string, messages: any[]) => {
  const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
  const history = historyRaw ? JSON.parse(historyRaw) : {};
  history[chatId] = {
    messages,
    timestamp: Date.now()
  };
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const loadChatHistory = async () => {
  const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
  return historyRaw ? JSON.parse(historyRaw) : {};
};

export const deleteChatFromHistory = async (chatId: string) => {
  const history = await loadChatHistory();
  delete history[chatId];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const clearChatHistory = async () => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};
