import React from "react";
import { SafeAreaView } from "react-native";
import Chat from "../components/Chat";
import { useTheme } from "../theme/ThemeContext";

const Index = ({ route }: any) => {
  const chatId = route?.params?.chatId ?? null;
  const { darkMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: darkMode ? "#000" : "#fff" }}>
      <Chat chatId={chatId} />
    </SafeAreaView>
  );
};

export default Index;
