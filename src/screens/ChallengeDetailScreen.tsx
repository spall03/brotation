import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export function ChallengeDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Challenge Details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.text, fontSize: 18 },
});
