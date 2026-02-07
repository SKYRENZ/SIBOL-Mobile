import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import { Eye, EyeOff, Wifi } from 'lucide-react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConnect: (ssid: string, password: string) => Promise<void> | void;
  loading?: boolean;
  initialSsid?: string;
};

export default function ConnectNetworkModal({
  visible,
  onClose,
  onConnect,
  loading = false,
  initialSsid = '',
}: Props) {
  const [ssid, setSsid] = useState(initialSsid);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSsid(initialSsid);
    setPassword('');
    setShowPassword(false);
    setError(null);
  }, [visible, initialSsid]);

  const ssidTrimmed = useMemo(() => ssid.trim(), [ssid]);
  const canSubmit = ssidTrimmed.length > 0 && !loading;

  const handleSubmit = async () => {
    if (!ssidTrimmed) {
      setError('SSID is required.');
      return;
    }
    setError(null);

    try {
      await onConnect(ssidTrimmed, password);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/50 justify-center items-center px-6`}>
        <View style={tw`w-full bg-white rounded-2xl overflow-hidden`}>
          {/* Header */}
          <View style={tw`bg-[#2E523A] px-5 py-4`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-9 h-9 rounded-full bg-white/15 items-center justify-center mr-3`}>
                <Wifi size={18} color="#FFFFFF" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-white text-lg font-bold`}>Connect Network</Text>
                <Text style={tw`text-white/80 text-xs mt-0.5`}>
                  Enter Wi‑Fi credentials for the ESP32 to join
                </Text>
              </View>
            </View>
          </View>

          {/* Body */}
          <View style={tw`px-5 py-5`}>
            <Text style={tw`text-xs text-gray-500 mb-1`}>SSID</Text>
            <TextInput
              value={ssid}
              onChangeText={(t) => setSsid(t)}
              editable={!loading}
              selectTextOnFocus={!loading}
              placeholder="Enter Wi‑Fi name"
              placeholderTextColor="#9CA3AF"
              style={tw`border border-gray-200 rounded-xl px-4 py-3 text-[#111827]`}
            />

            <Text style={tw`text-xs text-gray-500 mt-4 mb-1`}>Password</Text>
            <View style={tw`relative`}>
              <TextInput
                value={password}
                onChangeText={(t) => setPassword(t)}
                editable={!loading}
                selectTextOnFocus={!loading}
                placeholder="Enter password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                style={tw`border border-gray-200 rounded-xl px-4 py-3 pr-12 text-[#111827]`}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((s) => !s)}
                disabled={loading}
                style={tw`absolute right-3 top-1/2 -mt-3`}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
              </TouchableOpacity>
            </View>

            {error ? <Text style={tw`text-xs text-red-600 mt-3`}>{error}</Text> : null}

            {/* Buttons */}
            <View style={tw`flex-row justify-end mt-6`}>
              <TouchableOpacity
                onPress={onClose}
                disabled={loading}
                style={[tw`px-4 py-3 mr-3`, loading ? tw`opacity-50` : null]}
              >
                <Text style={tw`text-[#4F6853] font-semibold`}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[
                  tw`px-5 py-3 rounded-xl bg-[#4F6853] flex-row items-center`,
                  !canSubmit ? tw`opacity-50` : null,
                ]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : null}
                <Text style={tw`text-white font-semibold ${loading ? 'ml-2' : ''}`}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}