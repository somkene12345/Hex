import React from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";

const Index = ({ route }: any) => {
  const { darkMode } = useTheme();
  const queryChatId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get("chatId") : null;
  const chatId = route?.params?.chatId || queryChatId;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} />
    </SafeAreaView>
  );
};

export default Index;
