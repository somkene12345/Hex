import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";
import { saveChatToHistory, loadChatHistory } from "../utils/chatStorage";
import pako from 'pako'; // Import pako for decompression
import { decode as base64Decode } from 'base-64';


const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const queryParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const queryChatId = queryParams?.get('chatId');
  const data = queryParams?.get('data');
  const chatId = route?.params?.chatId || queryChatId;

  useEffect(() => {
    const handleData = async () => {
      if (data && chatId) {
        try {
          // Decode base64 to binary string
          const binaryStr = base64Decode(data);
  
          // Convert binary string to Uint8Array
          const byteArray = new Uint8Array(binaryStr.split('').map(c => c.charCodeAt(0)));
  
          // Decompress and parse JSON
          const decompressedData = JSON.parse(pako.inflate(byteArray, { to: 'string' }));
  
          const history = await loadChatHistory();
  
          if (!history[chatId]) {
            await saveChatToHistory(chatId, decompressedData.messages);
            console.log(`✅ Chat saved for chatId: ${chatId}`);
          }
        } catch (err) {
          console.error('❌ Failed to parse or save data:', err);
        }
      }
    };
  
    handleData();
  }, [data, chatId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} />
    </SafeAreaView>
  );
};

export default Index;
