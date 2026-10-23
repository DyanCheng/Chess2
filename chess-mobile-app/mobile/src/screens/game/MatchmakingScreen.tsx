// ============================================================
// MatchmakingScreen - Finding PvP opponent
// ============================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/types';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { GradientButton } from '../../components/common/GradientButton';
import { formatTime } from '../../utils/formatCurrency';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MatchmakingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { matchStatus, searchTime, startSearching, cancelSearch, matchFound } = useMatchmaking();
  
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startSearching();
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    // Rotate animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      cancelSearch();
    };
  }, []);

  useEffect(() => {
    if (matchFound) {
      setTimeout(() => {
        navigation.replace('GamePvP');
      }, 1500);
    }
  }, [matchFound, navigation]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.content}>
          <Text style={styles.title}>
            {matchFound ? 'ĐÃ TÌM THẤY ĐỐI THỦ!' : 'ĐANG TÌM KIẾM...'}
          </Text>
          
          <Animated.View style={[styles.radarContainer, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.radarRing1} />
            <View style={styles.radarRing2} />
            <Animated.View style={[styles.radarSweep, { transform: [{ rotate: spin }] }]} />
            <Text style={styles.radarIcon}>{matchFound ? '⚔️' : '🔍'}</Text>
          </Animated.View>

          <View style={styles.statsContainer}>
            <Text style={styles.timeText}>{formatTime(searchTime)}</Text>
            {!matchFound && (
              <Text style={styles.estimatedText}>
                Dự kiến: {formatTime(matchStatus.estimatedWait)}
              </Text>
            )}
            <Text style={styles.playersOnline}>
              🟢 {matchStatus.playersOnline} người đang online
            </Text>
          </View>
        </View>

        {!matchFound && (
          <View style={styles.actionContainer}>
            <GradientButton
              title="Hủy Tìm Kiếm"
              onPress={() => {
                cancelSearch();
                navigation.goBack();
              }}
              variant="outline"
              size="large"
              fullWidth
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginBottom: SPACING.huge,
    letterSpacing: 2,
    textAlign: 'center',
  },
  radarContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.huge,
  },
  radarRing1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primaryGlow,
  },
  radarRing2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  radarSweep: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderTopWidth: 100,
    borderRightWidth: 100,
    borderTopColor: COLORS.primaryGlow,
    borderRightColor: 'transparent',
    opacity: 0.3,
  },
  radarIcon: {
    fontSize: 48,
  },
  statsContainer: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.bold,
    fontVariant: ['tabular-nums'],
  },
  estimatedText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
  },
  playersOnline: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.md,
  },
  actionContainer: {
    width: '100%',
  },
});
