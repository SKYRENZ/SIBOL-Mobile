import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import tw from '../utils/tailwind';
import { TourGuideProvider, TourGuideZone, useTourGuideController } from 'rn-tourguide';
import CustomTooltip from '../components/commons/CustomTooltip';
import { HelpCircle } from 'lucide-react-native';

interface RedemptionModalProps {
  visible: boolean;
  code: string;
  pointsUsed: number;
  onClose: () => void;
}

function RedemptionModalContent({
  code,
  pointsUsed,
  onClose,
}: RedemptionModalProps) {
  const [copied, setCopied] = useState(false);
  const { start } = useTourGuideController();

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
    <View style={styles.overlay}>
      <View style={styles.modal}>

        {/* TITLE + ? ICON */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>Reward Claimed!</Text>

          <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
            <TourGuideZone
              zone={1}
              text="Tap here anytime to view this guide again."
              shape="circle"
              borderRadius={15}
            >

            <TouchableOpacity onPress={() => start()} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
                        <Text style={{ fontSize: 18, color: '#111827', fontWeight: '700' }}>?</Text>
                      </TouchableOpacity>
                    </TourGuideZone>
                  </View>
        </View>

        <Text style={styles.label}>Your redemption code:</Text>

        {/* REDEMPTION CODE */}
        <TourGuideZone
          zone={2}
          text="This is your redemption code. Keep it safe and present it when claiming your reward."
          shape="rectangle"
          borderRadius={8}
        >
          <View style={styles.codeBox}>
            <Text style={styles.code}>{code}</Text>
          </View>
        </TourGuideZone>

        <View style={styles.actionsRow}>

          {/* COPY BUTTON */}
          <TourGuideZone
                zone={3}
            text="Tap here to copy your redemption code to your clipboard."
            shape="rectangle"
            borderRadius={8}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
              <Text style={styles.actionText}>
                  {copied ? 'Copied' : 'Copy Code'}
              </Text>
          </TouchableOpacity>
          </TourGuideZone>

          {/* DOWNLOAD / SAVE */}
          <TouchableOpacity style={[styles.actionButton, styles.shareButton]} onPress={handleShare}>
            <TourGuideZone zone={4} text="Tap here to download or save a copy of your redemption code." shape="rectangle" borderRadius={8}>
              <Text style={[styles.actionText, styles.shareText]}>Download / Save</Text>
            </TourGuideZone>
          </TouchableOpacity>
        </View>

        <Text style={styles.points}>Points used: {pointsUsed}</Text>

        {/* INSTRUCTION TEXT */}
        <TourGuideZone
          zone={5}
          text="Make sure to save this code and present it to your barangay staff to successfully claim your reward."
          shape="rectangle"
          borderRadius={8}
        >
          <Text style={styles.instruction}>
            Please save this code. Show this code to barangay staff to collect your reward.
          </Text>
        </TourGuideZone>

        {/* 5️⃣ OK BUTTON */}
        <TourGuideZone
          zone={6}
          text="Tap OK once you have saved your code and are ready to close this window."
          shape="rectangle"
          borderRadius={8}
        >
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </TourGuideZone>

      </View>
    </View>
  );
}

export default function RedemptionModal(props: RedemptionModalProps) {
  if (!props.visible) return null;

  return (
    <Modal
      visible={props.visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={props.onClose}
    >
      <TourGuideProvider
        tooltipComponent={CustomTooltip}
        androidStatusBarVisible={true}
        backdropColor="rgba(0,0,0,0.5)"
        preventOutsideInteraction={true}
      >
        <RedemptionModalContent {...props} />
      </TourGuideProvider>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E523A',
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