import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from './src/constants';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Brotation</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.accent,
    fontSize: 32,
    fontWeight: '700',
  },
});
