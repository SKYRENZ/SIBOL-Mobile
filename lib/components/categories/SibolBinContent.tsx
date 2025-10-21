import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import tw from '../../utils/tailwind';
import { useResponsiveStyle, useResponsiveFontSize } from '../../utils/responsiveStyles';

export default function SibolBinContent() {
  const styles = useResponsiveStyle(({ isSm, isMd }) => ({
    container: {
      width: '100%',
      maxWidth: isSm ? '100%' : 900,
      alignSelf: 'center',
      paddingHorizontal: isSm ? 16 : isMd ? 24 : 32,
    },
    heading: {
      fontSize: isSm ? 16 : isMd ? 18 : 20,
      marginBottom: isSm ? 12 : 16,
      textAlign: 'center',
    },
    subheading: {
      fontSize: isSm ? 14 : isMd ? 16 : 18,
      marginTop: isSm ? 16 : 24,
      marginBottom: isSm ? 8 : 12,
    },
    text: {
      fontSize: isSm ? 12 : isMd ? 14 : 16,
      lineHeight: isSm ? 18 : isMd ? 20 : 24,
      textAlign: 'justify',
      marginHorizontal: isSm ? 8 : isMd ? 16 : 24,
    },
    imageContainer: {
      width: '100%',
      height: isSm ? 160 : isMd ? 200 : 240,
      marginVertical: isSm ? 12 : 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  }));

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[tw`font-bold text-[#2E523A]`, styles.heading]}>
        How to use a SIBOL bin?
      </Text>

      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/sibol-bin-2.png')}
          style={styles.image}
        />
      </View>

      <Text style={[tw`font-bold text-[#2E523A]`, styles.subheading]}>
        Importance of SIBOL Food Segregation
      </Text>
      <Text style={[tw`text-[#2E523A]`, styles.text]}>
        We separate carbon- and nitrogen-rich waste so the microbes in the digester get the right food mix to stay healthy and make lots of biogas.
      </Text>

      <Text style={[tw`font-bold text-[#2E523A]`, styles.subheading]}>
        What will happen to the Food Waste?
      </Text>
      <Text style={[tw`text-[#2E523A]`, styles.text]}>
        The segregated food waste will be processed in our biodigester, where it will be broken down by microorganisms to produce biogas and nutrient-rich fertilizer. This helps reduce waste while creating renewable energy and supporting sustainable agriculture.
      </Text>

      <View style={tw`h-4`} />
    </ScrollView>
  );
}