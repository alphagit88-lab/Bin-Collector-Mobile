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
import { useAuth } from '../contexts/AuthContext';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import toast from '../utils/toast';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { login, rememberedPhone } = useAuth();
  const [phone, setPhone] = useState(rememberedPhone || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!rememberedPhone);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (rememberedPhone) {
      setPhone(rememberedPhone);
      setRememberMe(true);
    }
  }, [rememberedPhone]);

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      toast.error('Error', 'Please enter both phone number and password');
      return;
    }

    setLoading(true);
    const result = await login(phone, password, rememberMe);
    setLoading(false);

    if (!result.success) {
      toast.error('Login Failed', result.message || 'Invalid credentials');
    }
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
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/image0_25_2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Line 2 - Full width divider */}
        <View style={styles.line2} />

        {/* Hello, Guest */}
        <Text style={styles.helloGuest}>Hello, Guest</Text>

        {/* Welcome to BinCollect */}
        <Text style={styles.welcomeBinCollect}>
          Welcome to <Text style={styles.binCollectGreen}>BinCollect</Text>
        </Text>

        {/* Line 1 - Partial divider */}
        <View style={styles.line1} />

        {/* Smart Bin Management. Simplified. */}
        <Text style={styles.smartBinText}>Smart Bin Management. Simplified.</Text>

        {/* Middle image */}
        <View style={styles.middleImageContainer}>
          <Image
            source={require('../assets/images/image1_25_2.png')}
            style={styles.middleImage}
            resizeMode="contain"
          />
        </View>

        {/* Form section with background */}
        <View style={styles.formSection}>
          {/* Login title */}
          <Text style={styles.loginTitle}>Login</Text>

          {/* Input field 1 - Phone */}
          <View style={styles.inputField1}>
            <Image
              source={require('../assets/images/image2_25_2.png')}
              style={styles.inputIcon1}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input1}
              placeholder="Phone Number"
              placeholderTextColor="#979897"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          {/* Input field 2 - Password */}
          <View style={styles.inputField2}>
            <Image
              source={require('../assets/images/image3_25_2.png')}
              style={styles.inputIcon2}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input2}
              placeholder="Password"
              placeholderTextColor="#979897"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Checkbox and Remember me */}
          <View style={styles.rememberMeContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkboxBox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <View style={styles.checkmark} />}
              </View>
            </TouchableOpacity>
            <Text style={styles.rememberMeText}>Remember me</Text>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <View style={styles.loginButtonOverlay} />
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {/* Sign up text */}
          <TouchableOpacity
            style={styles.signUpContainer}
            onPress={() => navigation.navigate('SignUp' as never)}
          >
            <Text style={styles.signUpText}>
              <Text style={styles.tapHereBold}>Tap here</Text> if you don't have an account.
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
    paddingBottom: 0,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 55,
  },
  logo: {
    width: 218,
    height: 122,
  },
  line2: {
    width: '100%',
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
    marginBottom: 15,
  },
  helloGuest: {
    width: '100%',
    fontFamily: fonts.family.bold,
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 32,
    textAlign: 'center',
    color: '#373934',
    marginBottom: -5,
  },
  welcomeBinCollect: {
    width: '100%',
    fontFamily: fonts.family.bold,
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 32,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 3,
  },
  binCollectGreen: {
    color: '#9AD346',
  },
  line1: {
    width: '72%',
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.12)',
    alignSelf: 'center',
    marginBottom: 5,
  },
  smartBinText: {
    width: '100%',
    fontFamily: fonts.family.semiBold,
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    textAlign: 'center',
    color: '#29B554',
    marginBottom: 0,
  },
  middleImageContainer: {
    width: '100%',
    marginTop: 10,
    aspectRatio: 750 / 383,
  },
  middleImage: {
    width: '100%',
    height: '100%',
  },
  formSection: {
    width: '100%',
    backgroundColor: 'rgba(230, 251, 191, 0.33)',
    paddingTop: 20,
    paddingBottom: 20,
  },
  loginTitle: {
    width: '100%',
    fontFamily: fonts.family.semiBold,
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 29,
    textAlign: 'center',
    color: '#373934',
    marginTop: 0,
    marginBottom: 20,
  },
  inputField1: {
    width: '81%',
    height: 50,
    alignSelf: 'center',
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
    marginBottom: 7,
  },
  inputIcon1: {
    width: 40,
    height: 32,
    marginLeft: 3,
  },
  input1: {
    flex: 1,
    height: 50,
    fontFamily: fonts.family.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#373934',
    paddingLeft: 8,
    paddingRight: 16,
  },
  inputField2: {
    width: '81%',
    height: 50,
    alignSelf: 'center',
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
  inputIcon2: {
    width: 40,
    height: 32,
    marginLeft: 3,
  },
  input2: {
    flex: 1,
    height: 50,
    fontFamily: fonts.family.light,
    fontSize: 18,
    fontWeight: '300',
    color: '#373934',
    paddingLeft: 8,
    paddingRight: 16,
  },
  rememberMeContainer: {
    width: '81%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 31,
  },
  checkboxContainer: {
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
  rememberMeText: {
    fontFamily: fonts.family.light,
    fontStyle: 'normal',
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 15,
    color: '#979897',
  },
  loginButton: {
    width: '81%',
    height: 50,
    alignSelf: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#C9E265',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 14,
  },
  loginButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(137, 217, 87, 0.2)',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: fonts.family.bold,
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 22,
    color: '#FFFFFF',
    zIndex: 1,
  },
  signUpContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
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

export default LoginScreen;
