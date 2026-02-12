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
        <View style={tw`relative max-w-[70px] ml-4`}>
          {/* AI Message Content with Animated Dots */}
          <View style={[
            tw`bg-[#88AB8E] rounded-[15px] px-4 py-2.5 flex-row items-center justify-center`,
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
