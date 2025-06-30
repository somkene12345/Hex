import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Index from './index';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { loadChatHistory, deleteChatFromHistory } from '../utils/chatStorage'; // 👈

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation }: any) {
  const { darkMode } = useTheme();
  const styles = getDrawerStyles(darkMode);
  const [history, setHistory] = useState<{ [id: string]: any }>({});

  // Reload history when drawer opens
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const h = await loadChatHistory();
        setHistory(h);
      })();
    }, [])
  );

  const handleNewChat = async () => {
    const newId = Date.now().toString();
    navigation.navigate('Home', { chatId: newId });
    navigation.closeDrawer();
  };

  const handleDelete = async (id: string) => {
    await deleteChatFromHistory(id);
    const h = await loadChatHistory();
    setHistory(h);
  };

  return (
    <View style={styles.drawerContainer}>
<TouchableOpacity
  style={[styles.newChatButton, { flex: 1 }]}
  onPress={() => {
    const newChatId = Date.now().toString();
    navigation.navigate("Home", { chatId: newChatId });
    navigation.closeDrawer();
  }}
>
  <Text style={styles.newChatText}>+ New Chat</Text>
</TouchableOpacity>


      <Text style={[styles.newChatText, { marginTop: 16, fontWeight: 'bold' }]}>
        History
      </Text>
      {Object.keys(history)
  .sort((a, b) => history[b].timestamp - history[a].timestamp)
  .map((chatId) => (
    <View key={chatId} style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity
        style={[styles.newChatButton, { flex: 1 }]}
        onPress={() => {
          navigation.navigate("Home", { chatId });
          navigation.closeDrawer();
        }}
      >
        <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 14 }}>
          {new Date(history[chatId].timestamp).toLocaleString()}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          await deleteChatFromHistory(chatId);
          const updated = await loadChatHistory();
          setHistory(updated);
        }}
      >
        <Ionicons name="trash" size={18} color={darkMode ? "#fff" : "#000"} />
      </TouchableOpacity>
    </View>
  ))}
    </View>
  );
}


function TopBar({
  onToggleTheme,
  darkMode,
  navigation,
}: {
  onToggleTheme: () => void;
  darkMode: boolean;
  navigation: any;
}) {
  const styles = getDrawerStyles(darkMode);

  return (
    <View style={[styles.topBar, { backgroundColor: darkMode ? '#111' : '#f5f5f5' }]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons
          name="menu"
          size={24}
          color={darkMode ? '#fff' : '#000'}
          style={{ marginRight: 12 }}
        />
      </TouchableOpacity>

      <Text style={[styles.topBarTitle, { color: darkMode ? '#fff' : '#000', flex: 1 }]}>
        Hex
      </Text>

      <TouchableOpacity onPress={onToggleTheme}>
        <Ionicons
          name={darkMode ? 'sunny' : 'moon'}
          size={24}
          color={darkMode ? '#FFD700' : '#333'}
        />
      </TouchableOpacity>
    </View>
  );
}

function ScreenWithTopBar({ navigation }: any) {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#000' : '#fff' }}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <TopBar onToggleTheme={toggleTheme} darkMode={darkMode} navigation={navigation} />
      <Index />
    </View>
  );
}

// ✅ THIS FUNCTION NO LONGER USES useTheme OUTSIDE THE PROVIDER
function InnerLayout() {
  const { darkMode } = useTheme();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: darkMode ? '#111' : '#fff',
          width: 240,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="Home" component={ScreenWithTopBar} />
    </Drawer.Navigator>
  );
}

// ✅ WRAP THE WHOLE APP SAFELY HERE
export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}

const getDrawerStyles = (darkMode: boolean) =>
  StyleSheet.create({
    topBar: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: '#ccc',
    },
    topBarTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    drawerContainer: {
      flex: 1,
      backgroundColor: darkMode ? '#111' : '#fff',
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    newChatButton: {
      backgroundColor: darkMode ? '#333' : '#ddd',
      padding: 12,
      borderRadius: 6,
      marginBottom: 12,
    },
    newChatText: {
      color: darkMode ? '#fff' : '#000',
      fontSize: 16,
      textAlign: 'center',
    },
  });
