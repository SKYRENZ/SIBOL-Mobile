import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';

console.log('TW test:', tw`flex-1 bg-secondary`); 

type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

interface Props {
  navigation: NavigationProp;
}

export default function LandingPage({ navigation }: Props) {
  const styles = useResponsiveStyle(({ isSm, isMd }) => ({
    heroSection: {
      height: isSm ? 380 : 460,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heading: {
      fontSize: isSm ? 24 : 32,
      lineHeight: isSm ? 32 : 40,
    },
    subheading: {
      fontSize: isSm ? 16 : 18,
      lineHeight: isSm ? 24 : 28,
    },
    buttonText: {
      fontSize: isSm ? 16 : 18,
    },
  }));

  return (
    <SafeAreaView style={tw`flex-1 bg-secondary`}>
      <View style={tw`flex-1`}>
        {/* --- TOP SECTION: Logo + Clouds --- */}
        <View style={[tw`relative w-full`, styles.heroSection]}>
          {/* Centered Logo */}
          <ResponsiveImage
            source={require('../../assets/sibol-green-logo.png')}
            aspectRatio={4}
            maxWidthPercent={60}
          />

          {/* Cloud Layer */}
          <View style={tw`absolute w-full h-full`}>
            <Image
              source={require('../../assets/cloud.png')}
              style={tw`w-[70px] h-[35px] absolute -left-[10px] top-[10%]`}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/cloud.png')}
              style={tw`w-[55px] h-[28px] absolute left-[35%] top-[25%]`}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/cloud.png')}
              style={tw`w-[60px] h-[30px] absolute -right-[15px] top-[15%]`}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/cloud.png')}
              style={tw`w-[65px] h-[33px] absolute left-[5%] bottom-[35%]`}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/cloud.png')}
              style={tw`w-[50px] h-[25px] absolute right-[28%] bottom-[45%]`}
              resizeMode="contain"
            />
            <Image
              source={require('../../assets/cloud.png')}
              style={tw`w-[58px] h-[29px] absolute -right-[10px] bottom-[25%]`}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* --- BOTTOM SECTION: Text + Button --- */}
        <View style={tw`bg-white flex-1 items-center px-6 pt-10 rounded-t-[30px]`}>
          <View style={tw`w-full`}>
            <Text style={[tw`text-sibolGreen font-bold text-left mb-2`, styles.heading]}>
              Earn rewards for saving the planet.
            </Text>
            <Text style={[tw`text-text-gray text-left mb-4`, styles.subheading]}>
              Contribute to your community by donating your food waste.
            </Text>
          </View>

          <TouchableOpacity
            style={tw`bg-sibolGreen py-4 px-12 rounded-[25px] mt-6 w-full max-w-[280px]`}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={[tw`text-white font-bold text-center`, styles.buttonText]}>
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
