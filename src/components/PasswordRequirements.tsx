import React from 'react';
import { Text, View } from 'react-native';

type PasswordRequirementsProps = {
  password: string;
};

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const value = password.trim();
  const requirements = [
    { label: '8+ characters', valid: value.length >= 8 },
    { label: '1 uppercase letter and 1 number', valid: /[A-Z]/.test(value) && /\d/.test(value) },
    { label: '1 special character', valid: /[^A-Za-z0-9]/.test(value) },
  ];

  return (
    <View style={{ width: '100%', borderRadius: 10, borderWidth: 1, borderColor: '#D1FAE5', backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 }}>
      {requirements.map(({ label, valid }) => (
        <Text key={label} style={{ fontSize: 12, color: valid ? '#047857' : '#6B7280' }}>
          {valid ? '✓' : '○'} {label}
        </Text>
      ))}
    </View>
  );
}
