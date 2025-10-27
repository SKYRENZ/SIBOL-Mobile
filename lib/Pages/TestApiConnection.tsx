import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import * as api from '../utils/api';

export default function TestApiConnection() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      console.log('API base:', api.API_BASE);
      const res = await api.fetchBarangays();
      console.log('fetchBarangays response', res);
      setResult(res);
      Alert.alert('Connected', 'Received response from backend (check console or UI)');
    } catch (err: any) {
      console.error('API test error', err);
      setError(err?.message ?? String(err));
      Alert.alert('Connection failed', err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Button title="Test Backend Connection" onPress={runTest} />
      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}
      {error && <Text style={{ marginTop: 12, color: 'red' }}>Error: {error}</Text>}
      {result && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Response:</Text>
          <Text selectable>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </View>
  );
}