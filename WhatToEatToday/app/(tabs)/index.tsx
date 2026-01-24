import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthContext';

export default function HomeScreen() {
  const { user, guestMode, loading, signIn, signUp, signOut, enterGuestMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const authedLabel = user?.email ? `已登录：${user.email}` : user ? '已登录' : '未登录';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>今天吃什么</Text>
      <Text style={styles.subtitle}>
        {loading ? '加载中…' : `${authedLabel}${guestMode ? '（游客模式）' : ''}`}
      </Text>

      {!user && (
        <>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="邮箱"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="密码"
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.row}>
            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                try {
                  await signIn(email.trim(), password);
                } catch (e: any) {
                  Alert.alert('登录失败', e?.message ?? String(e));
                }
              }}>
              <Text style={styles.buttonText}>登录</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={async () => {
                try {
                  await signUp(email.trim(), password);
                  Alert.alert('注册成功', '请检查邮箱或直接尝试登录（按你的 Supabase 配置而定）。');
                } catch (e: any) {
                  Alert.alert('注册失败', e?.message ?? String(e));
                }
              }}>
              <Text style={styles.buttonText}>注册</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.link}
            onPress={async () => {
              await enterGuestMode();
            }}>
            <Text style={styles.linkText}>先以游客模式体验</Text>
          </TouchableOpacity>
        </>
      )}

      {user && (
        <TouchableOpacity
          style={styles.buttonDanger}
          onPress={async () => {
            try {
              await signOut();
            } catch (e: any) {
              Alert.alert('退出失败', e?.message ?? String(e));
            }
          }}>
          <Text style={styles.buttonText}>退出登录</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 6 },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonSecondary: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonDanger: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  link: { alignSelf: 'center', paddingVertical: 8 },
  linkText: { color: '#2563eb', fontWeight: '600' },
});
