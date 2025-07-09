import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getAuth, signOut } from 'firebase/auth';

export default function AccountScreen({ navigation }: any) {
  const { darkMode } = useTheme();
  const styles = getStyles(darkMode);
  const user = getAuth().currentUser;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: user?.photoURL || 'https://ui-avatars.com/api/?name=Hex+User' }}
        style={styles.avatar}
      />
      <Text style={styles.email}>{user?.email}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => {
        signOut(getAuth()).then(() => navigation.replace('Login'));
      }}>
        <Text style={styles.btnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: dark ? '#000' : '#fff' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
    email: { fontSize: 18, color: dark ? '#fff' : '#000', marginBottom: 40 },
    btn: { backgroundColor: '#e74c3c', padding: 12, borderRadius: 6 },
    btnText: { color: '#fff', fontWeight: '600' },
  });
