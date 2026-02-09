import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../utils/tailwind';
import { useResponsiveStyle } from '../utils/responsiveStyles';
import ResponsiveImage from '../components/primitives/ResponsiveImage';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import { post } from '../services/apiClient';
import { useSignUp } from '../hooks/signup/useSignUp';
import Button from '../components/commons/Button';
import AttachmentThumbnails from '../components/commons/AttachmentThumbnails'; // ✅ add this
import Snackbar from '../components/commons/Snackbar'; // adjust path if needed

type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  // allow prefilled SSO fields when navigated from SignIn
  SignUp: { email?: string; firstName?: string; lastName?: string } | undefined;
  Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignUp'>;
type SignUpRouteProp = RouteProp<RootStackParamList, 'SignUp'>;

interface Props {
  navigation: NavigationProp;
  route: SignUpRouteProp;
}

const HelpCircleIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <G clipPath="url(#clip0_2245_2137)">
      <Path
        d="M4.545 4.5C4.66255 4.16583 4.89458 3.88405 5.19998 3.70457C5.50538 3.52508 5.86445 3.45947 6.21359 3.51936C6.56273 3.57924 6.87941 3.76076 7.10754 4.03176C7.33567 4.30277 7.46053 4.64576 7.46 5C7.46 6 5.96 6.5 5.96 6.5M6 8.5H6.005M11 6C11 8.76142 8.76142 11 6 11C3.23858 11 1 8.76142 1 6C1 3.23858 3.23858 1 6 1C8.76142 1 11 3.23858 11 6Z"
        stroke="#88AB8E"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_2245_2137">
        <Rect width={12} height={12} fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

const UploadIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <Path
      d="M5.25 9V2.8875L3.3 4.8375L2.25 3.75L6 0L9.75 3.75L8.7 4.8375L6.75 2.8875V9H5.25ZM1.5 12C1.0875 12 0.734375 11.8531 0.440625 11.5594C0.146875 11.2656 0 10.9125 0 10.5V8.25H1.5V10.5H10.5V8.25H12V10.5C12 10.9125 11.8531 11.2656 11.5594 11.5594C11.2656 11.8531 10.9125 12 10.5 12H1.5Z"
      fill="#6C8770"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.3333 14.5L8 12.3723L8.81667 11.6277L10.3333 13.0106L14.1833 9.5L15 10.2447L10.3333 14.5Z"
      fill="white"
    />
  </Svg>
);

// new: small chevron/down icon for dropdowns
const ChevronDownIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke="#6C8770" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp({ navigation, route }: Props) {
  // form state and submit logic from hook
  const {
    role,
    setRole,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    barangay,
    setBarangay,
    barangays,
    errors,
    loading,
    serverError,
    pendingEmail,
    handleSignUp,
    isSSO,
    setIsSSO,
  } = useSignUp();

  // If navigated from SSO, prefill email and mark signup as SSO (email verified)
  useEffect(() => {
    const sso = route?.params;
    if (sso?.email) {
      setEmail(sso.email);
      // Important: mark this as an SSO registration so backend will NOT require email verification
      setIsSSO(true);
    } else {
      setIsSSO(false);
    }
    // Do NOT pass or set username from SSO (only email)
  }, [route?.params, setEmail, setIsSSO]);

  // small local helpers / UI state
  const [emailError, setEmailError] = useState('');
  const [idImage, setIdImage] = useState<string | null>(null);

  // ✅ Preview modal state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showBarangayPicker, setShowBarangayPicker] = useState(false);

  // define roles (was missing)
  const roles = ['Household', 'Operator'];

  const styles = useResponsiveStyle(({ isSm }) => ({
    container: {
      paddingHorizontal: isSm ? 20 : 40,
    },
    heading: {
      fontSize: isSm ? 24 : 28,
    },
    subheading: {
      fontSize: isSm ? 16 : 18,
    },
    input: {
      fontSize: isSm ? 14 : 16,
    },
    label: {
      fontSize: isSm ? 14 : 16,
    },
  }));

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      setSnackbar({
        visible: true,
        message: 'Please allow access to your photo library',
        type: 'error',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // ✅ was 1
    });

    if (!result.canceled && result.assets[0]) {
      setIdImage(result.assets[0].uri);
    }
  };

  const handleCreateAccount = async () => {
    setSubmitted(true);

    // Check for missing fields
    if (
      !role ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !barangay ||
      !idImage ||
      !acceptedTerms
    ) {
      setSnackbar({
        visible: true,
        message: 'Please fill all required fields, upload an ID, and accept terms.',
        type: 'error',
      });
      return;
    }

    try {
      await handleSignUp(idImage);
      if (isSSO) {
        navigation.navigate('AdminPending' as any, { email });
      } else {
        navigation.navigate('VerifyEmail' as any, { email });
      }
    } catch (err: any) {
      const message = err?.message || 'Sign up failed';
      setSnackbar({
        visible: true,
        message: message,
        type: 'error',
      });
    }
  };

  // new: submitted state to track form submission
  const [submitted, setSubmitted] = useState(false);

  // touched state to track which fields have been interacted with
  const [touched, setTouched] = useState({
    role: false,
    firstName: false,
    lastName: false,
    email: false,
    barangay: false,
    idImage: false,
    terms: false,
  });

  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'error' as 'error' | 'success' | 'info',
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 120}
          keyboardOpeningTime={0}
          contentContainerStyle={tw`flex-grow`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[tw`flex-1 py-8`, styles.container]}>
            <Text style={[tw`text-center font-bold text-primary mb-6`, styles.heading]}>
              Sign up
            </Text>

            <View style={tw`items-center mb-6`}>

              <ResponsiveImage
              source={require('../../assets/sibol-green-logo.png')}
              aspectRatio={4}
              maxWidthPercent={60}
              />
            </View>

            <Text style={[tw`text-center font-bold text-primary mb-4`, styles.subheading]}>
              You're creating an account as?
            </Text>

            <View style={tw`gap-4`}>
              <TouchableOpacity
                style={[
                  tw`border-2 rounded-[10px] px-4 py-3 bg-white bg-opacity-80 flex-row items-center justify-between`,
                  (!role && submitted) ? tw`border-red-500` : tw`border-text-gray`
                ]}
                onPress={() => setShowRolePicker(!showRolePicker)}
              >
                <Text style={[tw`text-[#686677]`, styles.input]}>
                  {role || 'Select Role'}
                </Text>
                <ChevronDownIcon />
              </TouchableOpacity>

              {showRolePicker && (
                <View style={tw`border border-text-gray rounded-[10px] bg-white`}>
                  {roles.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={tw`px-4 py-3 border-b border-gray-200`}
                      onPress={() => {
                        setRole(r);
                        setShowRolePicker(false);
                      }}
                    >
                      <Text style={[tw`text-primary`, styles.input]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>First Name</Text>
                  <TextInput
                    onBlur={() => setTouched(t => ({ ...t, firstName: true }))}
                    style={[
                    tw`border-2 rounded-[10px] px-4 py-3 bg-white bg-opacity-80 text-[#686677]`,
                    styles.input,
                    (!firstName.trim() && (touched.firstName || submitted)) ? tw`border-red-500` : tw`border-text-gray`
                  ]}
                    placeholder="First Name"
                    placeholderTextColor="#686677"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Last Name</Text>
                <TextInput
                  onBlur={() => setTouched(t => ({ ...t, lastName: true }))}
                  style={[
                    tw`border-2 rounded-[10px] px-4 py-3 bg-white bg-opacity-80 text-[#686677]`,
                    styles.input,
                    (!lastName.trim() && (touched.lastName || submitted)) ? tw`border-red-500` : tw`border-text-gray`
                  ]}
                  placeholder="Last Name"
                  placeholderTextColor="#686677"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Email</Text>
                <TextInput
                  onBlur={() => setTouched(t => ({ ...t, email: true }))}
                  style={[
                    tw`border-2 rounded-[10px] px-4 py-3 text-[#686677]`,
                    route?.params?.email
                      ? { backgroundColor: '#E8F6EA', color: '#22543D' }
                      : { backgroundColor: '#FFFFFF' },
                    (!email.trim() && (touched.email || submitted)) ? tw`border-red-500` : tw`border-text-gray`,
                    styles.input,
                  ]}
                  placeholder="Email"
                  placeholderTextColor="#686677"
                  value={email}
                  editable={!route?.params?.email}
                  onChangeText={(text) => {
                    if (route?.params?.email) return;
                    setEmail(text);
                    if (text && !validateEmail(text)) {
                      setEmailError('Please enter a valid email address');
                    } else {
                      setEmailError('');
                    }
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailError ? (
                  <Text style={tw`text-red-500 text-xs mt-1`}>{emailError}</Text>
                ) : null}
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Barangay</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowBarangayPicker(true);
                    setTouched(t => ({ ...t, barangay: true }));
                  }}
                  style={[
                    tw`border-2 rounded-[10px] px-4 py-3 bg-white bg-opacity-80 flex-row items-center justify-between`,
                    (!barangay && (touched.barangay || submitted)) ? tw`border-red-500` : tw`border-text-gray`
                  ]}
                >
                  <Text style={[tw`text-[#686677]`, styles.input]}>
                    {barangays.find((b) => String(b.id) === String(barangay))?.name || 'Select Barangay'}
                  </Text>
                  <ChevronDownIcon />
                </TouchableOpacity>

                {/* Modal picker so dropdown isn't clipped inside ScrollView */}
                <Modal
                  visible={showBarangayPicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowBarangayPicker(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setShowBarangayPicker(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}>
                      <View style={{ backgroundColor: '#fff', borderRadius: 10, maxHeight: '60%' }}>
                        <FlatList
                          data={barangays}
                          keyExtractor={(item) => String(item.id)}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              onPress={() => {
                                setBarangay(String(item.id));
                                setShowBarangayPicker(false);
                              }}
                              style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}
                            >
                              <Text style={{ color: '#2e7d32', fontSize: 16 }}>{item.name}</Text>
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={<Text style={{ padding: 16, color: '#666' }}>No barangays available</Text>}
                        />
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>

              <View style={tw`flex-row items-center justify-center gap-2 mt-2`}>
                <View style={tw`flex-1 h-[1px] bg-[#88AB8E] opacity-80`} />
                <Text
                  style={[
                    tw`text-center text-primary opacity-70`,
                    { fontSize: 11, fontWeight: '600' },
                  ]}
                >
                  Please upload a Valid ID for verification
                </Text>
                <HelpCircleIcon />
                <View style={tw`flex-1 h-[1px] bg-[#88AB8E] opacity-80`} />
              </View>

              <View>
                <Text style={[tw`text-primary mb-2`, styles.label]}>Upload an Image</Text>

                <TouchableOpacity
                  onPress={() => {
                    handleImagePick();
                    setTouched(t => ({ ...t, idImage: true }));
                  }}
                  style={[
                    tw`border-2 rounded-[10px] px-4 py-3 bg-white bg-opacity-80 flex-row items-center justify-between`,
                    (!idImage && (touched.idImage || submitted)) ? tw`border-red-500` : tw`border-text-gray`
                  ]}
                >
                  <Text style={[tw`text-[#686677]`, styles.input]}>
                    {idImage ? 'Change Image' : 'Select Image'}
                  </Text>
                  <UploadIcon />
                </TouchableOpacity>

                {/* ✅ Thumbnail preview (tap to preview, remove to clear) */}
                <AttachmentThumbnails
                  style={tw`mt-3`}
                  items={idImage ? [{ uri: idImage, name: 'valid_id.jpg', type: 'image/jpeg' }] : []}
                  showCount={false}
                  size={64}
                  radius={10}
                  onRemove={() => setIdImage(null)}
                  onPressItem={(item) => {
                    setPreviewUri(item.uri);
                    setPreviewVisible(true);
                  }}
                />

                {/* ✅ Preview modal */}
                <Modal
                  visible={previewVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setPreviewVisible(false)}
                >
                  <TouchableWithoutFeedback onPress={() => setPreviewVisible(false)}>
                    <View style={tw`flex-1 bg-black/70 items-center justify-center px-4`}>
                      <TouchableWithoutFeedback>
                        <View style={tw`w-full max-w-[420px] bg-white rounded-2xl overflow-hidden`}>
                          <View style={tw`flex-row items-center justify-between px-4 py-3 border-b border-gray-200`}>
                            <Text style={tw`text-primary font-bold`}>Preview</Text>
                            <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                              <Text style={tw`text-primary font-bold`}>Close</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={tw`bg-black`}>
                            {previewUri ? (
                              <Image
                                source={{ uri: previewUri }}
                                style={{ width: '100%', height: 420 }}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={tw`h-[420px] items-center justify-center`}>
                                <Text style={tw`text-white`}>No preview</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  </TouchableWithoutFeedback>
                </Modal>
              </View>

              <View style={tw`flex-row items-center gap-2 mt-2`}>
                <TouchableOpacity
                  onPress={() => {
                    if (hasReadTerms) {
                      setAcceptedTerms(!acceptedTerms);
                      setTouched(t => ({ ...t, terms: true }));
                    } else {
                      setShowTermsModal(true);
                    }
                  }}
                  disabled={!hasReadTerms && !acceptedTerms}
                >
                  <View
                    style={[
                      tw`w-5 h-5 rounded-[5px] items-center justify-center`,
                      acceptedTerms
                        ? tw`bg-primary`
                        : [
                            tw`bg-white`,
                            tw`border-2`,
                            (!acceptedTerms && (touched.terms || submitted)) ? tw`border-red-500` : tw`border-text-gray`,
                            !hasReadTerms && tw`opacity-50`
                          ]
                    ]}
                  >
                    {acceptedTerms && <CheckIcon />}
                  </View>
                </TouchableOpacity>
                <Text style={[tw`text-primary`, { fontSize: 11, fontWeight: '600' }]}>
                  I accept the{' '}
                  <Text 
                    style={[tw`text-primary underline`, { fontSize: 11, fontWeight: '700' }]}
                    onPress={() => {
                      setShowTermsModal(true);
                      setHasReadTerms(false);
                    }}
                  >
                    terms and privacy policy
                  </Text>
                  {!hasReadTerms && !acceptedTerms && (
                    <Text style={[tw`text-gray-500`, { fontSize: 10 }]}>
                      {' '}(Read to accept)
                    </Text>
                  )}
                </Text>
              </View>

              <Button
                title={loading ? 'Creating account...' : 'Create account'}
                loading={loading}
                onPress={handleCreateAccount}
                textStyle={{ fontSize: 16, fontWeight: '700', color: '#FFFDF4' }}
                style={tw`mt-4`}
              />

              {serverError ? (
                <Text style={tw`text-red-500 text-center mt-4`}>{serverError}</Text>
              ) : null}

              <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={tw`mt-4`}>
                <Text style={[tw`text-center text-primary`, { fontSize: 16, fontWeight: '600' }]}>
                  Already have an account?{' '}
                  <Text style={tw`underline font-bold`}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
      />

      {/* Terms and Privacy Policy Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={tw`flex-1 bg-black/50 justify-end`}>
          <View style={tw`bg-white rounded-t-3xl h-5/6`}>
            {/* Header */}
            <View style={tw`flex-row items-center justify-between px-6 py-4 border-b border-gray-200`}>
              <Text style={tw`text-xl font-bold text-primary`}>Terms & Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Text style={tw`text-primary text-2xl font-bold`}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={tw`flex-1 px-6 py-4`} 
              showsVerticalScrollIndicator={true}
              onScroll={(event) => {
                const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                const isScrolledToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                if (isScrolledToBottom && !hasReadTerms) {
                  setHasReadTerms(true);
                }
              }}
              scrollEventThrottle={400}
            >
              {/* Terms of Service */}
              <Text style={tw`text-2xl font-bold text-primary mb-4`}>Terms of Service</Text>
              
              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>1. Acceptance of Terms</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                By accessing or using SIBOL ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. Your continued use of the Service constitutes acceptance of any modifications to these terms.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>2. Eligibility</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                You must be at least 18 years of age to use SIBOL. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms of Service.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>3. Use of Service</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                You agree to use SIBOL only for lawful purposes and in accordance with these Terms. You shall not use the Service to engage in any activity that violates applicable laws, infringes on the rights of others, or disrupts the operation of the Service. SIBOL reserves the right to suspend or terminate your account if you violate these terms.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>4. User Accounts</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                To access certain features of the Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify SIBOL immediately of any unauthorized use of your account.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>5. Intellectual Property</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                All content, trademarks, logos, and intellectual property displayed on SIBOL are the property of SIBOL or its licensors. You may not reproduce, distribute, modify, or create derivative works from any content without prior written consent from SIBOL.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>6. User Content</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                You retain ownership of any content you submit to SIBOL. However, by submitting content, you grant SIBOL a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in connection with the Service. You are solely responsible for the content you submit and must ensure it does not violate any laws or infringe on third-party rights.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>7. Disclaimers</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                SIBOL is provided "as is" and "as available" without warranties of any kind, either express or implied. SIBOL does not guarantee that the Service will be uninterrupted, error-free, or secure. You use the Service at your own risk.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>8. Limitations of Liability</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                To the maximum extent permitted by law, SIBOL and its affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service. In no event shall SIBOL's total liability exceed the amount you paid, if any, for accessing the Service.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>9. Contact</Text>
              <Text style={tw`text-sm text-gray-700 mb-6`}>
                If you have any questions about these Terms of Service, please contact us at sibolucc@gmail.com or through the contact information provided in the application.
              </Text>

              {/* Privacy Policy */}
              <Text style={tw`text-2xl font-bold text-primary mb-4 mt-6`}>Privacy Policy</Text>
              
              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>Data Privacy Act Compliance</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                SIBOL is committed to protecting your privacy and ensuring compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines. This Privacy Policy explains how we collect, use, store, and protect your personal information in accordance with applicable data protection laws.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>1. Information We Collect</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                We collect the following types of information:
                {"\n"}• Personal Information: Name, email address, contact number, barangay/area information, and identification documents you provide during registration.
                {"\n"}• Usage Data: Information about how you interact with our Service, including device information, IP addresses, browser type, and access times.
                {"\n"}• Location Data: With your consent, we may collect location information to provide location-based services.
                {"\n"}• Waste Management Data: Information related to waste collection, disposal, and recycling activities you engage in through the Service.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>2. How We Use Information</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                We use your information for the following purposes:
                {"\n"}• To provide, maintain, and improve the Service.
                {"\n"}• To process your registration and authenticate your account.
                {"\n"}• To facilitate waste management operations and communications.
                {"\n"}• To send you notifications, updates, and administrative messages.
                {"\n"}• To analyze usage patterns and enhance user experience.
                {"\n"}• To comply with legal obligations and enforce our Terms of Service.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>3. Sharing of Information</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                We do not sell your personal information. We may share your information with:
                {"\n"}• Service Providers: Third-party vendors who assist in operating the Service, subject to confidentiality obligations.
                {"\n"}• Government Authorities: When required by law or to protect the rights, property, or safety of SIBOL, our users, or the public.
                {"\n"}• Business Transfers: In connection with a merger, acquisition, or sale of assets, your information may be transferred to the successor entity.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>4. Cookies and Tracking Technologies</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                We use cookies and similar tracking technologies to enhance your experience on SIBOL. Cookies are small data files stored on your device that help us remember your preferences and analyze Service usage. You can manage cookie preferences through your browser settings, but disabling cookies may affect certain features of the Service.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>5. Data Retention</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                We retain your personal information for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. When your information is no longer needed, we will securely delete or anonymize it.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>6. Data Security</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>7. Your Rights</Text>
              <Text style={tw`text-sm text-gray-700 mb-3`}>
                Under the Data Privacy Act, you have the right to:
                {"\n"}• Access your personal information and request a copy.
                {"\n"}• Correct inaccurate or incomplete information.
                {"\n"}• Object to or restrict the processing of your information.
                {"\n"}• Request deletion of your information, subject to legal requirements.
                {"\n"}• Withdraw consent at any time, where processing is based on consent.
                {"\n"}To exercise these rights, please contact us at sibolucc@gmail.com.
              </Text>

              <Text style={tw`text-base font-bold text-primary mt-4 mb-2`}>8. Contact</Text>
              <Text style={tw`text-sm text-gray-700 mb-6`}>
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact our Data Protection Officer at sibolucc@gmail.com.
              </Text>

              <Text style={tw`text-xs text-gray-500 mb-4 italic`}>
                Last Updated: February 6, 2026
              </Text>
            </ScrollView>

            {/* Footer Button */}
            <View style={tw`px-6 py-4 border-t border-gray-200`}>
              {!hasReadTerms && (
                <Text style={tw`text-center text-gray-500 text-xs mb-2`}>
                  Please scroll to the bottom to continue
                </Text>
              )}
              <Button
                title={hasReadTerms ? "I Understand" : "Scroll to Bottom"}
                onPress={() => {
                  if (hasReadTerms) {
                    setAcceptedTerms(true);
                    setTouched(t => ({ ...t, terms: true }));
                    setShowTermsModal(false);
                  }
                }}
                disabled={!hasReadTerms}
                textStyle={{ fontSize: 16, fontWeight: '700', color: '#FFFDF4' }}
                style={!hasReadTerms ? tw`opacity-50` : undefined}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
