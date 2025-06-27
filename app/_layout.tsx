import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Index from './index';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation }: any) {
  const { darkMode } = useTheme();
  const styles = getDrawerStyles(darkMode);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('chatHistory');
        if (raw) setHistory(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to load history', e);
      }
    };
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.drawerContainer}>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          navigation.navigate('Home', { reset: Date.now() });
          navigation.closeDrawer();
        }}
      >
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>

      <Text style={[styles.historyTitle, { color: darkMode ? '#ccc' : '#555' }]}>History</Text>

      {history.map((item: any) => (
        <TouchableOpacity
          key={item.id}
          style={styles.historyItem}
          onPress={() => {
            navigation.navigate('Home', { chatId: item.id });
            navigation.closeDrawer();
          }}
        >
          <Text style={{ color: darkMode ? '#fff' : '#000' }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
      paddingTop: 60,
      paddingHorizontal: 20,
      backgroundColor: darkMode ? '#111' : '#fff',
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
    historyTitle: {
      fontSize: 14,
      marginBottom: 8,
    },
    historyItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: darkMode ? '#222' : '#eee',
      marginBottom: 8,
    },
  });
