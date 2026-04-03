import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert,
} from 'react-native';
import { COLORS, POINTS, STAGE_COLORS, STAGE_THRESHOLDS, STAGE_ORDER } from '../constants';
import { Target, Interaction, InteractionType, Stage } from '../types';
import { getTargets, getInteractions, saveTarget, saveInteraction, deleteTarget } from '../storage';
import { getStageForPoints } from '../challenges';
import { StageBadge } from '../components/StageBadge';
import { ProgressBar } from '../components/ProgressBar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useFocusEffect } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import { formatDistanceToNowStrict, format } from 'date-fns';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

const INTERACTION_LABELS: Record<InteractionType, string> = {
  quick_touch: '💬 Quick Touch',
  real_conversation: '🗣️ Real Conversation',
  intentional_hangout: '🤝 Intentional Hangout',
};

export function PersonDetailScreen({ route, navigation }: Props) {
  const { targetId } = route.params;
  const [target, setTarget] = useState<Target | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const targets = await getTargets();
    const t = targets.find((x) => x.id === targetId) ?? null;
    setTarget(t);
    setNotes(t?.notes ?? '');
    const ints = await getInteractions(targetId);
    setInteractions(ints.sort((a, b) => b.date.localeCompare(a.date)));
  }, [targetId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (!target) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Target not found</Text>
      </SafeAreaView>
    );
  }

  const { color, bg } = STAGE_COLORS[target.stage];
  const initials = target.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const nextStage = target.stage === 'acquaintance' ? 'building' : target.stage === 'building' ? 'bro' : null;
  const nextThreshold = nextStage ? STAGE_THRESHOLDS[nextStage] : STAGE_THRESHOLDS.bro;
  const currentThreshold = STAGE_THRESHOLDS[target.stage];
  const stageProgress = nextStage ? (target.totalPoints - currentThreshold) / (nextThreshold - currentThreshold) : 1;

  const handleQuickLog = async (type: InteractionType) => {
    const points = POINTS[type];
    await saveInteraction({ id: uuid(), targetId: target.id, type, points, date: new Date().toISOString() });
    const newPoints = target.totalPoints + points;
    const newStage = getStageForPoints(newPoints);
    await saveTarget({ ...target, totalPoints: newPoints, stage: newStage });
    if (newStage !== target.stage) {
      const stageLabel = newStage === 'bro' ? 'Bro 🔥' : 'Building 🤝';
      Alert.alert('Level Up!', `${target.name.split(' ')[0]} is now ${stageLabel}!`);
    }
    loadData();
  };

  const handleSaveNotes = async () => {
    await saveTarget({ ...target, notes: notes.trim() });
    setEditingNotes(false);
    loadData();
  };

  const handleStatusChange = async (status: 'active' | 'bench' | 'archive') => {
    await saveTarget({ ...target, status });
    navigation.goBack();
  };

  const handleStageOverride = async (stage: Stage) => {
    await saveTarget({ ...target, stage });
    loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: bg, borderColor: color }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{target.name}</Text>
          <View style={styles.stageRow}>
            <StageBadge stage={target.stage} />
            <Text style={styles.pointsText}>{target.totalPoints} pts</Text>
          </View>
          {nextStage && (
            <View style={styles.progressRow}>
              <ProgressBar progress={stageProgress} height={6} color={color} />
              <Text style={styles.progressLabel}>{nextThreshold - target.totalPoints} pts to {nextStage === 'bro' ? 'Bro' : 'Building'}</Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionLabel}>Quick Log</Text>
        <View style={styles.quickLogRow}>
          {(['quick_touch', 'real_conversation', 'intentional_hangout'] as InteractionType[]).map((type) => (
            <TouchableOpacity key={type} style={styles.quickLogBtn} onPress={() => handleQuickLog(type)}>
              <Text style={styles.quickLogEmoji}>{type === 'quick_touch' ? '💬' : type === 'real_conversation' ? '🗣️' : '🤝'}</Text>
              <Text style={styles.quickLogPoints}>+{POINTS[type]}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionLabel}>Notes</Text>
        {editingNotes ? (
          <View>
            <TextInput style={styles.notesInput} value={notes} onChangeText={setNotes} multiline placeholder="Kids in same class, likes hiking..." placeholderTextColor={COLORS.textDim} autoFocus />
            <View style={styles.notesActions}>
              <TouchableOpacity onPress={() => { setEditingNotes(false); setNotes(target.notes); }}><Text style={styles.notesCancelBtn}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNotes}><Text style={styles.notesSaveBtn}>Save</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.notesDisplay} onPress={() => setEditingNotes(true)}>
            <Text style={target.notes ? styles.notesText : styles.notesPlaceholder}>{target.notes || 'Tap to add notes...'}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.sectionLabel}>History</Text>
        {interactions.length === 0 && <Text style={styles.emptyText}>No interactions yet</Text>}
        {interactions.map((interaction) => (
          <View key={interaction.id} style={styles.historyRow}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyType}>{INTERACTION_LABELS[interaction.type]}</Text>
              {interaction.note && <Text style={styles.historyNote}>{interaction.note}</Text>}
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyDate}>{format(new Date(interaction.date), 'MMM d')}</Text>
              <Text style={styles.historyAgo}>{formatDistanceToNowStrict(new Date(interaction.date), { addSuffix: true })}</Text>
            </View>
          </View>
        ))}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Actions</Text>
        <View style={styles.actionGroup}>
          <Text style={styles.actionGroupLabel}>Override Stage</Text>
          <View style={styles.stageButtons}>
            {STAGE_ORDER.map((stage) => (
              <TouchableOpacity key={stage} style={[styles.stageBtn, target.stage === stage && { backgroundColor: STAGE_COLORS[stage].bg }]} onPress={() => handleStageOverride(stage)}>
                <Text style={[styles.stageBtnText, { color: STAGE_COLORS[stage].color }]}>{stage === 'bro' ? 'Bro' : stage === 'building' ? 'Building' : 'Acquaintance'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.actionGroup}>
          {target.status === 'active' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('bench')}><Text style={styles.actionBtnText}>Move to Bench</Text></TouchableOpacity>
          )}
          {target.status === 'bench' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('active')}><Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Activate</Text></TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('archive')}><Text style={[styles.actionBtnText, { color: COLORS.textDim }]}>Archive</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { fontSize: 17, color: COLORS.accent },
  scroll: { padding: 20, paddingBottom: 40 },
  errorText: { color: COLORS.textMuted, fontSize: 16, textAlign: 'center', marginTop: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pointsText: { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  progressRow: { width: '100%', marginTop: 16 },
  progressLabel: { fontSize: 12, color: COLORS.textDim, marginTop: 6, textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textDim, marginBottom: 12, marginTop: 8, textTransform: 'uppercase' },
  quickLogRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickLogBtn: { flex: 1, backgroundColor: COLORS.surfaceContainer, borderRadius: 14, padding: 16, alignItems: 'center' },
  quickLogEmoji: { fontSize: 28, marginBottom: 4 },
  quickLogPoints: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  notesDisplay: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16, marginBottom: 24 },
  notesText: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
  notesPlaceholder: { color: COLORS.textDim, fontSize: 15, fontStyle: 'italic' },
  notesInput: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16, fontSize: 15, color: COLORS.text, minHeight: 80, textAlignVertical: 'top' },
  notesActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8, marginBottom: 24 },
  notesCancelBtn: { fontSize: 15, color: COLORS.textMuted },
  notesSaveBtn: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  historyRow: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  historyLeft: { flex: 1 },
  historyType: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  historyNote: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  historyRight: { alignItems: 'flex-end' },
  historyDate: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  historyAgo: { fontSize: 11, color: COLORS.textDim, marginTop: 2 },
  emptyText: { color: COLORS.textDim, fontSize: 14, marginBottom: 24 },
  actionGroup: { marginBottom: 16 },
  actionGroupLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  stageButtons: { flexDirection: 'row', gap: 8 },
  stageBtn: { flex: 1, backgroundColor: COLORS.surfaceContainer, borderRadius: 10, padding: 10, alignItems: 'center' },
  stageBtnText: { fontSize: 12, fontWeight: '700' },
  actionBtn: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginBottom: 8 },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
});
