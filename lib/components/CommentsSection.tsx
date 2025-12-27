import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, TouchableWithoutFeedback } from 'react-native';
import tw from '../utils/tailwind';
import { Image as LucideImage, Send as LucideSend } from 'lucide-react-native';
import { MaintenanceRemark } from '../services/maintenanceService';

interface CommentsSectionProps {
  visible: boolean;
  onClose: () => void;
  messages: MaintenanceRemark[]; // ✅ Changed from Message[] to MaintenanceRemark[]
  onSendMessage: (text: string) => void; 
}

export default function CommentsSection({ visible, onClose, messages, onSendMessage }: CommentsSectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, messages.length]);

  const handleSendMessage = () => {
    const text = newMessage.trim();
    if (!text) return;

    onSendMessage(text);
    setNewMessage('');
  };

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center`}>
        <View style={tw`bg-white rounded-lg w-11/12 h-5/6 flex flex-col`}>
          <View style={tw`flex-row justify-between items-center p-4 border-b border-gray-200`}>
            <Text style={tw`text-lg font-bold text-gray-800`}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={tw`text-2xl text-gray-600`}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView ref={scrollRef} style={tw`flex-1 p-4`}>
            {messages.length === 0 ? (
              <Text style={tw`text-gray-400 text-center py-8`}>No comments yet</Text>
            ) : (
              messages.map((remark) => {
                const isBrgy = remark.User_role === 'Barangay_staff' || remark.User_role === 'Admin';
                return (
                  <View
                    key={remark.Remark_Id}
                    style={{ marginBottom: 12, alignSelf: isBrgy ? 'flex-start' : 'flex-end', maxWidth: '78%' }}
                  >
                    <View style={tw`flex-row mb-1`}>
                      <Text style={[tw`font-semibold text-sm`, { color: isBrgy ? '#1F4D36' : '#1F4D36' }]}>
                        {isBrgy ? 'Barangay' : 'You'}
                      </Text>
                      <Text style={tw`text-xs text-gray-500 ml-2`}>
                        {new Date(remark.Created_at).toLocaleString()}
                      </Text>
                    </View>

                    <View style={[
                      { padding: 10, borderRadius: 10, backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF' },
                      shadowStyle
                    ]}>
                      <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                        {remark.Remark_text}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input Area */}
          <View style={tw`border-t border-gray-200 p-4`}>
            <View style={tw`flex-row items-center bg-white border border-gray-300 rounded-full px-3`}>
              <TouchableWithoutFeedback onPress={() => { /* attach image */ }}>
                <View style={{ marginRight: 8 }}>
                  <LucideImage color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
                </View>
              </TouchableWithoutFeedback>

              <TextInput
                style={[tw`flex-1 text-sm`, { paddingVertical: 0, height: 36, textAlignVertical: 'center' }]}
                placeholder="Type a message..."
                placeholderTextColor="#8A8A8A"
                value={newMessage}
                onChangeText={setNewMessage}
                multiline={false}
              />

              <TouchableOpacity onPress={handleSendMessage} style={{ marginLeft: 8 }}>
                <LucideSend color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
