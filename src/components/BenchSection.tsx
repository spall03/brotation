import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, ACTIVE_CAP } from '../constants';
import { Target } from '../types';

interface BenchSectionProps {
  targets: Target[];
  activeCount: number;
  onActivate: (targetId: string) => void;
  onPress: (targetId: string) => void;
}

export function BenchSection({ targets, activeCount, onActivate, onPress }: BenchSectionProps) {
  const [expanded, setExpanded] = useState(false);
  if (targets.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Bench</Text>
      <TouchableOpacity style={styles.toggle} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.toggleLabel}>{targets.length} more {targets.length === 1 ? 'person' : 'people'}</Text>
        <Text style={styles.arrow}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && targets.map((target) => {
        const initials = target.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
        const canActivate = activeCount < ACTIVE_CAP;
        return (
          <TouchableOpacity key={target.id} style={styles.benchPerson} onPress={() => onPress(target.id)} activeOpacity={0.7}>
            <View style={styles.benchAvatar}>
              <Text style={styles.benchAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.benchName}>{target.name}</Text>
            {canActivate && (
              <TouchableOpacity style={styles.activateBtn} onPress={(e) => { e.stopPropagation(); onActivate(target.id); }}>
                <Text style={styles.activateBtnText}>Activate</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase' },
  toggle: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textMuted },
  arrow: { fontSize: 12, color: COLORS.textDim },
  benchPerson: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 12, paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.7 },
  benchAvatar: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  benchAvatarText: { fontSize: 14, fontWeight: '700', color: COLORS.textDim },
  benchName: { fontSize: 14, fontWeight: '500', color: COLORS.text, flex: 1 },
  activateBtn: { backgroundColor: 'rgba(249, 115, 22, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activateBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.accent },
});
