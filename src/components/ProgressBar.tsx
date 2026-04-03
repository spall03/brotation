import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
}

export function ProgressBar({ progress, height = 8, color = COLORS.accent }: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${clampedProgress * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: COLORS.surfaceContainerHighest, borderRadius: 999, overflow: 'hidden' },
  fill: { borderRadius: 999 },
});
