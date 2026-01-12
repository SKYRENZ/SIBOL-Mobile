import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import tw from '../utils/tailwind';
import FAQs, { FAQItem } from '../components/commons/FAQs';
import ChatHeader from '../components/commons/ChatHeader';
import TypingIndicator from '../components/commons/TypingIndicator';
import Svg, { Path } from 'react-native-svg';
import { sendChatMessage } from '../services/chatAPI';

export default function ChatIntro() {
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<{ type: 'ai' | 'user'; text: string }[]>([
    { type: 'ai', text: 'Good day, User! How can I assist you today?' }
  ]);
  const [showFAQs, setShowFAQs] = useState(true);
  const [isAITyping, setIsAITyping] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  const faqItems: FAQItem[] = [
    {
      question: 'How long does the stage 1 process usually take?',
      answer: 'The stage 1 process typically takes 2-3 business days to complete. You will receive a notification once your submission has been reviewed and approved.',
    },
    {
      question: 'How long does the stage 1 process usually take?',
      answer: 'The stage 1 process typically takes 2-3 business days to complete. You will receive a notification once your submission has been reviewed and approved.',
    },
    {
      question: 'How long does the stage 1 process usually take?',
      answer: 'The stage 1 process typically takes 2-3 business days to complete. You will receive a notification once your submission has been reviewed and approved.',
    },
    {
      question: 'How long does the stage 1 process usually take?',
      answer: 'The stage 1 process typically takes 2-3 business days to complete. You will receive a notification once your submission has been reviewed and approved.',
    },
  ];

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `Today  ${displayHours}:${displayMinutes}${ampm}`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage = text.trim();

    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setMessageText('');
    setShowFAQs(false);
    setIsUserTyping(false);
    setIsAITyping(true);

    try {
      const data = await sendChatMessage(userMessage);

      setMessages(prev => [
        ...prev,
        {
          type: 'ai',
          text: data.reply || 'Sorry, I was unable to process your request.',
        },
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          type: 'ai',
          text: 'Something went wrong. Please try again later.',
        },
      ]);
    } finally {
      setIsAITyping(false);
    }
  };

  // Track user typing
  useEffect(() => {
    setIsUserTyping(messageText.trim().length > 0);
  }, [messageText]);

  const handleFAQClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`} edges={['top', 'bottom']}>
      <ChatHeader />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pb-4`}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Timestamp */}
        <View style={tw`flex-row items-center justify-center my-6 px-6`}>
          <View style={tw`flex-1 h-[1px] bg-[#88AB8E]`} />
          <Text style={tw`text-[#88AB8E] text-[11px] font-bold font-inter mx-3`}>
            {getCurrentTime()}
          </Text>
          <View style={tw`flex-1 h-[1px] bg-[#88AB8E]`} />
        </View>

        {/* Messages */}
        {messages.map((message, index) => (
          <View key={index} style={tw`px-2 mb-4`}>
            {message.type === 'ai' ? (
              <View style={tw`relative max-w-[306px]`}>
                <View style={tw`absolute -left-0 top-8.5 z-0`}>
                  <Svg width={39} height={46} viewBox="0 0 39 46" fill="none">
                    <Path
                      d="M11.7523 31.3777C9.71739 31.379 8.50163 28.9909 9.46446 26.8839L16.5055 11.4753C17.5545 9.17978 20.3554 8.9444 21.4331 11.0612L29.2731 26.4607C30.3507 28.5775 28.8503 31.3673 26.6333 31.3686L11.7523 31.3777Z"
                      fill="#88AB8E"
                    />
                  </Svg>
                </View>

                <View style={[
                  tw`bg-[#88AB8E] rounded-[15px] px-6 py-4 ml-4`,
                  {
                    shadowColor: '#AFC8AD',
                    shadowOffset: { width: -4, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 3,
                  }
                ]}>
                  <Text style={tw`text-white text-[14px] font-bold font-inter`}>
                    {message.text}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={tw`flex-row justify-end px-4`}>
                <View style={[
                  tw`bg-white rounded-[15px] px-6 py-4 max-w-[306px]`,
                  {
                    shadowColor: '#88AB8E',
                    shadowOffset: { width: 4, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 3,
                  }
                ]}>
                  <Text style={tw`text-[#88AB8E] text-[14px] font-bold font-inter`}>
                    {message.text}
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {isAITyping && <TypingIndicator variant="ai" />}
        {isUserTyping && !isAITyping && <TypingIndicator variant="user" />}

        {showFAQs && (
          <Text style={tw`text-[#88AB8E] text-[11px] font-bold font-inter text-center mb-4`}>
            Tap to send Lili a message
          </Text>
        )}

        {showFAQs && (
          <View style={tw`mb-6`}>
            <FAQs items={faqItems} onFAQClick={handleFAQClick} />
          </View>
        )}
      </ScrollView>

      {/* Bottom Input */}
      <View style={tw`bg-[#88AB8E] px-5 pt-3 pb-6`}>
        <View style={tw`flex-row items-center gap-2`}>
          <View style={tw`flex-1 bg-[#AFC8AD] rounded-[35px] px-4 py-2.5`}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type here...."
              placeholderTextColor="rgba(255, 255, 255, 0.79)"
              style={tw`text-white text-[11px] font-bold font-inter`}
            />
          </View>

          <TouchableOpacity
            onPress={() => handleSendMessage(messageText)}
            style={tw`w-10 h-10 rounded-full bg-white items-center justify-center`}
          >
            <Send size={21} color="#88AB8E" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
