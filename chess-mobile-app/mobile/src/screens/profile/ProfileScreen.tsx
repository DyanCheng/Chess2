import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerAvatar } from '../../components/common/PlayerAvatar';
import { GradientButton } from '../../components/common/GradientButton';
import { authApi } from '../../services/api';

export const ProfileScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { profile, stats } = usePlayerStore();

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Vui lòng đăng nhập</Text>
        <GradientButton title="Đăng nhập" onPress={() => navigation.navigate('Auth')} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <PlayerAvatar 
            username={profile.username} 
            avatarUrl={profile.avatarUrl} 
            level={profile.level} 
            size="large" 
            showLevel 
          />
          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.rating}>Elo: {profile.rating}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Thống kê</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.wins}</Text>
              <Text style={styles.statLabel}>Thắng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.draws}</Text>
              <Text style={styles.statLabel}>Hòa</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{profile.losses}</Text>
              <Text style={styles.statLabel}>Thua</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.winRate?.toFixed(1) || 0}%</Text>
              <Text style={styles.statLabel}>Tỉ lệ thắng</Text>
            </View>
          </View>
        </View>

        <View style={styles.currencyContainer}>
          <View style={styles.currencyBox}>
            <Text style={styles.currencyLabel}>Vàng</Text>
            <Text style={styles.currencyValue}>🟡 {profile.gold}</Text>
          </View>
          <View style={styles.currencyBox}>
            <Text style={styles.currencyLabel}>Kim cương</Text>
            <Text style={styles.currencyValue}>💎 {profile.gems}</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <GradientButton 
            title="Sửa hồ sơ" 
            onPress={() => {}} 
            variant="outline" 
            fullWidth 
            style={styles.actionBtn}
          />
          <GradientButton 
            title="Đăng xuất" 
            onPress={async () => {
              await authApi.logout();
              navigation.replace('Auth');
            }} 
            variant="danger" 
            fullWidth 
            style={styles.actionBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  text: {
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  container: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  username: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  rating: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  statsContainer: {
    marginBottom: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currencyContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  currencyBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  currencyValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  actionsContainer: {
    gap: SPACING.md,
  },
  actionBtn: {
    marginBottom: SPACING.sm,
  },
});
