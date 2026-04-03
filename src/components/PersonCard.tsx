import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, STAGE_COLORS, STAGE_THRESHOLDS } from '../constants';
import { Target, Interaction } from '../types';
import { StageBadge } from './StageBadge';
import { ProgressBar } from './ProgressBar';
import { formatDistanceToNowStrict } from 'date-fns';

interface PersonCardProps {
  target: Target;
  lastInteraction?: Interaction;
  onPress: () => void;
}

export function PersonCard({ target, lastInteraction, onPress }: PersonCardProps) {
  const initials = target.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const { color, bg } = STAGE_COLORS[target.stage];
  const nextStage = target.stage === 'acquaintance' ? 'building' : target.stage === 'building' ? 'bro' : null;
  const nextThreshold = nextStage ? STAGE_THRESHOLDS[nextStage] : STAGE_THRESHOLDS.bro;
  const currentThreshold = STAGE_THRESHOLDS[target.stage];
  const stageProgress = nextStage ? (target.totalPoints - currentThreshold) / (nextThreshold - currentThreshold) : 1;
  const lastText = lastInteraction ? formatDistanceToNowStrict(new Date(lastInteraction.date), { addSuffix: true }) : 'No interactions yet';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: bg, borderColor: color }]}>
        <Text style={[styles.avatarText, { color }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{target.name}</Text>
          <StageBadge stage={target.stage} />
        </View>
        <Text style={styles.lastText}>{lastText}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.points}>{target.totalPoints}</Text>
        <Text style={styles.pointsLabel}>pts</Text>
        <View style={styles.miniProgress}>
          <ProgressBar progress={stageProgress} height={4} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  lastText: { fontSize: 13, color: COLORS.textMuted },
  right: { alignItems: 'flex-end', flexShrink: 0 },
  points: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  pointsLabel: { fontSize: 10, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 0.5 },
  miniProgress: { width: 48, marginTop: 6 },
});
