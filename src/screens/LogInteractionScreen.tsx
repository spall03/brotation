import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert } from 'react-native';
import { COLORS, POINTS, ACTIVE_CAP, STAGE_COLORS } from '../constants';
import { Target, InteractionType } from '../types';
import { getTargets, saveTarget, saveInteraction } from '../storage';
import { getStageForPoints } from '../challenges';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { v4 as uuid } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'LogInteraction'>;

const INTERACTION_OPTIONS: { type: InteractionType; label: string; emoji: string; points: number }[] = [
  { type: 'quick_touch', label: 'Quick Touch', emoji: '💬', points: POINTS.quick_touch },
  { type: 'real_conversation', label: 'Real Conversation', emoji: '🗣️', points: POINTS.real_conversation },
  { type: 'intentional_hangout', label: 'Intentional Hangout', emoji: '🤝', points: POINTS.intentional_hangout },
];

export function LogInteractionScreen({ navigation, route }: Props) {
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(route.params?.targetId);
  const [selectedType, setSelectedType] = useState<InteractionType | undefined>();
  const [note, setNote] = useState('');

  useEffect(() => {
    getTargets().then(setTargets);
  }, []);

  const activeTargets = targets.filter((t) => t.status === 'active');
  const benchTargets = targets.filter((t) => t.status === 'bench');
  const selectedTarget = targets.find((t) => t.id === selectedTargetId);

  const handleSave = useCallback(async () => {
    if (!selectedTargetId || !selectedType) return;
    const target = targets.find((t) => t.id === selectedTargetId);
    if (!target) return;
    const points = POINTS[selectedType];
    await saveInteraction({ id: uuid(), targetId: selectedTargetId, type: selectedType, points, note: note.trim() || undefined, date: new Date().toISOString() });
    const newPoints = target.totalPoints + points;
    const newStage = getStageForPoints(newPoints);
    await saveTarget({ ...target, totalPoints: newPoints, stage: newStage });
    if (target.status === 'bench') {
      const activeCount = activeTargets.length;
      if (activeCount < ACTIVE_CAP) {
        Alert.alert(`Move ${target.name.split(' ')[0]} to Active?`, 'You logged an interaction — want to start actively tracking them?', [
          { text: 'Keep on Bench', style: 'cancel', onPress: () => goBack(points, target.name) },
          { text: 'Activate', onPress: async () => { await saveTarget({ ...target, totalPoints: newPoints, stage: newStage, status: 'active' }); goBack(points, target.name); } },
        ]);
        return;
      }
    }
    goBack(points, target.name);
  }, [selectedTargetId, selectedType, note, targets]);

  const goBack = (points: number, name: string) => {
    navigation.navigate('Dashboard');
  };

  if (!selectedTargetId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Log Interaction</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scroll}>
          {activeTargets.length > 0 && (<>
            <Text style={styles.sectionLabel}>Active</Text>
            {activeTargets.map((t) => (
              <TouchableOpacity key={t.id} style={styles.personRow} onPress={() => setSelectedTargetId(t.id)}>
                <View style={[styles.smallAvatar, { backgroundColor: STAGE_COLORS[t.stage].bg }]}>
                  <Text style={[styles.smallAvatarText, { color: STAGE_COLORS[t.stage].color }]}>{t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</Text>
                </View>
                <Text style={styles.personRowName}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </>)}
          {benchTargets.length > 0 && (<>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Bench</Text>
            {benchTargets.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.personRow, { opacity: 0.6 }]} onPress={() => setSelectedTargetId(t.id)}>
                <View style={styles.smallAvatarDim}><Text style={styles.smallAvatarTextDim}>{t.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}</Text></View>
                <Text style={styles.personRowName}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </>)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => selectedTargetId === route.params?.targetId ? navigation.goBack() : setSelectedTargetId(undefined)}>
          <Text style={styles.cancelBtn}>{selectedTargetId === route.params?.targetId ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectedTarget?.name.split(' ')[0]}</Text>
        <TouchableOpacity onPress={handleSave} disabled={!selectedType}>
          <Text style={[styles.saveBtn, !selectedType && styles.saveBtnDisabled]}>Save</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>What happened?</Text>
        {INTERACTION_OPTIONS.map((option) => (
          <TouchableOpacity key={option.type} style={[styles.typeCard, selectedType === option.type && styles.typeCardSelected]} onPress={() => setSelectedType(option.type)} activeOpacity={0.7}>
            <Text style={styles.typeEmoji}>{option.emoji}</Text>
            <View style={styles.typeInfo}>
              <Text style={styles.typeLabel}>{option.label}</Text>
              <Text style={styles.typePoints}>+{option.points} pts</Text>
            </View>
            {selectedType === option.type && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
        ))}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Note (optional)</Text>
        <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="Talked about camping trip..." placeholderTextColor={COLORS.textDim} multiline />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  cancelBtn: { fontSize: 17, color: COLORS.accent },
  saveBtn: { fontSize: 17, fontWeight: '700', color: COLORS.accent },
  saveBtnDisabled: { color: COLORS.textDim },
  scroll: { padding: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: COLORS.textDim, marginBottom: 12, textTransform: 'uppercase' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 14, marginBottom: 8 },
  personRowName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  smallAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallAvatarText: { fontSize: 15, fontWeight: '700' },
  smallAvatarDim: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHighest },
  smallAvatarTextDim: { fontSize: 15, fontWeight: '700', color: COLORS.textDim },
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surfaceContainer, borderRadius: 14, padding: 18, marginBottom: 10 },
  typeCardSelected: { backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.accent },
  typeEmoji: { fontSize: 28 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  typePoints: { fontSize: 13, color: COLORS.accent, fontWeight: '600', marginTop: 2 },
  checkmark: { fontSize: 18, fontWeight: '700', color: COLORS.accent },
  noteInput: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, padding: 16, fontSize: 15, color: COLORS.text, minHeight: 80, textAlignVertical: 'top' },
});
