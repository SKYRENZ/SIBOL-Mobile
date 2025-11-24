import React from 'react';
import { View, Text, Image, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import Button from '../components/commons/Button';
import { useResponsiveContext } from '../utils/ResponsiveContext'; // added import

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
  const { isSm } = useResponsiveContext();
  const styles = useResponsiveStyle(({ isSm: s, isMd }) => ({
    heroSection: {
      height: s ? 520 : 820,
      justifyContent: 'center',
      alignItems: 'center',
    },
    heading: {
      fontSize: s ? 24 : 32,
      lineHeight: s ? 32 : 40,
    },
    subheading: {
      fontSize: s ? 16 : 18,
      lineHeight: s ? 24 : 28,
    },
    buttonText: {
      fontSize: s ? 16 : 18,
    },
  }));

  const logoTopOffset = isSm ? 45 : 110; 

  const logoWidthPercent = isSm ? 50 : 40;

  return (
    <SafeAreaView style={tw`flex-1 bg-secondary`}>
      <View style={tw`flex-1`}>
        {/* --- TOP SECTION --- */}
        <View style={[tw`relative w-full`, styles.heroSection]}>
          {/* Green Clouds*/}
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

          <View style={tw`items-center justify-center flex-1 z-10`}>
            {/* Lili */}
            <View style={{ marginTop: isSm ? 12 : 30 }}>
              <ResponsiveImage
                source={require('../../assets/lili-landing.png')}
                aspectRatio={0.8}
                maxWidthPercent={75}
                maxHeightPercent={90}
                heightAdjustment={true}
                adaptToDeviceSize={false}
              />
            </View>

            {/* SIBOL Logo */}
            <View style={{ position: 'absolute', top: logoTopOffset, alignSelf: 'center', zIndex: 30, pointerEvents: 'none' }}>
              <ResponsiveImage
                source={require('../../assets/sibol-green-logo.png')}
                aspectRatio={4}
                maxWidthPercent={logoWidthPercent}
                heightAdjustment={false}
                adaptToDeviceSize={false}
              />
            </View>
          </View>
        </View>

      
        <View style={tw`w-full items-center -mt-5 pointer-events-none`}>
          <Image
            source={require('../../assets/cloud-group1.png')}
            style={tw`w-full h-[56px]`}
            resizeMode="cover"
          />
        </View>

        {/* --- BOTTOM SECTION --- */}
        <View style={tw`bg-white flex-1 items-center px-6 pt-12`}> {/* moved texts higher inside white container */}
          <View style={tw`w-full`}>
            <Text style={[tw`text-sibolGreen font-bold text-left mb-2`, styles.heading]}>
              Earn rewards for saving the planet.
            </Text>
            <Text style={[tw`text-text-gray text-left mb-4`, styles.subheading]}>
              Contribute to your community by donating your food waste.
            </Text>
          </View>

          <Button
            title="Sign in"
            variant="primary"
            onPress={() => navigation.navigate('SignIn')}
            style={tw`w-full max-w-[280px] mt-4`}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
