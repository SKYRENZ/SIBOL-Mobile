import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Path, Ellipse, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend, Rect } from 'react-native-svg';
import tw from '../../utils/tailwind';

interface TypingIndicatorProps {
  variant?: 'ai' | 'user';
}

export default function TypingIndicator({ variant = 'ai' }: TypingIndicatorProps) {
  const isAI = variant === 'ai';
  
  // Animation values for each dot
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create staggered bounce animation for each dot
    const createBounceAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: -8,
            duration: 400,
            easing: Easing.bezier(0.33, 0.66, 0.66, 1),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            easing: Easing.bezier(0.33, 0, 0.66, 0.33),
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Start animations with staggered delays
    const anim1 = createBounceAnimation(dot1Anim, 0);
    const anim2 = createBounceAnimation(dot2Anim, 150);
    const anim3 = createBounceAnimation(dot3Anim, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  if (isAI) {
    // AI Typing Indicator (Green)
    return (
      <View style={tw`px-2 mb-4`}>
        <View style={tw`relative max-w-[70px]`}>
          {/* AI Message Bubble Tail */}
          <View style={tw`absolute -left-0 top-3.5 z-0`}>
            <Svg width={28} height={33} viewBox="0 0 39 46" fill="none">
              <Path
                d="M11.7523 31.3777C9.71739 31.379 8.50163 28.9909 9.46446 26.8839L16.5055 11.4753C17.5545 9.17978 20.3554 8.9444 21.4331 11.0612L29.2731 26.4607C30.3507 28.5775 28.8503 31.3673 26.6333 31.3686L11.7523 31.3777Z"
                fill="#88AB8E"
              />
            </Svg>
          </View>

          {/* AI Message Content with Animated Dots */}
          <View style={[
            tw`bg-[#88AB8E] rounded-[15px] px-4 py-2.5 ml-3 flex-row items-center justify-center`,
            {
              minWidth: 60,
              height: 36,
              shadowColor: '#AFC8AD',
              shadowOffset: { width: -4, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 3,
            }
          ]}>
            {/* Animated Dots */}
            <View style={tw`flex-row items-center gap-[9px]`}>
              <Animated.View
                style={{
                  transform: [{ translateY: dot1Anim }],
                  width: 9,
                  height: 8,
                  borderRadius: 4.5,
                  backgroundColor: '#AFC8AD',
                }}
              />
              <Animated.View
                style={{
                  transform: [{ translateY: dot2Anim }],
                  width: 9,
                  height: 8,
                  borderRadius: 4.5,
                  backgroundColor: '#AFC8AD',
                }}
              />
              <Animated.View
                style={{
                  transform: [{ translateY: dot3Anim }],
                  width: 9,
                  height: 8,
                  borderRadius: 4.5,
                  backgroundColor: '#AFC8AD',
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  } else {
    // User Typing Indicator (White)
    return (
      <View style={tw`px-2 mb-4`}>
        <View style={tw`flex-row justify-end`}>
          {/* User Message Content with Animated Dots */}
          <View style={[
            tw`bg-white rounded-[15px] px-4 py-2.5 flex-row items-center justify-center`,
            {
              minWidth: 60,
              height: 36,
              shadowColor: '#88AB8E',
              shadowOffset: { width: 4, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 2,
              elevation: 3,
            }
          ]}>
            {/* Animated Dots */}
            <View style={tw`flex-row items-center gap-[9px]`}>
              <Animated.View
                style={{
                  transform: [{ translateY: dot1Anim }],
                  width: 9,
                  height: 8,
                  borderRadius: 4.5,
                  backgroundColor: '#DED9D9',
                }}
              />
              <Animated.View
                style={{
                  transform: [{ translateY: dot2Anim }],
                  width: 9,
                  height: 8,
                  borderRadius: 4.5,
                  backgroundColor: '#DED9D9',
                }}
              />
              <Animated.View
                style={{
                  transform: [{ translateY: dot3Anim }],
                  width: 9,
                  height: 8,
                  borderRadius: 4.5,
                  backgroundColor: '#DED9D9',
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }
}
