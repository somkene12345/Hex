import { db, auth } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, set, get, child } from 'firebase/database';
import { loadChatHistory, saveChatToHistory } from './chatStorage';

export const getUserId = () => auth.currentUser?.uid || null;

export const pushChatToRTDB = async (chatId: string, data: any) => {
  const uid = getUserId();
  if (!uid) return;

  const userRef = ref(db, `users/${uid}/chats/${chatId}`);
  await set(userRef, data);
};

export const syncOnLogin = async () => {
  const uid = getUserId();
  if (!uid) return {};

  const snapshot = await get(child(ref(db), `users/${uid}/chats`));
  const rtdbChats = snapshot.exists() ? snapshot.val() : {};
  const localChats = await loadChatHistory();

  const merged: Record<string, any> = { ...localChats };

  for (const id in rtdbChats) {
    if (
      !localChats[id] ||
      (rtdbChats[id].messages?.length || 0) > (localChats[id]?.messages?.length || 0)
    ) {
      merged[id] = rtdbChats[id];
      await saveChatToHistory(id, rtdbChats[id].messages);
    }
  }

  return merged;
};
