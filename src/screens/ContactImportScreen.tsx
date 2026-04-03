import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import * as Contacts from 'expo-contacts';
import { COLORS } from '../constants';
import { Target } from '../types';
import { getTargets, saveTarget } from '../storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { v4 as uuid } from 'uuid';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactImport'>;

interface SelectedContact {
  contactId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export function ContactImportScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contacts.ExistingContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Map<string, SelectedContact>>(new Map());
  const [existingContactIds, setExistingContactIds] = useState<Set<string>>(new Set());
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const targets = await getTargets();
    setExistingContactIds(new Set(targets.map((t) => t.contactId).filter(Boolean) as string[]));
    setExistingNames(new Set(targets.map((t) => t.name.toLowerCase())));
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to contacts in Settings.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      return;
    }
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.FirstName, Contacts.Fields.LastName, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      sort: Contacts.SortTypes.FirstName,
    });
    setContacts(data);
    setLoading(false);
  }

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (!c.firstName && !c.lastName) return false;
      if (existingContactIds.has(c.id)) return false;
      const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ');
      if (existingNames.has(fullName.toLowerCase())) return false;
      if (search) return fullName.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [contacts, search, existingContactIds, existingNames]);

  function toggleContact(contact: Contacts.ExistingContact) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(contact.id)) { next.delete(contact.id); }
      else { next.set(contact.id, { contactId: contact.id, firstName: contact.firstName || '', lastName: contact.lastName || '', phone: contact.phoneNumbers?.[0]?.number, email: contact.emails?.[0]?.email }); }
      return next;
    });
  }

  async function handleImport() {
    for (const c of Array.from(selected.values())) {
      await saveTarget({ id: uuid(), name: [c.firstName, c.lastName].filter(Boolean).join(' '), notes: '', phone: c.phone, email: c.email, contactId: c.contactId, stage: 'acquaintance', status: 'bench', totalPoints: 0, createdAt: new Date().toISOString() });
    }
    navigation.goBack();
  }

  const selectedCount = selected.size;

  function renderContact({ item }: { item: Contacts.ExistingContact }) {
    const isSelected = selected.has(item.id);
    const fullName = [item.firstName, item.lastName].filter(Boolean).join(' ');
    const initials = [item.firstName?.[0], item.lastName?.[0]].filter(Boolean).join('').toUpperCase();
    return (
      <TouchableOpacity style={[styles.contactRow, isSelected && styles.contactRowSelected]} onPress={() => toggleContact(item)} activeOpacity={0.7}>
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>{initials || '?'}</Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{fullName}</Text>
          {item.phoneNumbers?.[0]?.number && <Text style={styles.contactDetail}>{item.phoneNumbers[0].number}</Text>}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (<SafeAreaView style={styles.container}><ActivityIndicator size="large" color={COLORS.accent} style={{ marginTop: 40 }} /><Text style={styles.loadingText}>Loading contacts...</Text></SafeAreaView>);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancelBtn}>Cancel</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Import Contacts</Text>
        <TouchableOpacity onPress={handleImport} disabled={selectedCount === 0}>
          <Text style={[styles.importBtn, selectedCount === 0 && styles.importBtnDisabled]}>Add{selectedCount > 0 ? ` (${selectedCount})` : ''}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search contacts..." placeholderTextColor={COLORS.textDim} autoCorrect={false} />
      </View>
      {selectedCount > 0 && (<View style={styles.counterBar}><Text style={styles.counterText}>{selectedCount} selected</Text></View>)}
      <FlatList data={filteredContacts} keyExtractor={(item) => item.id} renderItem={renderContact} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  cancelBtn: { fontSize: 17, color: COLORS.accent },
  importBtn: { fontSize: 17, fontWeight: '700', color: COLORS.accent },
  importBtnDisabled: { color: COLORS.textDim },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: { backgroundColor: COLORS.surfaceContainer, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  counterBar: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: 'rgba(249, 115, 22, 0.1)' },
  counterText: { fontSize: 13, fontWeight: '600', color: COLORS.accent, textAlign: 'center' },
  loadingText: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', marginTop: 12 },
  listContent: { paddingBottom: 40 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.surface },
  contactRowSelected: { backgroundColor: 'rgba(249, 115, 22, 0.05)' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHighest, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarSelected: { backgroundColor: COLORS.accent },
  avatarText: { fontSize: 15, fontWeight: '600', color: COLORS.textDim },
  avatarTextSelected: { color: '#FFFFFF' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  contactDetail: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.surfaceContainerHighest, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
