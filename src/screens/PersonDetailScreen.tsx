import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonDetail'>;

export function PersonDetailScreen({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Person: {route.params.targetId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  text: { color: COLORS.text, fontSize: 18 },
});
