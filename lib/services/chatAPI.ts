import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:5000/api'; 
// e.g. https://sibol-backend.onrender.com/api

export async function sendChatMessage(message: string) {
  const token = await AsyncStorage.getItem('token'); 
  // or whatever key you store JWT in

  if (!token) {
    throw new Error('No access token found. Please log in.');
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Chat API Error:', { status: response.status, error: errorData });
    throw new Error(errorData?.error || `Chat request failed (${response.status})`);
  }

  return response.json(); // { reply: string }
}
