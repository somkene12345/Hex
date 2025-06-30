// _layout.tsx
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
  const handleExport = async (format: 'json' | 'markdown' | 'pdf') => {
    const id = menuChatId!;
    let content;
    if (format === 'json') content = await exportChatAsJSON(id);
    else if (format === 'markdown') content = await exportChatAsMarkdown(id);
    else content = await exportChatAsPDF(id);
    Share.share({ message: content || '' });
    closeMenu();
  };

  const onMenuSelect = async (action: string) => {
    const id = menuChatId!;
    switch (action) {
      case 'rename':
        const newTitle = prompt('New title', history[id].title) || history[id].title;
        await updateChatTitle(id, newTitle);
        break;
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
      case 'delete':
        Alert.alert('Delete Chat?', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: async () => await deleteChatFromHistory(id) },
        ]);
        break;
    }
    setHistory(await loadChatHistory());
    closeMenu();
  };

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity style={styles.newChatButton} onPress={() => {
        const newId = Date.now().toString();
        navigation.navigate('Home', { chatId: newId });
        navigation.closeDrawer();
      }}>
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>

      <Text style={[styles.newChatText, { marginTop: 16, fontWeight: 'bold' }]}>History</Text>
      {Object.entries(history)
        .sort(([, a], [, b]) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.timestamp - a.timestamp)
        .map(([id, x]) => {
          const isActive = id === activeChatId;
          return (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
                onPress={() => {
                  navigation.navigate('Home', { chatId: id });
                  navigation.closeDrawer();
                }}>
                <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 14 }} numberOfLines={1}>
                  {x.title} {x.favorite ? '⭐' : ''} {x.pinned ? '📌' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openMenu(id)}>
                <Ionicons name="ellipsis-vertical" size={20} color={darkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>
          );
        })}

      <Modal transparent visible={menuVisible} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu} />
        <View style={[styles.modalContent, { backgroundColor: darkMode ? '#222' : '#fff' }]}>
          {['rename','favorite','pin','export_json','export_md','export_pdf','delete'].map(action => (
            <TouchableOpacity key={action} style={styles.menuOption} onPress={() => onMenuSelect(action)}>
              <Text style={[styles.menuText, action === 'delete' && { color: 'red' }]}>
                {{
                  rename: 'Rename',
                  favorite: 'Favorite / Unfavorite',
                  pin: 'Pin / Unpin',
                  export_json: 'Export JSON',
                  export_md: 'Export Markdown',
                  export_pdf: 'Export PDF',
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
