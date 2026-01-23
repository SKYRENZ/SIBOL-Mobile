import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import tw from '../utils/tailwind';

export default function AreaCovered() {
  return (
    <View style={styles.container}>
      <View style={[styles.box, tw`bg-white`]}> 
        <Text style={[tw`text-[#88AB8E]`, styles.text]}>Map here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  box: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#88AB8E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
