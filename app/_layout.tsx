import React, { useState, useCallback } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Index from './index';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import {
  loadChatHistory,
  deleteChatFromHistory,
  toggleFavoriteChat,
  togglePinChat,
  updateChatTitle,
  exportChatAsJSON,
  exportChatAsMarkdown,
  exportChatAsPDF,
} from '../utils/chatStorage';
import { fetchGroqResponse } from '../services/groqService';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation, route }: any) {
  const { darkMode } = useTheme();
  const styles = getDrawerStyles(darkMode);
  const [history, setHistory] = useState<Record<string, any>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const activeChatId = route?.params?.chatId;

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const data = await loadChatHistory();
        setHistory(data);
      };
      load();
    }, [])
  );

  const openMenu = (chatId: string) => {
    setMenuChatId(chatId);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setMenuChatId(null);
  };

  const handleExport = async (format: 'json' | 'markdown' | 'pdf' | 'hexchat', shareOnly = false) => {
    const id = menuChatId!;
    let content = '';
    let extension = '';
    let mimeType = 'text/plain';

    switch (format) {
      case 'json':
      case 'hexchat':
        content = (await exportChatAsJSON(id)) ?? '';
        extension = format;
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = await exportChatAsMarkdown(id);
        extension = 'md';
        mimeType = 'text/markdown';
        break;
      case 'pdf':
        content = await exportChatAsPDF(id);
        extension = 'pdf';
        mimeType = 'application/pdf';
        break;
    }

    const fileName = `chat_${Date.now()}.${extension}`;
    if (Platform.OS === 'web') {
      const blob = new Blob([content], { type: mimeType });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });
      if (shareOnly) {
        await Share.share({
          url: fileUri,
          message: `Here's a chat export from Hex`,
        });
      } else {
        Alert.alert('Exported', `Saved to device: ${fileName}`);
      }
    }

    closeMenu();
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
  
      if (!result || !result.assets || !result.assets[0]) return;
  
      const { uri, name } = result.assets[0];
      if (!uri) {
        Alert.alert('Import Failed', 'Unable to access the selected file.');
        return;
      }
  
      const content = await FileSystem.readAsStringAsync(uri);
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        Alert.alert('Invalid File', 'This file is not a valid JSON or .hexchat chat.');
        return;
      }
  
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.messages)) {
        Alert.alert('Invalid File', 'This file is not a valid chat export.');
        return;
      }
  
      const newId = Date.now().toString();
      const title = parsed.title || name || `Imported Chat`;
  
      const historyRaw = await loadChatHistory();
      historyRaw[newId] = {
        ...parsed,
        title,
        timestamp: Date.now(),
      };
  
      await AsyncStorage.setItem('chatHistory', JSON.stringify(historyRaw));
      setHistory(historyRaw);
      navigation.navigate('Home', { chatId: newId }); // ✅ Open immediately
    } catch (e) {
      const errorMessage = (e as Error).message || 'Unknown error while importing chat.';
      Alert.alert('Import Failed', errorMessage);
    }
  };  

  const onMenuSelect = async (action: string) => {
    const id = menuChatId!;
    switch (action) {
      case 'rename':
        const newTitle = prompt('New title', history[id].title) || history[id].title;
        await updateChatTitle(id, newTitle);
        break;

      case 'regenerate': {
        const chat = history[id];
        if (!chat) return;

        const sampleMessages = chat.messages.slice(0, 20);
        const sample = sampleMessages
          .map((m: any) => `${m.role}: ${m.text}`)
          .join('\n');

        const prompt = `Summarize this chat in a maximum of 10 words. Use an objective tone and do not refer to the user or assistant.\n${sample}`;
        const newTitle = await fetchGroqResponse(prompt);

        if (newTitle) {
          const title = newTitle.split('\n')[0].trim().slice(0, 100);
          await updateChatTitle(id, title);
        }
        break;
      }

      case 'favorite':
        await toggleFavoriteChat(id);
        break;

      case 'pin':
        await togglePinChat(id);
        break;

      case 'export_json':
        await handleExport('json');
        break;

      case 'export_md':
        await handleExport('markdown');
        break;

      case 'export_pdf':
        await handleExport('pdf');
        break;

      case 'export_hexchat':
        await handleExport('hexchat'); // Export to device
        break;

      case 'share_hexchat':
        await handleExport('hexchat', true); // Share only
        break;

        case 'delete':
          Alert.alert('Delete Chat?', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  const updated = await deleteChatFromHistory(id);
                  setHistory(updated);
                  if (id === activeChatId) {
                    const newId = Date.now().toString();
                    navigation.navigate('Home', { chatId: newId }); // go to a new blank chat
                  }
                } catch (e) {
                  Alert.alert('Error', 'Failed to delete chat.');
                }
                closeMenu();
              },
            },
          ]);
          break;        
    }

    setHistory(await loadChatHistory());
    closeMenu();
  };

  const openChat = (id: string) => {
    if (id !== activeChatId) {
      navigation.navigate('Home', { chatId: id });
    }
  };
  

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          const newId = Date.now().toString();
          openChat(newId);
        }}
      >
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>

      <Text style={[styles.newChatText, { marginTop: 16, fontWeight: 'bold' }]}>History</Text>

      {Object.entries(history)
        .sort(([, a], [, b]) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.timestamp - a.timestamp)
        .map(([id, x]) => {
          const isActive = id === activeChatId;
          return (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[
                    styles.newChatButton,
                    {
                      flex: 1,
                      backgroundColor: isActive ? (darkMode ? '#444' : '#ccc') : (darkMode ? '#222' : '#eee'),
                      borderWidth: isActive ? 1 : 0,
                      borderColor: isActive ? '#00f' : 'transparent',
                    },
                  ]}
                  onPress={() => openChat(id)}
                >
                  <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 14 }} numberOfLines={1}>
                    {(x.title || 'Untitled Chat') + (x.favorite ? ' ⭐' : '') + (x.pinned ? ' 📌' : '')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => openMenu(id)}>
                <Ionicons name="ellipsis-vertical" size={20} color={darkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          );
        })}

      <TouchableOpacity
        style={[styles.newChatButton, { marginTop: 16, backgroundColor: darkMode ? '#333' : '#ddd' }]}
        onPress={handleImport}
      >
        <Text style={[styles.newChatText, { color: darkMode ? '#fff' : '#000' }]}>📂 Import Chat</Text>
      </TouchableOpacity>

      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu} />
        <View style={[styles.modalContent, { backgroundColor: darkMode ? '#222' : '#fff' }]}>
          {[
            'rename',
            'regenerate',
            'favorite',
            'pin',
            'export_json',
            'export_md',
            'export_pdf',
            'export_hexchat', // <-- New
            'share_hexchat', // <-- New
            'delete',
          ].map((action) => (
            <TouchableOpacity key={action} style={styles.menuOption} onPress={() => onMenuSelect(action)}>
              <Text style={[styles.menuText, action === 'delete' && { color: 'red' }]}>
                {{
                  rename: 'Rename',
                  regenerate: 'Regenerate Title',
                  favorite: 'Favorite / Unfavorite',
                  pin: 'Pin / Unpin',
                  export_json: 'Export JSON',
                  export_md: 'Export Markdown',
                  export_pdf: 'Export PDF',
                  export_hexchat: 'Export .hexchat File',
                  share_hexchat: 'Share .hexchat File',
                  delete: 'Delete',
                }[action]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

function TopBar({ onToggleTheme, darkMode, navigation }: any) {
  const styles = getDrawerStyles(darkMode);
  return (
    <View style={[styles.topBar, { backgroundColor: darkMode ? '#111' : '#f5f5f5' }]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={24} color={darkMode ? '#fff' : '#000'} style={{ marginRight: 12 }} />
      </TouchableOpacity>
      <Text style={[styles.topBarTitle, { color: darkMode ? '#fff' : '#000', flex: 1 }]}>Hex</Text>
      <TouchableOpacity onPress={onToggleTheme}>
        <Ionicons name={darkMode ? 'sunny' : 'moon'} size={24} color={darkMode ? '#FFD700' : '#333'} />
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

function InnerLayout() {
  const { darkMode } = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: darkMode ? '#111' : '#fff',
          width: 260,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} route={props.state.routes[0]} />}
    >
      <Drawer.Screen name="Home" component={ScreenWithTopBar} />
    </Drawer.Navigator>
  );
}

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
    topBarTitle: { fontSize: 20, fontWeight: 'bold' },
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
      marginBottom: 6,
    },
    newChatText: { color: darkMode ? '#fff' : '#000', fontSize: 16, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    modalContent: { position: 'absolute', top: 120, right: 20, padding: 8, borderRadius: 6, elevation: 10 },
    menuOption: { paddingVertical: 10, paddingHorizontal: 12 },
    menuText: { fontSize: 16, color: darkMode ? '#fff' : '#000' },
  });
