import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import SvgImage from '../assets/images/14.svg';

type SupplierType = 'Commercial' | 'Residential' | 'Commercial/Residential';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation();
  const [userType, setUserType] = useState<'Customer' | 'Supplier'>('Supplier');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [supplierType, setSupplierType] = useState<SupplierType | ''>('Commercial');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (userType === 'Supplier' && !supplierType) {
      Alert.alert('Error', 'Please select a supplier type');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the Terms & Conditions');
      return;
    }

    setLoading(true);
    // TODO: Implement sign-up API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Account created successfully!');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Section - image0_25_2.png */}
        <View style={styles.topSection}>
          <Image
            source={require('../assets/images/image0_25_2.png')}
            style={styles.topImage}
            resizeMode="contain"
          />
        </View>

        {/* Tagline Section - Green banner with text */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>
            Simplifying Bin Handling{'\n'}
            <Text style={styles.taglineTextWhite}>for Everyone.</Text>
          </Text>
        </View>

        {/* Middle Section - 14.svg illustration */}
        <View style={styles.middleSection}>
          <SvgImage style={styles.svgImage} />
        </View>

        {/* Bottom Section - Form styled to match 14.svg design */}
        <View style={styles.formSection}>
          {/* Sign-up as text */}
          <View style={styles.signUpAsContainer}>
            <Text style={styles.signUpAsText}>Sign-up as</Text>
          </View>

          {/* Role Selector */}
          <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  styles.roleOptionFirst,
                  userType === 'Customer' && styles.roleOptionSelected,
                  userType === 'Customer' && styles.roleOptionSelectedRight,
                ]}
                onPress={() => setUserType('Customer')}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    userType === 'Customer' && styles.roleOptionTextSelected,
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  styles.roleOptionLast,
                  userType === 'Supplier' && styles.roleOptionSelected,
                  userType === 'Supplier' && styles.roleOptionSelectedLeft,
                ]}
                onPress={() => setUserType('Supplier')}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    userType === 'Supplier' && styles.roleOptionTextSelected,
                  ]}
                >
                  Supplier
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name Input */}
            <View style={styles.inputField}>
              <Image
                source={require('../assets/images/image2_25_2.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#979897"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputField}>
              <Image
                source={require('../assets/images/image2_25_2.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor="#979897"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            {/* Email Address Input (Optional) */}
            <View style={styles.inputField}>
              <Image
                source={require('../assets/images/image2_25_2.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address (Optional)"
                placeholderTextColor="#979897"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Supplier Type (only shown when Supplier is selected) */}
            {userType === 'Supplier' && (
              <View style={styles.supplierTypeContainer}>
                <Text style={styles.supplierTypeLabel}>Supplier Type</Text>
                <View style={styles.supplierTypeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.supplierTypeOption,
                      supplierType === 'Commercial' && styles.supplierTypeOptionSelected,
                    ]}
                    onPress={() => setSupplierType('Commercial')}
                  >
                    <Text
                      style={[
                        styles.supplierTypeOptionText,
                        supplierType === 'Commercial' && styles.supplierTypeOptionTextSelected,
                      ]}
                    >
                      Commercial
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.supplierTypeOption,
                      supplierType === 'Residential' && styles.supplierTypeOptionSelected,
                    ]}
                    onPress={() => setSupplierType('Residential')}
                  >
                    <Text
                      style={[
                        styles.supplierTypeOptionText,
                        supplierType === 'Residential' && styles.supplierTypeOptionTextSelected,
                      ]}
                    >
                      Residential
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.supplierTypeOption,
                      supplierType === 'Commercial/Residential' && styles.supplierTypeOptionSelected,
                    ]}
                    onPress={() => setSupplierType('Commercial/Residential')}
                  >
                    <Text
                      style={[
                        styles.supplierTypeOptionText,
                        supplierType === 'Commercial/Residential' && styles.supplierTypeOptionTextSelected,
                      ]}
                    >
                      Commercial/Residential
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputField}>
              <Image
                source={require('../assets/images/image3_25_2.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#979897"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Accept T&C Checkbox */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkboxTouchable}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkboxBox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <View style={styles.checkmark} />}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxText}>Accept T&C</Text>
            </View>

            {/* Sign-up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'Signing up...' : 'Sign-up'}
              </Text>
            </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.loginLinkContainer}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginLinkText}>
              <Text style={styles.tapHereBold}>Tap here</Text> if you have an account
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 55,
  },
  topImage: {
    width: 218,
    height: 122,
  },
  taglineContainer: {
    width: '100%',
    height: 74,
    backgroundColor: '#C9E265',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  taglineText: {
    width: '100%',
    fontFamily: fonts.family.bold,
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 28,
    textAlign: 'center',
    color: '#373934',
  },
  taglineTextWhite: {
    color: '#FFFFFF',
  },
  middleSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230, 251, 191, 0.33)',
  },
  svgImage: {
    width: 430,
    height: 223,
    marginTop: -20,
  },
  signUpAsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 5,
    marginBottom: 15,
  },
  signUpAsText: {
    fontFamily: fonts.family.bold,
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    color: '#373934',
  },
  formSection: {
    width: '100%',
    backgroundColor: 'rgba(230, 251, 191, 0.33)',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  roleSelector: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  roleOptionFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderRightWidth: 1,
  },
  roleOptionLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginLeft: -1,
    borderLeftWidth: 1,
  },
  roleOptionSelected: {
    backgroundColor: '#9AD346',
    borderColor: '#9AD346',
    zIndex: 1,
  },
  roleOptionSelectedRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginRight: -1,
    borderRightWidth: 0,
  },
  roleOptionSelectedLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    marginLeft: -2,
    borderLeftWidth: 0,
  },
  roleOptionText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#373934',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  inputField: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    paddingLeft: 4,
    marginBottom: 10,
  },
  inputIcon: {
    width: 40,
    height: 32,
    marginLeft: 3,
  },
  input: {
    flex: 1,
    height: 50,
    fontFamily: fonts.family.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#373934',
    paddingLeft: 8,
    paddingRight: 16,
  },
  supplierTypeContainer: {
    width: '100%',
    marginBottom: 10,
  },
  supplierTypeLabel: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#373934',
    marginBottom: 10,
  },
  supplierTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  supplierTypeOption: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9AD346',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierTypeOptionSelected: {
    backgroundColor: '#9AD346',
  },
  supplierTypeOptionText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#373934',
    textAlign: 'center',
  },
  supplierTypeOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.family.semiBold,
  },
  checkboxContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxTouchable: {
    width: 23,
    height: 22,
    marginRight: 9,
  },
  checkboxBox: {
    width: 23,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxChecked: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  checkboxText: {
    fontFamily: fonts.family.light,
    fontStyle: 'normal',
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 15,
    color: '#979897',
  },
  signUpButton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9AD346',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 14,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontFamily: fonts.family.bold,
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  loginLinkContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    fontFamily: fonts.family.light,
    fontStyle: 'normal',
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 15,
    textAlign: 'center',
    color: '#979897',
  },
  tapHereBold: {
    fontFamily: fonts.family.bold,
    fontWeight: '600',
  },
});

export default SignUpScreen;
