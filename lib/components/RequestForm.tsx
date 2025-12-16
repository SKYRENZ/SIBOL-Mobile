import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paperclip, X } from 'lucide-react-native';
import Button from './commons/Button';

interface Attachment {
  uri: string;
  name: string;
  type: string;
}

interface RequestFormProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    request: string;
    description: string;
    sibolMachineNo: string;
    area: string;
    date: Date;
    attachment: Attachment | null;
  }) => void;
}

export default function RequestForm({
  visible,
  onClose,
  onSave,
}: RequestFormProps) {
  const [request, setRequest] = useState('');
  const [description, setDescription] = useState('');
  const [sibolMachineNo, setSibolMachineNo] = useState('');
  const [area, setArea] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setRequest('');
    setDescription('');
    setSibolMachineNo('');
    setArea('');
    setSelectedDate(new Date());
    setAttachment(null);
    setError(null);
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.fileName || `image_${Date.now()}.jpg`;

      setAttachment({
        uri: asset.uri,
        name: fileName,
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const validateAndSave = () => {
    setError(null);

    if (!request || !request.trim()) {
      setError('Please enter a request');
      return;
    }

    if (!description || !description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!sibolMachineNo || !sibolMachineNo.trim()) {
      setError('Please enter Machine ID');
      return;
    }

    if (!area || !area.trim()) {
      setError('Please enter an area');
      return;
    }

    if (onSave) {
      onSave({
        request,
        description,
        sibolMachineNo,
        area,
        date: selectedDate,
        attachment,
      });
    }

    resetForm();
    onClose();
  };

  const formatDateDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.centered}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.card}>
                  <View style={styles.headingContainer}>
                    <Text style={styles.heading}>Request Form</Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      activeOpacity={0.7}
                    >
                      <X color="#88AB8E" size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Request:</Text>
                    <TextInput
                      value={request}
                      onChangeText={(text) => {
                        setRequest(text);
                        if (error) setError(null);
                      }}
                      placeholder="Enter request"
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={100}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Description:</Text>
                    <TextInput
                      value={description}
                      onChangeText={(text) => {
                        setDescription(text);
                        if (error) setError(null);
                      }}
                      placeholder="Enter description"
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={200}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Machine ID:</Text>
                    <TextInput
                      value={sibolMachineNo}
                      onChangeText={(text) => {
                        setSibolMachineNo(text);
                        if (error) setError(null);
                      }}
                      placeholder="Enter machine number"
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={50}
                    />
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Area:</Text>
                      <TextInput
                        value={area}
                        onChangeText={(text) => {
                          setArea(text);
                          if (error) setError(null);
                        }}
                        placeholder="Enter area"
                        placeholderTextColor="#B0C4B0"
                        style={styles.input}
                        maxLength={50}
                      />
                    </View>

                    <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Date:</Text>
                      <TextInput
                        style={styles.input}
                        value={formatDateDisplay()}
                        editable={false}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#B0C4B0"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Attachment</Text>
                    <TouchableOpacity
                      onPress={handleImagePick}
                      style={styles.attachmentButton}
                    >
                      <Paperclip
                        color="#88AB8E"
                        size={14}
                        strokeWidth={2}
                      />
                      <Text style={styles.attachmentText}>
                        {attachment ? attachment.name : 'attach here the photos for proof'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {error && <Text style={styles.error}>{error}</Text>}

                  <View style={styles.buttonContainer}>
                    <Button
                      title="Add"
                      onPress={validateAndSave}
                      variant="primary"
                      style={styles.button}
                    />
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  centered: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  card: {
    width: '100%',
    maxWidth: 345,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 8,
    overflow: 'visible',
    position: 'relative',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#6C8770',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#88AB8E',
    marginBottom: 6,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
    minHeight: 40,
    justifyContent: 'center',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#AFC8AD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 42,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e7e3',
  },
  attachmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#88AB8E',
    textDecorationLine: 'underline',
    marginLeft: 8, 
    textAlign: 'center',
  },
  error: {
    color: '#C65C5C',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    minHeight: 44,
  },
});
