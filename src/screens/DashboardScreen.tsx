import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS } from '../constants';
import { Target, Interaction, MonthlyResult } from '../types';
import { ChallengeCard } from '../components/ChallengeCard';
import { PersonCard } from '../components/PersonCard';
import { BenchSection } from '../components/BenchSection';
import { getTargets, getInteractions, getMonthlyResults, saveTarget } from '../storage';
import { getCurrentMonth, suggestMonthlyTarget, getMonthlyHorizontalProgress, getCurrentStreak } from '../challenges';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);

  const loadData = useCallback(async () => {
    const [t, i, r] = await Promise.all([
      getTargets(),
      getInteractions(),
      getMonthlyResults(),
    ]);
    setTargets(t);
    setInteractions(i);
    setMonthlyResults(r);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activeTargets = targets.filter((t) => t.status === 'active');
  const benchTargets = targets.filter((t) => t.status === 'bench');
  const currentMonth = getCurrentMonth();
  const monthlyTarget = suggestMonthlyTarget(activeTargets.length);
  const monthlyProgress = getMonthlyHorizontalProgress(interactions, currentMonth);
  const streak = getCurrentStreak(monthlyResults);

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function getLastInteraction(interactions: Interaction[], targetId: string): Interaction | undefined {
    return interactions.filter((i) => i.targetId === targetId).sort((a, b) => b.date.localeCompare(a.date))[0];
  }

  const handleActivate = async (targetId: string) => {
    const target = targets.find((t) => t.id === targetId);
    if (!target) return;
    await saveTarget({ ...target, status: 'active' });
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BROTATION</Text>
          <View style={styles.monthPill}>
            <Text style={styles.monthText}>{monthLabel}</Text>
          </View>
        </View>

        <ChallengeCard
          monthlyProgress={monthlyProgress}
          monthlyTarget={monthlyTarget}
          streak={streak}
          activeTargets={activeTargets}
          interactions={interactions}
          onPress={() => navigation.navigate('ChallengeDetail')}
        />

        {/* Active Roster */}
        <Text style={styles.sectionLabel}>Active</Text>
        {activeTargets.map((target) => (
          <PersonCard
            key={target.id}
            target={target}
            lastInteraction={getLastInteraction(interactions, target.id)}
            onPress={() => navigation.navigate('PersonDetail', { targetId: target.id })}
          />
        ))}
        {activeTargets.length === 0 && (
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Text style={styles.emptyText}>No active targets yet.</Text>
            <TouchableOpacity
              style={{ backgroundColor: COLORS.accent, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 12 }}
              onPress={() => navigation.navigate('ContactImport')}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Import from Contacts</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bench */}
        <BenchSection
          targets={benchTargets}
          activeCount={activeTargets.length}
          onActivate={handleActivate}
          onPress={(targetId) => navigation.navigate('PersonDetail', { targetId })}
        />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogInteraction', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scroll: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.accent },
  monthPill: { backgroundColor: COLORS.surfaceContainer, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  monthText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '500' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase' },
  emptyText: { color: COLORS.textDim, fontSize: 14, textAlign: 'center', marginVertical: 20 },
  fab: {
    position: 'absolute', bottom: 36, right: 24, width: 56, height: 56, borderRadius: 18,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12,
  },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: '600', marginTop: -2 },
});
