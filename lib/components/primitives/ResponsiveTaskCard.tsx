import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '../../utils/tailwind';
import { useResponsiveStyle, useResponsiveFontSize } from '../../utils/responsiveStyles';

interface TaskCardProps {
  title: string;
  description: string;
  dueDate: string;
  onPress?: () => void;
}

export default function ResponsiveTaskCard({ title, description, dueDate, onPress }: TaskCardProps) {
  const styles = useResponsiveStyle(({ isSm, isMd, isLg }) => ({
    cardContainer: {
      width: isSm ? 130 : isMd ? 150 : 160,
      height: isSm ? 130 : isMd ? 150 : 170,
      marginRight: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: '#AFC8AD',
      backgroundColor: 'white',
    },
    contentContainer: {
      padding: isSm ? 12 : 16,
    },
    titleText: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('sm'),
      fontWeight: 'bold',
      color: '#2E523A',
      textAlign: 'center',
      marginBottom: isSm ? 8 : 12,
    },
    descriptionText: {
      fontSize: isSm ? 9 : 10,
      color: '#2E523A',
      lineHeight: isSm ? 12 : 14,
      marginBottom: 6,
    },
    dateText: {
      fontSize: isSm ? 8 : 10,
      fontWeight: 'bold',
      color: '#88AB8E',
      marginBottom: isSm ? 8 : 12,
    },
    button: {
      backgroundColor: '#2E523A',
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: isSm ? 8 : 16,
      alignSelf: 'center',
      marginTop: isSm ? 2 : 4,
    },
    buttonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: isSm ? 8 : 10,
    }
  }));

  return (
    <View style={styles.cardContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>
          {title}
        </Text>
        <Text style={styles.descriptionText}>
          {description}
        </Text>
        <Text style={styles.dateText}>
          {dueDate}
        </Text>
        <TouchableOpacity
          onPress={onPress}
          style={styles.button}
        >
          <Text style={styles.buttonText}>view</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
