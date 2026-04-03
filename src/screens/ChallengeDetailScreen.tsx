import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, QUARTERLY_DEFAULTS, STAGE_COLORS } from '../constants';
import { Target, Interaction, MonthlyResult } from '../types';
import { getTargets, getInteractions, getMonthlyResults } from '../storage';
import {
  getCurrentMonth, getCurrentQuarter, suggestMonthlyTarget,
  getMonthlyHorizontalProgress, getQuarterlyVerticalProgress, getCurrentStreak,
} from '../challenges';
import { ProgressBar } from '../components/ProgressBar';
import { StageBadge } from '../components/StageBadge';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetail'>;

export function ChallengeDetailScreen({ navigation }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [monthlyResults, setMonthlyResults] = useState<MonthlyResult[]>([]);

  const loadData = useCallback(async () => {
    const [t, i, r] = await Promise.all([getTargets(), getInteractions(), getMonthlyResults()]);
    setTargets(t);
    setInteractions(i);
    setMonthlyResults(r);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const activeTargets = targets.filter((t) => t.status === 'active');
  const currentMonth = getCurrentMonth();
  const currentQuarter = getCurrentQuarter();
  const monthlyTarget = suggestMonthlyTarget(activeTargets.length);
  const monthlyProgress = getMonthlyHorizontalProgress(interactions, currentMonth);
  const streak = getCurrentStreak(monthlyResults);
  const sortedResults = [...monthlyResults].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenges</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>This Month</Text>
        <View style={styles.card}>
          <View style={styles.monthlyRow}>
            <Text style={styles.bigNumber}>{monthlyProgress}</Text>
            <Text style={styles.bigTarget}> / {monthlyTarget}</Text>
          </View>
          <Text style={styles.monthlyDesc}>different guys this month</Text>
          <ProgressBar progress={monthlyTarget > 0 ? monthlyProgress / monthlyTarget : 0} />
          {streak > 0 && <Text style={styles.streakText}>🔥 {streak} month streak</Text>}
        </View>
        <Text style={styles.sectionLabel}>This Quarter — Per Person</Text>
        {activeTargets.map((target) => {
          const qDefault = QUARTERLY_DEFAULTS[target.stage];
          const qProgress = getQuarterlyVerticalProgress(interactions, target.id, currentQuarter);
          const hit = qProgress >= qDefault;
          return (
            <View key={target.id} style={styles.quarterRow}>
              <View style={styles.quarterLeft}>
                <Text style={styles.quarterName}>{target.name}</Text>
                <StageBadge stage={target.stage} />
              </View>
              <View style={styles.quarterRight}>
                <Text style={[styles.quarterVal, { color: hit ? COLORS.textDim : STAGE_COLORS[target.stage].color }]}>{qProgress} / {qDefault}</Text>
              </View>
            </View>
          );
        })}
        {activeTargets.length === 0 && <Text style={styles.emptyText}>No active targets</Text>}
        {sortedResults.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Past Months</Text>
            {sortedResults.map((result) => (
              <View key={result.month} style={styles.pastRow}>
                <Text style={styles.pastMonth}>{result.month}</Text>
                <Text style={[styles.pastResult, { color: result.hit ? COLORS.green : COLORS.accent }]}>{result.actual} / {result.target} {result.hit ? '✓' : ''}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  backBtn: { fontSize: 17, color: COLORS.accent },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase' },
  card: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, padding: 20, marginBottom: 24 },
  monthlyRow: { flexDirection: 'row', alignItems: 'baseline' },
  bigNumber: { fontSize: 48, fontWeight: '800', color: COLORS.text },
  bigTarget: { fontSize: 32, fontWeight: '300', color: COLORS.textDim },
  monthlyDesc: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  streakText: { fontSize: 14, color: COLORS.gold, marginTop: 12 },
  quarterRow: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quarterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quarterName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  quarterRight: {},
  quarterVal: { fontSize: 18, fontWeight: '700' },
  emptyText: { color: COLORS.textDim, fontSize: 14 },
  pastRow: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  pastMonth: { fontSize: 15, color: COLORS.text },
  pastResult: { fontSize: 15, fontWeight: '700' },
});
