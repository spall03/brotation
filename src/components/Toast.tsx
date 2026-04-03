import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  text: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
});
