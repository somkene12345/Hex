import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchGroqResponse } from '../services/groqService';
import { pushChatToRTDB, getUserId } from './firebaseService';

const HISTORY_KEY = 'chatHistory';

const generateShortTitle = async (messages: any[]) => {
  const sample = messages
    .slice(0, 5)
    .map((m: any) => `${m.role}: ${m.text}`)
    .join('\n');

  const prompt = `Summarize this chat in a maximum of 10 words. Use an objective tone and avoid referring to the user or assistant.\n${sample}`;
  const title = await fetchGroqResponse(prompt);
  return title?.split('\n')[0]?.trim().slice(0, 100) || 'Untitled Chat';
};

export const saveChatToHistory = async (chatId: string, messages: any[], uuid?: string) => {
    const historyRaw = await AsyncStorage.getItem(HISTORY_KEY);
    const history = historyRaw ? JSON.parse(historyRaw) : {};
  
    const previous = history[chatId] || {};
    const alreadyHasTitle = !!previous.title;
    const title = alreadyHasTitle ? previous.title : await generateShortTitle(messages);
  
    history[chatId] = {
      ...previous,
      messages,
      timestamp: Date.now(),
      title,
      uuid: uuid || previous.uuid || undefined,
    };
  
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  };
  

  

export const loadChatHistory = async (): Promise<Record<string, any>> => {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  };
  
export async function deleteChatFromHistory(id: string) {
  try {
    const raw = await AsyncStorage.getItem('chatHistory');
    if (!raw) return {};

    const history = JSON.parse(raw);
    console.log('🧾 Loaded history for deletion:', history);

    if (history[id]) {
      delete history[id];
      console.log(`✅ Deleted chat ${id}`);
    } else {
      console.warn(`⚠️ Chat ${id} not found`);
    }

    await AsyncStorage.setItem('chatHistory', JSON.stringify(history));
    return history;
  } catch (e) {
    console.error('❌ Error deleting chat:', e);
    throw e;
  }
}

  

export const clearChatHistory = async () => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};

export const updateChatTitle = async (chatId: string, newTitle: string) => {
    const history = await loadChatHistory();
    if (history[chatId]) {
      history[chatId].title = newTitle;
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  
      // 🔄 Sync updated title with RTDB
      const userId = await getUserId();
      if (userId) {
        await pushChatToRTDB(chatId, {
          ...history[chatId],
          title: newTitle,
        });
      }
    }
  };
  

export const toggleFavoriteChat = async (chatId: string) => {
  const history = await loadChatHistory();
  if (history[chatId]) {
    history[chatId].favorite = !history[chatId].favorite;
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

export const togglePinChat = async (chatId: string) => {
  const history = await loadChatHistory();
  if (history[chatId]) {
    history[chatId].pinned = !history[chatId].pinned;
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};

export const exportChatAsJSON = async (chatId: string): Promise<string | null> => {
  const history = await loadChatHistory();
  if (!history[chatId]) return null;
  return JSON.stringify(history[chatId], null, 2);
};

export const exportChatAsHexChat = async (chatId: string): Promise<string | null> => {
  return exportChatAsJSON(chatId); // Treat .hexchat as JSON for this app
};

export const exportChatAsMarkdown = async (chatId: string) => {
    const h = await loadChatHistory();
    const chat = h[chatId];
    if (!chat) return '';
    return chat.messages.map(m => `${m.role === 'user' ? '**You**' : '**Bot**'}: ${m.text}`).join('\n\n');
  };
  
  export const exportChatAsPDF = async (chatId: string) => {
    // Simplest fallback: share Markdown as PDF later
    return exportChatAsMarkdown(chatId);
  };
