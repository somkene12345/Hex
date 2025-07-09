import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useTheme } from '../theme/ThemeContext';

export default function LoginScreen({ navigation }: any) {
  const { darkMode } = useTheme();
  const styles = getStyles(darkMode);
  const auth = getAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (register = false) => {
    setLoading(true);
    try {
      const fn = register ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      await fn(auth, email.trim(), password);
      navigation.replace('Home');
    } catch (e: any) {
      Alert.alert('Auth failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Hex</Text>
      <TextInput placeholder="Email" style={styles.input} placeholderTextColor={darkMode ? '#bbb' : '#555'} value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} placeholderTextColor={darkMode ? '#bbb' : '#555'} secureTextEntry value={password} onChangeText={setPassword} />
      {loading ? <ActivityIndicator /> : (
        <>
          <TouchableOpacity style={styles.btn} onPress={() => handleAuth(false)}>
            <Text style={styles.btnText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.outline]} onPress={() => handleAuth(true)}>
            <Text style={[styles.btnText, styles.outlineText]}>Sign Up</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const getStyles = (dark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: dark ? '#000' : '#fff' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: dark ? '#fff' : '#000', textAlign: 'center' },
    input: { borderWidth: 1, borderColor: dark ? '#444' : '#ccc', borderRadius: 6, padding: 12, marginBottom: 12, color: dark ? '#fff' : '#000' },
    btn: { backgroundColor: '#4e8ef7', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontWeight: '600' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4e8ef7' },
    outlineText: { color: '#4e8ef7' },
  });
