// screens/Login.tsx
import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useTheme } from '../theme/ThemeContext'

export default function Login({ navigation }: any) {
  const { darkMode } = useTheme()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [isRegister, setRegister] = useState(false)

  const submit = async () => {
    try {
      if (isRegister) await createUserWithEmailAndPassword(auth, email, pass)
      else await signInWithEmailAndPassword(auth, email, pass)
      navigation.goBack()
    } catch (e: any) {
      Alert.alert('Error', e.message)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { color: darkMode ? '#fff' : '#000' }]}>
        {isRegister ? 'Register' : 'Log In'}
      </Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={darkMode ? '#888' : '#666'}
        style={[styles.input, { color: darkMode ? '#fff' : '#000' }]}
      />
      <TextInput
        value={pass}
        onChangeText={setPass}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor={darkMode ? '#888' : '#666'}
        style={[styles.input, { color: darkMode ? '#fff' : '#000' }]}
      />
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>
          {isRegister ? 'Create Account' : 'Sign In'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setRegister(!isRegister)}>
        <Text style={[styles.switchText, { color: darkMode ? '#fff' : '#000' }]}>
          {isRegister ? 'Have an account? Sign In' : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#0066ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  switchText: { marginTop: 12, textAlign: 'center', textDecorationLine: 'underline' },
})
