import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StatusBar,
  Platform,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Index from './index';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation }: any) {
  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          navigation.navigate('Home');
          navigation.closeDrawer();
        }}
      >
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>
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
  const { darkMode, toggleTheme } = useTheme(); // ✅ now using ThemeContext

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#000' : '#fff' }}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
      <TopBar onToggleTheme={toggleTheme} darkMode={darkMode} navigation={navigation} />
      <Index />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: '#111',
            width: 240,
          },
        }}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen name="Home" component={ScreenWithTopBar} />
      </Drawer.Navigator>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#111',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  newChatButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  newChatText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
