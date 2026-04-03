import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stage } from '../types';
import { STAGE_COLORS } from '../constants';

interface StageBadgeProps { stage: Stage; }

const LABELS: Record<Stage, string> = {
  acquaintance: 'Acquaintance',
  building: 'Building',
  bro: 'Bro',
};

export function StageBadge({ stage }: StageBadgeProps) {
  const { color, bg } = STAGE_COLORS[stage];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color }]}>{LABELS[stage]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
});
