import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppModal from './AppModal';
import PasswordInput from './PasswordInput';
import PasswordRequirements from './PasswordRequirements';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import { normalizePassword, validatePassword } from '../utils/passwordValidation';

type Props = {
  visible: boolean;
  initialIdentifier?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

type OtpResponse = {
  maskedDestination: string;
  retryAfterSeconds: number;
};

const ForgotPasswordModal: React.FC<Props> = ({ visible, initialIdentifier = '', onClose, onSuccess }) => {
  const [step, setStep] = useState<'identify' | 'reset'>('identify');
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [maskedDestination, setMaskedDestination] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && step === 'identify') setIdentifier(initialIdentifier);
  }, [visible, initialIdentifier, step]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const requestOtp = async () => {
    if (!identifier.trim()) return setError('Email or phone number is required.');
    setLoading(true);
    setError('');
    const result = await api.post<OtpResponse>(ENDPOINTS.AUTH.FORGOT_PASSWORD_REQUEST, { identifier: identifier.trim() });
    setLoading(false);
    if (!result.success || !result.data) return setError(result.message || 'Unable to send OTP.');
    setMaskedDestination(result.data.maskedDestination);
    setCountdown(result.data.retryAfterSeconds || 30);
    setStep('reset');
  };

  const resetPassword = async () => {
    const passwordError = validatePassword(newPassword);
    if (!/^\d{6}$/.test(otp)) return setError('OTP must contain exactly 6 numbers.');
    if (passwordError) return setError(passwordError);
    if (normalizePassword(newPassword) !== normalizePassword(confirmPassword)) return setError('Passwords do not match.');

    setLoading(true);
    setError('');
    const result = await api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, {
      identifier: identifier.trim(),
      otp,
      newPassword: normalizePassword(newPassword),
    });
    setLoading(false);
    if (!result.success) return setError(result.message || 'Unable to reset password.');

    setStep('identify');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setCountdown(0);
    onClose();
    setTimeout(() => {
      onSuccess(result.message || 'Password reset successfully.');
    }, 250);
  };

  const changeIdentifier = () => {
    setStep('identify');
    setOtp('');
    setError('');
  };

  return (
    <AppModal visible={visible} transparent animationType="fade" title="Forgot Password" onClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          {step === 'identify' ? (
            <>
              <Text style={styles.helpText}>Enter your account email or phone number. The OTP will be sent within 30 seconds.</Text>
              <TextInput style={[styles.input, loading && styles.disabledInput]} value={identifier} onChangeText={setIdentifier} editable={!loading} autoCapitalize="none" placeholder="Email or Phone Number" />
              <TouchableOpacity style={[styles.primaryButton, loading && styles.disabled]} disabled={loading} onPress={requestOtp}>
                <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.helpText}>Enter the 6-number OTP sent to <Text style={styles.destination}>{maskedDestination}</Text>.</Text>
              <TouchableOpacity style={styles.changeIdentifierButton} disabled={loading} onPress={changeIdentifier}>
                <Text style={[styles.changeIdentifierText, loading && styles.resendDisabled]}>← Change Email or Phone Number</Text>
              </TouchableOpacity>
              <TextInput style={styles.input} value={otp} onChangeText={value => setOtp(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" textContentType="oneTimeCode" placeholder="6-number OTP" />
              <PasswordRequirements password={newPassword} />
              <PasswordInput containerStyle={styles.passwordContainer} style={styles.passwordInput} value={newPassword} onChangeText={setNewPassword} placeholder="New Password" autoCapitalize="none" />
              <PasswordInput containerStyle={styles.passwordContainer} style={styles.passwordInput} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm New Password" autoCapitalize="none" />
              <TouchableOpacity style={[styles.primaryButton, loading && styles.disabled]} disabled={loading} onPress={resetPassword}>
                <Text style={styles.primaryButtonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resendButton} disabled={loading || countdown > 0} onPress={requestOtp}>
                <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>{countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  helpText: { fontFamily: fonts.family.regular, color: '#6B7280', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  destination: { fontFamily: fonts.family.semiBold, color: '#373934' },
  input: { width: '100%', height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', paddingHorizontal: 15, marginBottom: 15, fontFamily: fonts.family.regular, color: '#373934' },
  disabledInput: { opacity: 0.6 },
  passwordContainer: { width: '100%', height: 50, marginBottom: 15 },
  passwordInput: { width: '100%', height: 50, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', paddingHorizontal: 15, fontFamily: fonts.family.regular, color: '#373934' },
  primaryButton: { width: '100%', height: 50, borderRadius: 10, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  primaryButtonText: { fontFamily: fonts.family.bold, color: '#FFFFFF', fontSize: 16 },
  disabled: { opacity: 0.6 },
  resendButton: { alignItems: 'center', paddingTop: 16, paddingBottom: 4 },
  resendText: { fontFamily: fonts.family.semiBold, color: themeColors.primary, fontSize: 14 },
  resendDisabled: { color: '#9CA3AF' },
  changeIdentifierButton: { alignSelf: 'flex-start', marginTop: -6, marginBottom: 14 },
  changeIdentifierText: { fontFamily: fonts.family.semiBold, color: themeColors.primary, fontSize: 14 },
  errorBox: { borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', padding: 10, marginBottom: 14 },
  errorText: { fontFamily: fonts.family.regular, color: '#DC2626', fontSize: 13 },
});

export default ForgotPasswordModal;
