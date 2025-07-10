import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { auth } from '../services/firebase';
import { useTheme } from '../theme/ThemeContext';
import { reauthenticateWithCredential, updatePassword, updateProfile, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { clearChatHistory } from '../utils/chatStorage';
import { getGravatarUrl } from '../utils/getGravatarUrl';

export default function SettingsScreen() {
  const { darkMode } = useTheme();
  const user = auth.currentUser!;
  const [name, setName] = useState(user.displayName || '');
  const [newPass, setNewPass] = useState('');

  const changePassword = async () => {
    try {
      const credential = EmailAuthProvider.credential(user.email!, prompt('Current password') || '');
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPass);
      Alert.alert('Success', 'Password updated.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const changeName = async () => {
    await updateProfile(user, { displayName: name });
    Alert.alert('Success', 'Name updated.');
  };

  const deleteChats = async () => {
    await clearChatHistory();
    Alert.alert('Cleared', 'All chat history deleted.');
  };

  const deleteAccount = () => {
    Alert.alert('Confirm', 'Delete account and all data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearChatHistory();
            await deleteUser(user);
            Alert.alert('Deleted', 'Your account and data are deleted.');
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      }
    ]);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: darkMode ? '#000' : '#fff' }}>
      <TouchableOpacity onPress={() => window.open('https://gravatar.com/emails')}>
        <Image
          source={{ uri: getGravatarUrl(user.email!) }}
          style={{ width: 100, height: 100, borderRadius: 50, alignSelf: 'center' }}
        />
      </TouchableOpacity>
      <Text style={{ textAlign: 'center', marginVertical: 10, color: '#3399ff' }}>
        Tap avatar to update via Gravatar
      </Text>

      <TextInput
        placeholder="Display Name"
        value={name}
        onChangeText={setName}
        style={{
          borderWidth: 1,
          marginVertical: 10,
          padding: 8,
          color: darkMode ? '#fff' : '#000',
        }}
        placeholderTextColor={darkMode ? '#666' : '#888'}
      />
      <TouchableOpacity onPress={changeName}><Text>Change Name</Text></TouchableOpacity>

      <TextInput
        placeholder="New Password"
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
        style={{
          borderWidth: 1,
          marginVertical: 10,
          padding: 8,
          color: darkMode ? '#fff' : '#000',
        }}
        placeholderTextColor={darkMode ? '#666' : '#888'}
      />
      <TouchableOpacity onPress={changePassword}><Text>Change Password</Text></TouchableOpacity>

      <TouchableOpacity onPress={deleteChats}>
        <Text style={{ color: '#FFA500', marginTop: 20 }}>Delete All Chat History</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={deleteAccount}>
        <Text style={{ color: 'red', marginTop: 20 }}>Delete Account and Chats</Text>
      </TouchableOpacity>
    </View>
  );
}
