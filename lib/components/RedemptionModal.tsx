import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import tw from '../utils/tailwind';

interface RedemptionModalProps {
  visible: boolean;
  code: string;
  pointsUsed: number;
  onClose: () => void;
}

export default function RedemptionModal({ visible, code, pointsUsed, onClose }: RedemptionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true} // ensure overlay doesn't create opaque native background
      animationType="fade"
      presentationStyle="overFullScreen" // helps on iOS to overlay without hiding content
      statusBarTranslucent={true} // Android: avoid replacing status bar space
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>🎉 Reward Claimed!</Text>
          
          <Text style={styles.label}>Your redemption code:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{code}</Text>
          </View>
          
          <Text style={styles.points}>Points used: {pointsUsed}</Text>
          
          <Text style={styles.instruction}>
            Show this code to barangay staff to collect your reward.
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E523A',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    color: '#6C8770',
    marginBottom: 8,
  },
  codeBox: {
    backgroundColor: '#F0F4F0',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2E523A',
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E523A',
    letterSpacing: 2,
    textAlign: 'center',
  },
  points: {
    fontSize: 16,
    color: '#2E523A',
    fontWeight: '600',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#6C8770',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2E523A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});