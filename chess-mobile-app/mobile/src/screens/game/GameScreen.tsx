// ============================================================
// GameScreen - Main gameplay screen (PvP / PvE)
// ============================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, Text, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/types';
import { useGame } from '../../hooks/useGame';
import { usePlayerStore } from '../../store/playerStore';
import { BOT_LEVELS } from '../../constants/game';

import { ChessBoard } from '../../components/chess/ChessBoard';
import { PlayerInfoBar } from '../../components/game/PlayerInfoBar';
import { CardHand } from '../../components/cards/CardHand';
import { GameOverModal } from '../../components/game/GameOverModal';
import { GradientButton } from '../../components/common/GradientButton';
import { fromAlgebraic } from '../../utils/chessUtils';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'GamePvE'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const GameScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { profile } = usePlayerStore();
  const [boardFlipped, setBoardFlipped] = React.useState(false);
  
  const {
    gameId, mode, status, board, currentTurn, playerColor,
    validMoves, selectedSquare, lastMove, inCheck, timer, whiteHP, blackHP,
    playerCards, activeEffects, selectedCard, targetingCard, showGameOverModal, gameResult,
    startPvPGame, startBotGame, selectSquare, selectCard, useCard,
    agreeDraw, resignGame, resetGame, isPlayerTurn, moveCount
  } = useGame();

  // Initialize game on mount
  useEffect(() => {
    if (!gameId) {
      if (route.name === 'GamePvE') {
        const botId = route.params?.botId || BOT_LEVELS[0].id;
        const bot = BOT_LEVELS.find(b => b.id === botId);
        if (bot) {
          startBotGame(bot);
        }
      } else {
        startPvPGame();
      }
    }
    
    return () => {
      // Don't auto-reset on unmount to allow returning to active game
    };
  }, []);

  const handleResign = () => {
    Alert.alert(
      'Đầu hàng',
      'Bạn có chắc chắn muốn đầu hàng ván này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', style: 'destructive', onPress: resignGame }
      ]
    );
  };

  const handleAgreeDraw = () => {
    Alert.alert(
      'Kết thúc hòa',
      'Bạn có muốn kết thúc ván này với kết quả hòa không?',
      [
        { text: 'Tiếp tục chơi', style: 'cancel' },
        { text: 'Đồng ý hòa', onPress: agreeDraw },
      ],
    );
  };

  const handlePlayAgain = () => {
    resetGame();
    if (route.name === 'GamePvE') {
      const botId = route.params?.botId || BOT_LEVELS[0].id;
      const bot = BOT_LEVELS.find(b => b.id === botId);
      if (bot) startBotGame(bot);
    } else {
      startPvPGame();
    }
  };

  const handleGoHome = () => {
    resetGame();
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleExitMatch = () => {
    Alert.alert(
      'Thoát trận',
      'Ván đấu sẽ bị hủy, không được ghi vào lịch sử và không nhận thưởng. Bạn có muốn thoát?',
      [
        { text: 'Ở lại', style: 'cancel' },
        {
          text: 'Thoát trận',
          style: 'destructive',
          onPress: () => {
            resetGame();
            navigation.navigate('MainTabs', { screen: 'Home' });
          },
        },
      ],
    );
  };

  const openSettings = () => navigation.navigate('MainTabs', { screen: 'Settings' });
  const openProfile = () => navigation.navigate('MainTabs', { screen: 'Profile' });

  if (!profile || status === 'waiting') {
    return <View style={styles.safeArea} />; // Loading state
  }

  // Determine opponent info based on mode
  const botInfo = mode === 'pve' ? BOT_LEVELS.find(b => b.id === route.params?.botId) : null;
  const opponentName = mode === 'pve' ? botInfo?.name || 'Bot' : 'Opponent';
  const opponentRating = mode === 'pve' ? botInfo?.rating || 1000 : 1200;
  const opponentLevel = mode === 'pve' ? botInfo?.level || 1 : 10;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background} />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thoát trận"
            onPress={handleExitMatch}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>×</Text>
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.screenTitle} numberOfLines={1}>Đấu trường Ma Pháp</Text>
            <Text style={styles.screenSubtitle}>Chế độ bot · {opponentName}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cài đặt"
            onPress={openSettings}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>⚙</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hồ sơ"
            onPress={openProfile}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>♙</Text>
          </Pressable>
        </View>

        <View style={styles.modeBar}>
          <Text style={styles.modeText}>⚔  ĐẤU VỚI MÁY</Text>
          <Text style={styles.modeDetail}>CẤP {opponentLevel}</Text>
        </View>

        {/* Opponent Info (Top) */}
        <View style={styles.topSection}>
          <PlayerInfoBar
            username={opponentName}
            level={opponentLevel}
            rating={opponentRating}
            hp={playerColor === 'white' ? blackHP : whiteHP}
            time={playerColor === 'white' ? timer.blackTime : timer.whiteTime}
            isCurrentTurn={currentTurn !== playerColor}
            isOpponent={true}
          />
        </View>

        {/* Chess Board (Center) */}
        <View style={styles.boardSection}>
          <ChessBoard
            board={board}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            effectSquares={activeEffects
              .filter(effect => effect.isActive && effect.targetSquare)
              .map(effect => fromAlgebraic(effect.targetSquare!))}
            lastMove={lastMove}
            onSquarePress={selectSquare}
            isFlipped={boardFlipped ? playerColor !== 'black' : playerColor === 'black'}
            isInteractive={isPlayerTurn && status === 'playing'}
          />
        </View>

        <View style={styles.turnBar}>
          <Text style={[styles.turnDot, isPlayerTurn && styles.playerTurnDot]}>●</Text>
          <Text style={styles.turnText}>
            {status === 'finished' ? 'VÁN ĐẤU ĐÃ KẾT THÚC' : isPlayerTurn ? 'LƯỢT CỦA BẠN' : 'BOT ĐANG ĐI'}
          </Text>
          <Text style={styles.moveCount}>NƯỚC {moveCount}</Text>
        </View>

        {/* Player Info (Bottom) */}
        <View style={styles.bottomSection}>
          <PlayerInfoBar
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            level={profile.level}
            rating={profile.rating}
            hp={playerColor === 'white' ? whiteHP : blackHP}
            time={playerColor === 'white' ? timer.whiteTime : timer.blackTime}
            isCurrentTurn={isPlayerTurn}
            isOpponent={false}
          />
        </View>

        {/* Check Notification Banner */}
        {inCheck && status === 'playing' && (
          <View style={styles.checkBanner}>
            <Text style={styles.checkText}>CHIẾU TƯỚNG!</Text>
          </View>
        )}

        {/* Cards & Actions */}
        <View style={styles.cardsSection}>
          <CardHand
            cards={playerCards}
            selectedCard={selectedCard}
            onSelectCard={selectCard}
            onUseCard={useCard}
            isPlayerTurn={isPlayerTurn}
            targetingCardId={targetingCard?.card.id}
          />
        </View>
        
        {/* Action bar */}
        <View style={styles.actionBar}>
          <Pressable
            accessibilityRole="button"
            disabled={status !== 'playing'}
            onPress={handleAgreeDraw}
            style={[styles.actionButton, styles.drawButton, status !== 'playing' && styles.disabledButton]}
          >
            <Text style={styles.drawIcon}>♧</Text>
            <Text style={styles.actionText}>Hòa</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={status !== 'playing'}
            onPress={handleResign}
            style={[styles.actionButton, styles.resignButton, status !== 'playing' && styles.disabledButton]}
          >
            <Text style={styles.resignIcon}>⚑</Text>
            <Text style={styles.actionText}>Đầu hàng</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setBoardFlipped(value => !value)}
            style={[styles.actionButton, styles.boardButton]}
          >
            <Text style={styles.boardIcon}>↻</Text>
            <Text style={styles.actionText}>Xoay bàn</Text>
          </Pressable>
        </View>
      </View>

      {/* Game Over Modal */}
      <GameOverModal
        visible={showGameOverModal}
        winner={gameResult?.winner || null}
        reason={gameResult?.reason || ''}
        playerColor={playerColor}
        goldEarned={gameResult?.winner === playerColor ? botInfo?.reward.gold || 0 : 0}
        xpEarned={gameResult?.winner === playerColor ? botInfo?.reward.experience || 0 : 0}
        ratingChange={0}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgDark,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1C2027',
  },
  headerButtonText: {
    color: COLORS.textPrimary,
    fontSize: 23,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  modeBar: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#1C2027',
  },
  modeText: {
    color: COLORS.accentLight,
    fontSize: 11,
    fontWeight: '800',
  },
  modeDetail: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  topSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  boardSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
  },
  turnBar: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: 10,
    backgroundColor: '#1C2027',
  },
  turnDot: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  playerTurnDot: {
    color: COLORS.accentLight,
  },
  turnText: {
    color: COLORS.accentLight,
    fontSize: 11,
    fontWeight: '800',
  },
  moveCount: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  bottomSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  cardsSection: {
    paddingBottom: SPACING.sm,
  },
  actionBar: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: 12,
    backgroundColor: '#1C2027',
  },
  drawButton: {
    borderWidth: 1,
    borderColor: '#267B89',
  },
  resignButton: {
    borderWidth: 1,
    borderColor: '#7D3E46',
  },
  boardButton: {
    borderWidth: 1,
    borderColor: '#3A3E47',
  },
  drawIcon: {
    color: '#61D8E5',
    fontSize: 17,
  },
  resignIcon: {
    color: '#FF8B92',
    fontSize: 16,
  },
  boardIcon: {
    color: COLORS.textSecondary,
    fontSize: 18,
  },
  actionText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
  },
  checkBanner: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transform: [{ translateY: -20 }],
  },
  checkText: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    overflow: 'hidden',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
