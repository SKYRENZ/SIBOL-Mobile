import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export default function SearchBox({ value, onChangeText, placeholder = 'Search an area' }: Props) {
  return (
    <View style={styles.searchBox}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="rgba(0,0,0,0.25)"
        value={value}
        onChangeText={onChangeText}
        underlineColorAndroid="transparent"
      />
      <View style={styles.searchIconWrap}>
        <Search size={18} color="#88AB8E" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    position: 'relative',          
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CAD3CA',
    paddingVertical: 10,
    paddingHorizontal: 14,
    paddingRight: 44,             
    width: '65%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    padding: 0,
  },
  searchIconWrap: {
    position: 'absolute',
    right: 14,                   
    top: 0,
    bottom: 0,
    width: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
