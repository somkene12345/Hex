import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, ref, get, set } from 'firebase/database';
import { auth } from '../services/firebase';
import { loadChatHistory, saveChatToHistory } from './chatStorage';

const db = getDatabase();

export const getUserId = () => auth.currentUser?.uid || null;

export const pushChatToRTDB = async (chatId: string, chatData: any) => {
  const uid = getUserId();
  if (!uid) return;
  const userRef = ref(db, `users/${uid}/chats/${chatId}`);
  await set(userRef, chatData);
};

export const syncOnLogin = async () => {
  const uid = getUserId();
  if (!uid) return {};

  const userRef = ref(db, `users/${uid}/chats`);
  const snap = await get(userRef);
  const remoteChats = snap.exists() ? snap.val() : {};
  const localChats = await loadChatHistory();

  const mergedChats: Record<string, any> = { ...localChats };

  for (const chatId in remoteChats) {
    const remote = remoteChats[chatId];
    const local = localChats[chatId];
    const remoteLen = remote?.messages?.length || 0;
    const localLen = local?.messages?.length || 0;

    if (!local || remoteLen > localLen) {
      mergedChats[chatId] = {
        ...remote,
        title: remote.title || 'Untitled Chat',
        timestamp: remote.timestamp || Date.now(),
      };
    }
  }

  await AsyncStorage.setItem('chatHistory', JSON.stringify(mergedChats));
  return mergedChats;
};
