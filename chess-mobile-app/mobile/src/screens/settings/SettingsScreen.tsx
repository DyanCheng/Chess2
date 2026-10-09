import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { COLORS } from '../../constants/theme';

export const SettingsScreen = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cài Đặt</Text>
      
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
