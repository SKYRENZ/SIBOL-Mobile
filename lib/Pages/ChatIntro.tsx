import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import tw from '../utils/tailwind';
import FAQs, { FAQItem } from '../components/commons/FAQs';
import ChatHeader from '../components/commons/ChatHeader';
import TypingIndicator from '../components/commons/TypingIndicator';
import Svg, { Path } from 'react-native-svg';
import { sendChatMessage } from '../services/chatAPI';

export default function ChatIntro() {
  const insets = useSafeAreaInsets();
  const BOTTOM_INPUT_HEIGHT = 121;

  const [kavKey, setKavKey] = useState(0);

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<{ type: 'ai' | 'user'; text: string; translatedText?: string; showTranslation?: boolean }[]>([
    { type: 'ai', text: 'Good day, User! How can I assist you today?' }
  ]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showFAQs, setShowFAQs] = useState(true);
  const [isAITyping, setIsAITyping] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const cloudLeftAnim = useRef(new Animated.Value(400)).current;
  const cloudRightAnim = useRef(new Animated.Value(-100)).current;
  const scrollRef = useRef<any>(null);

  const faqItems: FAQItem[] = [
    {
      question: 'How long does the stage 1 process usually take?',
      answer: 'The stage 1 process typically takes 2-3 business days to complete. You will receive a notification once your submission has been reviewed and approved.',
    },
    {
      question: 'What happens after I submit my waste collection?',
      answer: 'After submission, your waste collection is reviewed and categorized. You will earn points based on the type and quality of materials collected.',
    },
    {
      question: 'How can I track my rewards and points?',
      answer: 'You can view your current rewards and points balance in your profile dashboard. Points are updated in real-time as your submissions are processed.',
    },
    {
      question: 'How do I contact support if I have issues?',
      answer: 'You can reach our support team by emailing uccsibol@gmail.com or using the contact option in the chat header. We typically respond within 24 hours.',
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

  const handleTranslate = async (index: number) => {
    const message = messages[index];
    
    // If already translated, toggle display
    if (message.translatedText) {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, showTranslation: !msg.showTranslation } : msg
      ));
      return;
    }

    // Detect if message is likely in English (simple check for common English words)
    const englishPattern = /\b(the|is|are|was|were|have|has|can|will|would|should|this|that|you|your|how|what|when|where|why)\b/i;
    const isEnglish = englishPattern.test(message.text);
    
    // Request translation from backend
    setTranslatingIndex(index);
    try {
      const translationCommand = isEnglish ? 'TRANSLATE_TO_TAGALOG:' : 'TRANSLATE_TO_ENGLISH:';
      const data = await sendChatMessage(`${translationCommand} ${message.text}`);
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, translatedText: data.reply, showTranslation: true } : msg
      ));
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingIndex(null);
    }
  };

  // Track user typing
  useEffect(() => {
    setIsUserTyping(messageText.trim().length > 0);
  }, [messageText]);

  // Animate bottom clouds from right to left
  useEffect(() => {
    const animateCloudLeft = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloudLeftAnim, {
            toValue: -150,
            duration: 9000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudLeftAnim, {
            toValue: 400,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const animateCloudRight = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloudRightAnim, {
            toValue: 350,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(cloudRightAnim, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateCloudLeft();
    animateCloudRight();
  }, [cloudLeftAnim, cloudRightAnim]);

  // Avoid bottom safe-area padding while keyboard is open on Android (prevents the gap)
  const bottomInset = Platform.OS === 'android' && keyboardVisible ? 0 : insets.bottom;

  // track keyboard to avoid fixed large bottom padding and remove persistent gap
  useEffect(() => {
    const onShow = (e: any) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height || 0);
      // wait for keyboard animation/layout then scroll to end
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 200);
    };
    const onHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      // Workaround: force KAV to recalc to prevent "stuck" bottom gap on some Android devices
      if (Platform.OS === 'android') {
        setTimeout(() => setKavKey(k => k + 1), 0);
      }
    };

    const showSub = Keyboard.addListener('keyboardDidShow', onShow);
    const hideSub = Keyboard.addListener('keyboardDidHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // scroll to bottom when messages update
  useEffect(() => {
    // give layout + keyboard time to settle before scrolling
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 160);
  }, [messages.length]);

  const handleFAQClick = (question: string) => {
    handleSendMessage(question);
  };

  return (
    // IMPORTANT: avoid global bottom safe-area padding (it causes "white gap" with keyboards on Android)
    <SafeAreaView style={tw`flex-1 bg-white`} edges={['top']}>
      <ChatHeader />

      <KeyboardAvoidingView
        key={kavKey}
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Make this container relative so the absolute input is pinned inside it */}
        <View style={{ flex: 1, position: 'relative' }}>
          <ScrollView
            ref={scrollRef}
            style={tw`flex-1`}
            // Always reserve space for the absolute bottom input so messages never sit behind it
            contentContainerStyle={[{ paddingBottom: BOTTOM_INPUT_HEIGHT + bottomInset + 20 }]}
            showsVerticalScrollIndicator={false}
            // Let the scroll view offset the content by the input height when keyboard opens
            keyboardShouldPersistTaps="handled"
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
                  <View style={tw`relative max-w-[306px] ml-2.5`}>
                    <View style={[
                      tw`bg-[#88AB8E] rounded-[15px] px-6 py-4`,
                      {
                        shadowColor: '#AFC8AD',
                        shadowOffset: { width: -4, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 2,
                        elevation: 3,
                      }
                    ]}>
                      <Text style={tw`text-white text-[14px] font-bold font-inter`}>
                        {message.showTranslation && message.translatedText ? message.translatedText : message.text}
                      </Text>
                      
                      {/* Translate Button - Inside message box, bottom right */}
                      <TouchableOpacity onPress={() => handleTranslate(index)} style={tw`self-end mt-2`} disabled={translatingIndex === index}>
                        <Text style={[tw`text-white text-[10px] font-bold font-inter`, { textDecorationLine: 'underline' }]}>
                          {translatingIndex === index ? 'Translating...' : (message.showTranslation ? 'Hide Translate' : 'Translate')}
                        </Text>
                      </TouchableOpacity>
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

          {/* Bottom Input with Wavy Background */}
          <Animated.View
            style={[
              tw`left-0 right-0`,
              { position: 'absolute', bottom: 0, zIndex: 30 },
            ]}
          >
            {/* Wavy Background Container */}
            <View style={[{ height: BOTTOM_INPUT_HEIGHT + bottomInset, overflow: 'hidden' }]}>
              {/* Wavy Top Section */}
              <View style={[tw`absolute`, { left: -103, top: 0, width: 583, height: 67 }]}>
                <Svg width={583} height={67} viewBox="0 0 583 67" fill="none">
                  <Path
                    d="M461.404 31.5699C331.235 52.216 307.924 -3.8791 198.801 0.21454C89.6766 4.30818 0 67 0 67L582.879 64.1659C582.879 64.1659 591.573 10.9238 461.404 31.5699Z"
                    fill="#88AB8E"
                  />
                </Svg>
              </View>

              {/* Solid bottom section */}
              <View style={[tw`bg-[#88AB8E] absolute`, { left: 0, top: 56, right: 0, bottom: 0 }]} />

              {/* Cloud Decoration - Left - Animated Right to Left */}
              <Animated.View style={[tw`absolute z-20`, { left: 0, top: 89, transform: [{ translateX: cloudLeftAnim }] }]}>
                <Svg width={79} height={33} viewBox="0 0 79 33" fill="none">
                  <Path
                    d="M19.6181 27.5021C12.7776 13.7869 1.04257e-08 31.9533 1.04257e-08 31.9533L78.7569 32.3838L78.8046 23.6476C78.8046 23.6476 79.9904 17.5731 72.311 16.7715C64.6315 15.9698 59.9798 23.5447 59.9798 23.5447C59.9798 23.5447 68.5356 4.5954 55.8784 0.727939C43.2213 -3.13952 23.5035 19.5429 19.6181 27.5021Z"
                    fill="rgba(175, 200, 173, 0.61)"
                  />
                </Svg>
              </Animated.View>

              {/* Cloud Decoration - Right - Animated Right to Left */}
              <Animated.View style={[tw`absolute z-20`, { right: 0, top: 55, transform: [{ translateX: cloudRightAnim }] }]}>
                <Svg width={83} height={35} viewBox="0 0 83 35" fill="none">
                  <Path
                    d="M20.6121 28.9064C13.4375 14.4931 0 33.5664 0 33.5664L82.7326 34.0827L82.7898 24.9055C82.7898 24.9055 84.0404 18.5253 75.9739 17.6769C67.9075 16.8285 63.0147 24.7821 63.0147 24.7821C63.0147 24.7821 72.0179 4.88308 58.7249 0.810058C45.4319 -3.26296 24.7002 20.5485 20.6121 28.9064Z"
                    fill="rgba(175, 200, 173, 0.61)"
                  />
                </Svg>
              </Animated.View>

              {/* Input Content */}
              <View
                style={[
                  tw`absolute z-30 flex-row items-center`,
                  { left: 18, right: 18, top: 58, gap: 10, marginBottom: bottomInset },
                ]}
              >
                <View style={[tw`flex-1 bg-[#AFC8AD] rounded-[35px] px-4`, { height: 39 }]}>
                  <TextInput
                    value={messageText}
                    onChangeText={setMessageText}
                    onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 120)}
                    placeholder="Type here..."
                    placeholderTextColor="rgba(255, 255, 255, 0.79)"
                    style={[tw`text-white text-[11px] font-bold font-inter flex-1 text-left`, { textAlignVertical: 'center' }]}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => handleSendMessage(messageText)}
                  style={[tw`rounded-full bg-white items-center justify-center`, { width: 39, height: 38 }]}
                >
                  <Send size={21} color="#88AB8E" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
