import React from 'react';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { withLayoutContext } from 'expo-router';
import Index from './index';

const DrawerNavigator = createDrawerNavigator();
const Drawer = withLayoutContext(DrawerNavigator);

function CustomDrawerContent({ navigation }: DrawerContentComponentProps) {
  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity
        style={styles.newChatButton}
        onPress={() => {
          navigation.replace('index');
          navigation.closeDrawer();
        }}
      >
        <Text style={styles.newChatText}>+ New Chat</Text>
      </TouchableOpacity>
    </View>
  );
}

function ScreenWithTopBar({ navigation }: any) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Hex</Text>
        <View style={{ width: 24 }} /> {/* Spacer for symmetry */}
      </View>
      <Index />
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#111',
          width: 250,
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen name="index" component={ScreenWithTopBar} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 4,
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
  },
  newChatText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
});
