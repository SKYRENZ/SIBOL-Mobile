import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import tw from '../utils/tailwind';

interface RedemptionModalProps {
  visible: boolean;
  code: string;
  pointsUsed: number;
  onClose: () => void;
}

export default function RedemptionModal({ visible, code, pointsUsed, onClose }: RedemptionModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      Clipboard.setString(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Alert.alert('Error', 'Unable to copy code.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Redemption Code',
        message: `Redemption Code: ${code}\nPoints used: ${pointsUsed}\n\nSave this code for collection.`,
      });
    } catch (e) {
      Alert.alert('Error', 'Unable to share/save code.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Reward Claimed!</Text>

          <Text style={styles.label}>Your redemption code:</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{code}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <Text style={styles.actionText}>{copied ? 'Copied' : 'Copy Code'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
              <Text style={[styles.actionText, styles.shareText]}>Download / Save</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.points}>Points used: {pointsUsed}</Text>

          <Text style={styles.instruction}>
            Please save this code. You can copy it or download/save it using the buttons above. Show this code to barangay staff to collect your reward.
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
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2E523A',
    minWidth: '80%',
    alignItems: 'center',
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E523A',
    letterSpacing: 2,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#E6F0E8',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#2E523A',
  },
  actionText: {
    color: '#18472f',
    fontWeight: '600',
  },
  shareText: {
    color: '#fff',
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