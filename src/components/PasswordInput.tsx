import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PasswordInputProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
};

const PasswordInput: React.FC<PasswordInputProps> = ({ containerStyle, style, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput {...props} style={[style, styles.input]} secureTextEntry={!visible} />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible(value => !value)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    paddingRight: 42,
  },
  toggle: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PasswordInput;
