import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, TouchableWithoutFeedback } from 'react-native';
import tw from '../utils/tailwind';
import { Image as LucideImage, Send as LucideSend } from 'lucide-react-native'; // lucide-react icons

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  messages?: Message[];
  onSendMessage?: (text: string) => void; 
}

interface Message {
  id: string;
  sender: 'Brgy' | 'Operator';
  message: string;
  timestamp?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
}

export default function CommentsModal({ visible, onClose, messages, onSendMessage }: CommentsModalProps) {
  const [internalMessages, setInternalMessages] = useState<Message[]>(
    [
      {
        id: '1',
        sender: 'Brgy',
        message: 'Please make sure to replace the entire filter unit, not just the cartridge.',
        timestamp: 'Aug 14, 2:30 PM',
      },
      {
        id: '2',
        sender: 'Operator',
        message: 'Understood. I will replace the complete unit tomorrow morning.',
        timestamp: 'Aug 14, 3:15 PM',
      },
    ]
  );

  const displayedMessages = messages ?? internalMessages;

  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    const text = newMessage.trim();
    if (!text) return;

    if (onSendMessage) {
      onSendMessage(text);
    } else {
      setInternalMessages([
        ...internalMessages,
        { id: String(internalMessages.length + 1), sender: 'Operator', message: text, timestamp: new Date().toLocaleTimeString() }
      ]);
    }
    setNewMessage('');
  };

  const scrollRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current && typeof scrollRef.current.scrollToEnd === 'function') {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [displayedMessages.length]);

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
            {displayedMessages.map((msg) => {
              const isBrgy = msg.sender === 'Brgy';
              return (
                <View key={msg.id} style={{ marginBottom: 12, alignSelf: isBrgy ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
                  <View style={tw`flex-row mb-1`}>
                    <Text style={[tw`font-semibold text-sm`, { color: isBrgy ? '#1F4D36' : '#1F4D36' }]}>
                      {isBrgy ? 'Barangay' : 'You'}
                    </Text>
                    <Text style={tw`text-xs text-gray-500 ml-2`}>{msg.timestamp ?? ''}</Text>
                  </View>

                  <View style={[
                    { padding: 10, borderRadius: 10, backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF' },
                    shadowStyle
                  ]}>
                    <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                      {msg.message}
                    </Text>

                    {msg.hasAttachment && (
                      <TouchableOpacity style={tw`mt-2 flex-row items-center`}>
                        <Text style={{ color: '#F9F4D3', textDecorationLine: 'underline', fontSize: 12 }}>{msg.attachmentName}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
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
