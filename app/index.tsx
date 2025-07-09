// ./app/index.tsx
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";
import { saveChatToHistory, loadChatHistory } from "../utils/chatStorage";
import { pushChatToRTDB } from "../utils/firebaseService";
import pako from "pako";
import { decode as base64Decode } from "base-64";

const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [chatTitle, setChatTitle] = useState<string>("");

  // Handle URL-based imports (compressed chat link)
  const queryParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const queryChatId = queryParams?.get("chatId");
  const data = queryParams?.get("data");
  const chatId = route?.params?.chatId || queryChatId;

  // Process incoming shared chat link
  useEffect(() => {
    const handleData = async () => {
      if (data && chatId) {
        try {
          const binaryStr = base64Decode(data);
          const byteArray = new Uint8Array(binaryStr.split("").map((c) => c.charCodeAt(0)));
          const decompressed = JSON.parse(pako.inflate(byteArray, { to: "string" }));

          const history = await loadChatHistory();
          if (!history[chatId]) {
            await saveChatToHistory(chatId, decompressed.messages);
          }
        } catch (err) {
          console.error("❌ Failed to parse or save data:", err);
        }
      }
    };
    handleData();
  }, [data, chatId]);

  // Listen for message updates via Chat component
  const onChatUpdate = useCallback(
    async (messages: any[], title: string) => {
      setLocalMessages(messages);
      setChatTitle(title);

      await saveChatToHistory(chatId, messages);
      await pushChatToRTDB(chatId, {
        messages,
        title,
        timestamp: Date.now(),
      });
      console.log("🔁 Chat synced to RTDB", chatId);
    },
    [chatId]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      {/* Chat component must accept onUpdate prop */}
      <Chat chatId={chatId} key={chatId} onUpdate={onChatUpdate} />
    </SafeAreaView>
  );
};

export default Index;
