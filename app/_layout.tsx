import React, { useRef, useState } from "react";
import { Stack } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SIDEBAR_WIDTH = 200;

export default function RootLayout() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  const toggleSidebar = () => {
    Animated.timing(sidebarAnim, {
      toValue: sidebarOpen ? -SIDEBAR_WIDTH : 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setSidebarOpen(!sidebarOpen));
  };

  const handleNewChat = () => {
    router.replace("/");
    if (sidebarOpen) toggleSidebar();
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <Animated.View style={[styles.sidebar, { left: sidebarAnim }]}>
        <Text style={styles.sidebarTitle}>Hex</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Text style={styles.newChatText}>+ New Chat</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
        <Ionicons
          name={sidebarOpen ? "close" : "menu"}
          size={28}
          color="#000"
        />
      </TouchableOpacity>

      {/* Main content */}
      <View style={styles.main}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#111",
    padding: 16,
    zIndex: 2,
  },
  sidebarTitle: {
    color: "white",
    fontSize: 20,
    marginBottom: 24,
  },
  newChatButton: {
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 6,
  },
  newChatText: {
    color: "#fff",
    textAlign: "center",
  },
  toggleButton: {
    position: "absolute",
    top: 40,
    left: 12,
    zIndex: 3,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    elevation: 4,
  },
  main: {
    flex: 1,
    marginLeft: 0,
  },
});
