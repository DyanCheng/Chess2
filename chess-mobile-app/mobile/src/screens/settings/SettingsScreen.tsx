import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Switch } from 'react-native';
import { COLORS } from '../../constants/theme';
import { GradientButton } from '../../components/common/GradientButton';
import { serverConfig } from '../../services/serverConfig';
import { useAuthStore } from '../../store/authStore';

export const SettingsScreen = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [serverUrl, setServerUrl] = useState('');
  const [serverStatus, setServerStatus] = useState('Chơi với bot không cần máy chủ.');
  const [databaseStatus, setDatabaseStatus] = useState('');

  useEffect(() => {
    serverConfig.getUrl().then(setServerUrl).catch(() => setServerStatus('Không đọc được cấu hình máy chủ.'));
  }, []);

  const saveServer = async () => {
    try {
      await serverConfig.setUrl(serverUrl);
      const url = await serverConfig.getUrl();
      if (!url) {
        setServerStatus('Đã tắt máy chủ online. Bạn vẫn có thể chơi với bot.');
        return;
      }
      const response = await fetch(`${url}/health`);
      setServerStatus(response.ok ? 'Đã kết nối máy chủ. Có thể tìm trận PvP.' : `Máy chủ trả về HTTP ${response.status}.`);
      if (response.ok) await useAuthStore.getState().hydrate();
    } catch (reason) {
      setServerStatus(reason instanceof Error ? reason.message : 'Không kết nối được máy chủ.');
    }
  };

  const checkDatabase = async () => {
    try {
      const url = await serverConfig.getUrl();
      if (!url) {
        setDatabaseStatus('Lưu địa chỉ backend trước khi kiểm tra Supabase.');
        return;
      }
      const response = await fetch(`${url}/health/database`);
      setDatabaseStatus(response.ok ? 'Backend đã kết nối Supabase.' : 'Supabase chưa sẵn sàng trên backend.');
    } catch {
      setDatabaseStatus('Không liên lạc được backend để kiểm tra Supabase.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài Đặt</Text>
      <Text style={styles.settingLabel}>Máy chủ PvP trên cùng mạng Wi-Fi</Text>
      <TextInput style={styles.input} value={serverUrl} onChangeText={setServerUrl}
        placeholder="http://192.168.1.10:8080" placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      <GradientButton title="Lưu và kiểm tra kết nối" onPress={saveServer} size="small" />
      <Text style={styles.hint}>{serverStatus}</Text>
      <GradientButton title="Kiểm tra Supabase" onPress={() => { void checkDatabase(); }} size="small" />
      {!!databaseStatus && <Text style={styles.hint}>{databaseStatus}</Text>}
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Âm thanh</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary }}
          thumbColor={'white'}
        />
      </View>
      
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Thông báo</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ false: COLORS.surfaceBorder, true: COLORS.primary }}
          thumbColor={'white'}
        />
      </View>
      
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  settingLabel: {
    color: 'white',
    fontSize: 16,
  },
  input: { backgroundColor: COLORS.bgCard, color: COLORS.textPrimary, borderWidth: 1,
    borderColor: COLORS.surfaceBorder, borderRadius: 10, padding: 12, marginBottom: 12 },
  hint: { color: COLORS.textMuted, marginVertical: 14 },
  versionContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 20,
  },
  versionText: {
    color: COLORS.textMuted,
    fontSize: 12,
  }
});
