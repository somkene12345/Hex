// ./app/index.tsx
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView, Alert } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";
import { saveChatToHistory, loadChatHistory } from "../utils/chatStorage";
import { pushChatToRTDB, getChatByUUID } from "../utils/firebaseService";
import { decode as base64Decode } from "base-64";
import pako from "pako";
import { auth } from "../services/firebase";
import { v4 as uuidv4 } from 'uuid';


const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const [chatTitle, setChatTitle] = useState<string>("");
  const [localMessages, setLocalMessages] = useState<any[]>([]);

  const queryParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const queryChatId = queryParams?.get("chatId");
  const data = queryParams?.get("data");
  const uuid = queryParams?.get("uuid");
  const chatId = route?.params?.chatId || queryChatId;

  useEffect(() => {
    const loadData = async () => {
      if (!chatId) return;

      const history = await loadChatHistory();

      try {
        if (uuid && auth.currentUser) {
          const remote = await getChatByUUID(uuid);
          if (remote) {
            await saveChatToHistory(chatId, remote.messages);
            console.log("✅ Loaded chat from RTDB using UUID");
          } else {
            console.warn("⚠️ No chat found in RTDB with UUID");
          }
        } else if (data) {
          const binaryStr = base64Decode(data);
          const byteArray = new Uint8Array(binaryStr.split("").map((c) => c.charCodeAt(0)));
          const decompressed = JSON.parse(pako.inflate(byteArray, { to: "string" }));

          if (!history[chatId]) {
            await saveChatToHistory(chatId, decompressed.messages);
            console.log("✅ Loaded chat from shared compressed link");
          }
        }
      } catch (err) {
        console.error("❌ Failed to process shared link:", err);
        Alert.alert("Error", "Failed to load shared chat data.");
      }
    };

    loadData();
  }, [chatId, uuid, data]);

  const onChatUpdate = useCallback(
    async (messages: any[], title: string) => {
      const history = await loadChatHistory();
      const existing = history[chatId];
      const uuid = existing?.uuid || uuidv4();
  
      await saveChatToHistory(chatId, messages, uuid);
      await pushChatToRTDB(chatId, {
        messages,
        title,
        timestamp: Date.now(),
        uuid,
      });
    },
    [chatId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} key={chatId} onUpdate={onChatUpdate} />
    </SafeAreaView>
  );
};

export default Index;
