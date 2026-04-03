import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, QUARTERLY_DEFAULTS, STAGE_COLORS } from '../constants';
import { Target, Interaction } from '../types';
import { getQuarterlyVerticalProgress, getCurrentQuarter } from '../challenges';
import { ProgressBar } from './ProgressBar';

interface ChallengeCardProps {
  monthlyProgress: number;
  monthlyTarget: number;
  streak: number;
  activeTargets: Target[];
  interactions: Interaction[];
  onPress: () => void;
}

export function ChallengeCard({ monthlyProgress, monthlyTarget, streak, activeTargets, interactions, onPress }: ChallengeCardProps) {
  const quarter = getCurrentQuarter();
  const progress = monthlyTarget > 0 ? monthlyProgress / monthlyTarget : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topBar} />
      <View style={styles.header}>
        <Text style={styles.label}>MONTHLY CHALLENGE</Text>
        {streak > 0 && <Text style={styles.streak}>🔥 {streak} mo streak</Text>}
      </View>
      <View style={styles.numberRow}>
        <Text style={styles.number}>{monthlyProgress}</Text>
        <Text style={styles.target}> / {monthlyTarget}</Text>
      </View>
      <Text style={styles.desc}>Hang out with {monthlyTarget} different {monthlyTarget === 1 ? 'guy' : 'guys'} this month</Text>
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} />
      </View>
      {activeTargets.length > 0 && (
        <View style={styles.chips}>
          {activeTargets.map((target) => {
            const qTarget = QUARTERLY_DEFAULTS[target.stage];
            const qProgress = getQuarterlyVerticalProgress(interactions, target.id, quarter);
            const hit = qProgress >= qTarget;
            const chipColor = hit ? COLORS.textDim : STAGE_COLORS[target.stage].color;
            const firstName = target.name.split(' ')[0];
            return (
              <View key={target.id} style={styles.chip}>
                <Text style={styles.chipName}>{firstName}</Text>
                <Text style={[styles.chipVal, { color: chipColor }]}>{qProgress}/{qTarget}</Text>
              </View>
            );
          })}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 20, marginBottom: 24, overflow: 'hidden' },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.accent },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.accent },
  streak: { fontSize: 12, color: COLORS.gold },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  number: { fontSize: 48, fontWeight: '800', color: COLORS.text },
  target: { fontSize: 32, fontWeight: '300', color: COLORS.textDim },
  desc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  progressContainer: { marginBottom: 16 },
  chips: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, backgroundColor: COLORS.surfaceContainerHigh, borderRadius: 10, padding: 10, alignItems: 'center' },
  chipName: { fontSize: 11, color: COLORS.textDim, marginBottom: 4 },
  chipVal: { fontSize: 16, fontWeight: '700' },
});
