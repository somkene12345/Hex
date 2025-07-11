import React, { useState, useCallback, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  ScrollView,
   Image,
   Pressable,
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
import * as Clipboard from 'expo-clipboard'; // Replace deprecated Clipboard
import pako from 'pako'; // Import pako for compression
import { encode as base64Encode } from 'base-64';
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '../services/firebase'
import Login from './login'; // Make sure this screen exists
import SettingsScreen from './SettingsScreen'
import { syncOnLogin } from '../utils/firebaseService';
import { getGravatarUrl } from '../utils/getGravatarUrl';
import { getUserId, pushChatToRTDB } from '../utils/firebaseService';


const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation, route }: any) {
  const { darkMode } = useTheme();
  const styles = getDrawerStyles(darkMode);
  const [history, setHistory] = useState<Record<string, any>>({});
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuChatId, setMenuChatId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(route?.params?.chatId || null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const confirmDeleteChat = async () => {
    console.log(`🗑 Confirmed deletion of chat ${selectedChatId}`);
    if (selectedChatId) {
      await deleteChatFromHistory(selectedChatId);
    }
    setShowDeleteModal(false);
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
    console.log('📥 Import started');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('📄 DocumentPicker result:', result);

      if (!result.assets || !result.assets[0]) {
        console.warn('⚠️ No file selected');
        return;
      }

      const asset = result.assets[0];
      const { uri, name } = asset;

      let content = '';
      if (Platform.OS === 'web') {
        const base64 = uri.split(',')[1];
        content = atob(base64);
        console.log('🌐 Web file loaded using atob');
      } else {
        content = await FileSystem.readAsStringAsync(uri);
        console.log('📱 Native file loaded using FileSystem');
      }

      console.log('📄 File content (first 300 chars):', content.slice(0, 300));

      const parsed = JSON.parse(content);
      if (!parsed.messages || !Array.isArray(parsed.messages)) {
        console.error('❌ Invalid structure. Missing messages array.');
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
      console.log(`✅ Chat imported under ID ${newId}`);

      setHistory(historyRaw);
      navigation.navigate('Home', { chatId: newId });
    } catch (e: unknown) {
      console.error('❌ Import failed:', e);

      const message = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Import Failed', message);
    }
  };

  const handleShare = async (menuChatId: string | null | undefined, history: Record<string, any>) => {
    if (!menuChatId || !history[menuChatId]) {
      Alert.alert('Error', 'No chat selected for sharinChat not found.');
      return;
    }
    const chat = history[menuChatId];
    if (!chat) {
      Alert.alert('Error', 'Chat not found.');
      return;
    }
    const baseUrl = 'https://hex-jet.vercel.app'; // Update if changed

    try {
      let shareableLink = '';
  
      // ✅ If signed in, try to get or push UUID
      const uid = getUserId();
      if (uid) {
        const uuid = chat.uuid || (await pushChatToRTDB(menuChatId, {
          messages: chat.messages,
          title: chat.title,
          timestamp: chat.timestamp || Date.now(),
          uuid: chat.uuid, // might already exist
        }));
  
        shareableLink = `${baseUrl}?uuid=${uuid}`;
      } else {
        // ⚠️ Anonymous/compressed fallback
        const compressed = pako.deflate(
          JSON.stringify({
            title: chat.title,
            timestamp: chat.timestamp,
            messages: chat.messages,
          })
        );
  
        const base64Data = base64Encode(String.fromCharCode(...compressed));
        shareableLink = `${baseUrl}?chatId=${menuChatId}&data=${encodeURIComponent(base64Data)}`;
      }
  
      // Share or copy
      if (navigator.share) {
        await navigator.share({
          title: chat.title || 'Chat Export',
          text: 'Here’s a link to a chat in Hex.',
          url: shareableLink,
        });
      } else {
        await Clipboard.setStringAsync(shareableLink);
        Alert.alert('Link Copied', 'The shareable link has been copied to your clipboard.');
      }
    } catch (err) {
      console.error('❌ Share failed:', err);
      Alert.alert('Error', 'Failed to generate the shareable link.');
    }
  };

  const onMenuSelect = async (action: string) => {
    const id = menuChatId!;
    switch (action) {
      case 'rename': {
        const newTitle = prompt('New title', history[id]?.title) || history[id]?.title;
        await updateChatTitle(id, newTitle);
        break;
      }

      case 'regenerate': {
        const chat = history[id];
        if (!chat) return;

        const sampleMessages = chat.messages.slice(0, 20);
        const sample = sampleMessages.map((m: any) => `${m.role}: ${m.text}`).join('\n');

        const prompt = `Summarize this chat in a maximum of 10 words. Use an objective tone and do not refer to the user or assistant.\n${sample}`;
        const newTitle = await fetchGroqResponse(prompt);
        if (newTitle) {
          await updateChatTitle(id, newTitle.split('\n')[0].trim().slice(0, 100));
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
        await handleExport('hexchat');
        break;

      case 'share':
        await handleShare(menuChatId, history);
        break;

      case 'delete':
        setSelectedChatId(id);
        setShowDeleteModal(true); // open delete confirmation modal
        break;
    }

    setMenuVisible(false);
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 10 }}>
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
                        backgroundColor: isActive
                          ? darkMode ? '#444' : '#ccc'
                          : darkMode ? '#222' : '#eee',
                        borderWidth: isActive ? 1 : 0,
                        borderColor: isActive ? '#00f' : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      setActiveChatId(id);
                      console.log(`🖱 Clicked chat ${id}, forcing full navigation reset`);
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home', params: { chatId: id } }],
                      });
                    }}
                  >
                    <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 14 }} numberOfLines={1}>
                      {(x.title || 'Untitled Chat') +
                        (x.favorite ? ' ⭐' : '') +
                        (x.pinned ? ' 📌' : '')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => openMenu(id)}>
                  <Ionicons name="ellipsis-vertical" size={20} color={darkMode ? '#fff' : '#000'} />
                </TouchableOpacity>
              </View>
            );
          })}
      </ScrollView>

      <TouchableOpacity
        style={[styles.newChatButton, { marginTop: 16, backgroundColor: darkMode ? '#333' : '#ddd' }]}
        onPress={handleImport}
      >
        <Text style={[styles.newChatText, { color: darkMode ? '#fff' : '#000' }]}>📂 Import Chat</Text>
      </TouchableOpacity>

      {/* Action Menu Modal */}
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
            'export_hexchat',
            'share', // Updated to "share"
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
                  share: 'Share', // Updated text
                  delete: 'Delete',
                }[action]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      <Modal visible={showDeleteModal} transparent animationType="fade">
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
    <View
      style={{
        backgroundColor: darkMode ? '#222' : '#fff',
        padding: 20,
        borderRadius: 12,
        width: '80%',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 18, marginBottom: 20, textAlign: 'center' }}>
        Are you sure you want to delete this chat?
      </Text>
      <View style={{ flexDirection: 'row', gap: 10 }}>
      <TouchableOpacity
                onPress={async () => {
                  if (!selectedChatId) return;
                  try {
                    const updated = await deleteChatFromHistory(selectedChatId);
                    setHistory(updated);
                    if (selectedChatId === activeChatId) {
                      const newId = Date.now().toString();
                      navigation.navigate('Home', { chatId: newId });
                    }
                  } catch (e) {
                    console.error('❌ Failed to delete chat:', e);
                    Alert.alert('Error', 'Failed to delete chat.');
                  }
                  setShowDeleteModal(false);
                }}
                style={{ backgroundColor: 'red', paddingVertical: 5, paddingHorizontal: 12.5, borderRadius: 8, flex: 1 }}
              >
                <Text style={{ color: '#fff', textAlign: 'center' }}>Delete</Text>
              </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowDeleteModal(false)}
          style={{ backgroundColor: '#666', paddingVertical: 5, paddingHorizontal: 12.5, borderRadius: 8, flex: 1 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
}

function TopBar({ onToggleTheme, darkMode, navigation }: any) {
  const styles = getDrawerStyles(darkMode);
  const user = auth.currentUser;
  const [modalVisible, setModalVisible] = useState(false);

  const toggleDropdown = () => {
    setModalVisible(!modalVisible);
  };

  const handleLogout = async () => {
    setModalVisible(false);
    await auth.signOut();
    navigation.navigate('Login' as never);
  };

  const goToSettings = () => {
    setModalVisible(false);
    navigation.navigate('Settings' as never);
  };

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

      <Text style={[styles.topBarTitle, { color: darkMode ? '#fff' : '#000', flex: 1 }]}>Hex</Text>

      <TouchableOpacity onPress={onToggleTheme} style={{ marginRight: 12 }}>
        <Ionicons name={darkMode ? 'sunny' : 'moon'} size={24} color={darkMode ? '#FFD700' : '#333'} />
      </TouchableOpacity>

      {user ? (
        <TouchableOpacity onPress={toggleDropdown}>
          {getGravatarUrl(user.email!) ? (
            <Image
          source={{ uri: getGravatarUrl(user.email!) }}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          ) : (
            <Ionicons name="person-circle-outline" size={32} color={darkMode ? '#fff' : '#000'} />
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
          <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 16 }}>Log In</Text>
        </TouchableOpacity>
      )}

      {/* Modal dropdown menu */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.acctmodalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.dropdown, { backgroundColor: darkMode ? '#222' : '#fff' }]}>
            <TouchableOpacity onPress={goToSettings} style={styles.dropdownItem}>
              <Text style={{ color: darkMode ? '#fff' : '#000' }}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.dropdownItem}>
              <Text style={{ color: 'red' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ScreenWithTopBar({ navigation, route, user }: any) {
  const { darkMode, toggleTheme } = useTheme();
  const chatId = route?.params?.chatId || 'default';

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#000' : '#fff' }}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <TopBar onToggleTheme={toggleTheme} darkMode={darkMode} navigation={navigation} user={user} />
      <Index route={{ params: { chatId } }} />
    </View>
  );
}

function InnerLayout({ user }: { user: User | null }) {
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
      drawerContent={(props) => <CustomDrawerContent {...props} route={props.state.routes[0]} user={user} />}
    >
      <Drawer.Screen name="Home">
        {(props) => <ScreenWithTopBar {...props} user={user} />}
      </Drawer.Screen>
      <Drawer.Screen name="Login" component={Login} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const merged = await syncOnLogin();
        setHistory(merged);
      } else {
        const local = await loadChatHistory();
        setHistory(local);
      }
    });
    return unsub;
  }, []);

  return (
    <ThemeProvider>
      <InnerLayout user={user} />
    </ThemeProvider>
  );
}

const getDrawerStyles = (darkMode: boolean) =>
  StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      elevation: 4,
      zIndex: 100,
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
      marginBottom: 6,
    },
    newChatText: { color: darkMode ? '#fff' : '#000', fontSize: 16, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
    acctmodalOverlay: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 50,
      paddingRight: 10,
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContent: { position: 'absolute', top: 120, right: 20, padding: 8, borderRadius: 6, elevation: 10 },
    menuOption: { paddingVertical: 10, paddingHorizontal: 12 },
    menuText: { fontSize: 16, color: darkMode ? '#fff' : '#000' },
      dropdown: {
    position: 'absolute',
    top: 90,
    right: 10,
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  dropdownItem: {
    paddingVertical: 8,
    fontSize: 16,
  },
  });
