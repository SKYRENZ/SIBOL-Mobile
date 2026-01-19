import AsyncStorage from '@react-native-async-storage/async-storage';
import { post } from './apiClient';

export async function sendChatMessage(message: string) {
  const token = await AsyncStorage.getItem('token');

  if (!token) {
    throw new Error('No access token found. Please log in.');
  }

  // Uses axios baseURL (API_BASE) + interceptor attaches Authorization
  return post<{ reply: string }>('/api/chat', { message });
}
