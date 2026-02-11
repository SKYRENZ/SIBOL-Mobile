import React, { useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, Animated, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/hBotNav';
import Button from '../components/commons/Button';
import FAQs, { FAQItem } from '../components/commons/FAQs';

const CLOUD_ANIMATION_DURATION = 15000;

export default function ChatSupport() {
  const navigation = useNavigation();
  const cloud1 = useRef(new Animated.Value(-100)).current;
  const cloud2 = useRef(new Animated.Value(-150)).current;
  const cloud3 = useRef(new Animated.Value(-200)).current;
  const cloud4 = useRef(new Animated.Value(-80)).current;
  const cloud5 = useRef(new Animated.Value(-120)).current;
  const cloud6 = useRef(new Animated.Value(-180)).current;
  const cloud7 = useRef(new Animated.Value(-110)).current;
  const cloud8 = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    
    const animateCloud = (animValue: Animated.Value, delay: number, initialPos: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 550, 
            duration: CLOUD_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: initialPos,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateCloud(cloud1, 0, -100);
    animateCloud(cloud2, 2500, -150);
    animateCloud(cloud3, 5000, -200);
    animateCloud(cloud4, 7500, -80);
    animateCloud(cloud5, 10000, -120);
    animateCloud(cloud6, 12500, -180);
    animateCloud(cloud7, 1250, -110);
    animateCloud(cloud8, 3750, -160);
  }, [cloud1, cloud2, cloud3, cloud4, cloud5, cloud6, cloud7, cloud8]);

  const handleContactPress = () => {
    Linking.openURL('mailto:uccsibol@gmail.com');
  };

  const handleChatPress = () => {
    navigation.navigate('ChatIntro' as never);
  };

  const faqItems: FAQItem[] = [
    {
      question: 'How long does the stage 1 process usually take?',
      answer: 'The stage 1 process typically takes 2-3 business days to complete. You will receive a notification once your submission has been reviewed and approved.',
    },
    {
      question: 'How do I earn reward points?',
      answer: 'You earn reward points by properly segregating and disposing of your food waste. Scan the QR code on waste containers to track your contributions and earn points.',
    },
    {
      question: 'What can I redeem with my points?',
      answer: 'You can redeem your points for various eco-friendly products, discounts at partner stores, or donate them to community environmental projects.',
    },
    {
      question: 'How do I report a maintenance issue?',
      answer: 'You can report maintenance issues by going to the Maintenance section in the menu, filling out the form with details and photos, then submitting your report.',
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-[#88AB8E]`} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-0`}
      >
        {/* Top Section with Greeting and Character */}
        <View style={tw`relative pt-10 pb-6`}>
          {/* Animated Clouds - Top Left */}
          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-16 h-8`,
              { 
                top: 65, 
                left: 0,
                opacity: 0.7,
                transform: [{ translateX: cloud1 }],
              },
            ]}
            resizeMode="contain"
          />
          
          {/* Animated Clouds - Top Right */}
          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-20 h-10`,
              {
                top: 152,
                right: -20,
                opacity: 0.8,
                transform: [{ translateX: cloud2 }],
              },
            ]}
            resizeMode="contain"
          />

          {/* Animated Clouds - Middle Left */}
          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-14 h-7`,
              {
                top: 320,
                left: -20,
                opacity: 0.65,
                transform: [{ translateX: cloud7 }],
              },
            ]}
            resizeMode="contain"
          />

          {/* Animated Clouds - Middle Right */}
          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-16 h-8`,
              {
                top: 380,
                right: -30,
                opacity: 0.7,
                transform: [{ translateX: cloud8 }],
              },
            ]}
            resizeMode="contain"
          />

          {/* Greeting */}
          <Text style={tw`text-white text-[20px] font-bold text-center mb-4 font-inter`}>
            Hi, User#39239!
          </Text>

          {/* Lili here! label */}
          <Text style={tw`text-white text-[11px] font-bold text-center mb-4 font-inter`}>
            Lili here!
          </Text>

          {/* Character Image */}
          <View style={tw`items-center mb-2`}>
            <Image
              source={require('../../assets/lili-headshot.png')}
              style={{ width: '55%', aspectRatio: 1 }}
              resizeMode="contain"
            />
          </View>

          {/* How may I help button */}
          <View style={tw`items-center mb-4`}>
            <Button
              title="How may I help?"
              variant="primary"
              onPress={handleChatPress}
              style={[
                tw`bg-primary rounded-[40px] py-2 px-8 self-center`,
                {
                  shadowColor: '#6C8770',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 2,
                  elevation: 4,
                },
              ]}
              textStyle={tw`text-white text-[12px] font-bold font-inter`}
            />
          </View>

          {/* Contact Us */}
          <Text
            style={[tw`text-white text-[10px] font-bold text-center font-inter`, { fontFamily: 'Inter' }]}
            onPress={handleContactPress}
          >
            Contact Us:{' '}
            <Text style={[tw`underline font-inter`, { fontFamily: 'Inter' }]}>uccsibol@gmail.com</Text>
          </Text>
        </View>

        {/* Cloud Wave Divider */}
        <View style={tw`relative h-20 -mb-1`}>
          {/* Background animated clouds */}
          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-14 h-7`,
              {
                top: 10,
                left: 0,
                opacity: 0.5,
                transform: [{ translateX: cloud3 }],
              },
            ]}
            resizeMode="contain"
          />

          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-12 h-6`,
              {
                top: 30,
                right: 20,
                opacity: 0.6,
                transform: [{ translateX: cloud4 }],
              },
            ]}
            resizeMode="contain"
          />

          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-16 h-8`,
              {
                top: 0,
                right: -30,
                opacity: 0.55,
                transform: [{ translateX: cloud5 }],
              },
            ]}
            resizeMode="contain"
          />

          <Animated.Image
            source={require('../../assets/cloud.png')}
            style={[
              tw`absolute w-10 h-5`,
              {
                top: 25,
                left: 30,
                opacity: 0.65,
                transform: [{ translateX: cloud6 }],
              },
            ]}
            resizeMode="contain"
          />
          
          {/* Wave using cloud group */}
          <Image
            source={require('../../assets/cloud-group1.png')}
            style={tw`absolute bottom-0 w-full h-20`}
            resizeMode="cover"
          />
        </View>

        {/* FAQs Section with White Background */}
        <View style={tw`bg-white pt-8 pb-24`}>
          <Text style={tw`text-[20px] font-bold text-green-light mb-2 font-inter px-6`}>
            Frequently Asked Questions:
          </Text>
          <FAQs items={faqItems} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={tw`absolute bottom-0 left-0 right-0`}>
        <BottomNavbar currentPage="Chat" />
      </View>
    </SafeAreaView>
  );
}
