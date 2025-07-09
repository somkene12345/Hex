import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { auth } from '../services/firebase';
import { useTheme } from '../theme/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { reauthenticateWithCredential, updatePassword, updateProfile, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { clearChatHistory } from '../utils/chatStorage';
import { Ionicons } from "@expo/vector-icons";

export default function SettingsScreen() {
  const { darkMode } = useTheme();
  const user = auth.currentUser!;
  const [name, setName] = useState(user.displayName || '');
  const [newPass, setNewPass] = useState('');

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled) {
      await updateProfile(user, { photoURL: res.assets![0].uri });
      Alert.alert('Success', 'Profile picture updated.');
    }
  };

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
    <View style={{ flex:1, padding: 20, backgroundColor: darkMode ? '#000': '#fff' }}>
      <TouchableOpacity onPress={pickAvatar}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={{ width:100, height:100, borderRadius:50 }} />
        ) : (
          <Ionicons name="person-circle-outline" size={100} color={darkMode ? '#fff': '#000'} />
        )}
      </TouchableOpacity>
      <TextInput placeholder="Display Name" value={name} onChangeText={setName}
        style={{ borderWidth:1, marginVertical:10, padding:8, color: darkMode ? '#fff':'#000' }} />
      <TouchableOpacity onPress={changeName}><Text>Change Name</Text></TouchableOpacity>
      <TextInput placeholder="New Password" secureTextEntry value={newPass} onChangeText={setNewPass}
        style={{ borderWidth:1, marginVertical:10, padding:8, color: darkMode ? '#fff':'#000' }} />
      <TouchableOpacity onPress={changePassword}><Text>Change Password</Text></TouchableOpacity>
      <TouchableOpacity onPress={deleteAccount}><Text style={{ color:'red', marginTop:20 }}>Delete Account and Chats</Text></TouchableOpacity>
    </View>
  );
}
