import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>项目骨架已准备完成</Text>
      <Text style={styles.subtitle}>下一步：建立本地数据库和学习数据模型</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  subtitle: {
    color: '#5f6b7a',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  title: {
    color: '#172033',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
});
