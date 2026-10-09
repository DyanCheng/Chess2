// ============================================================
// GameScreen - Main gameplay screen (PvP / PvE)
// ============================================================

import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Alert, Text } from 'react-native';
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

type GameScreenRouteProp = RouteProp<RootStackParamList, 'GamePvE'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const GameScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GameScreenRouteProp>();
  const { profile } = usePlayerStore();
  
  const {
    gameId, mode, status, board, currentTurn, playerColor,
    validMoves, selectedSquare, lastMove, inCheck, timer, whiteHP, blackHP,
    playerCards, selectedCard, showGameOverModal, gameResult,
    startPvPGame, startBotGame, selectSquare, selectCard, useCard,
    resignGame, resetGame, isPlayerTurn
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
            lastMove={lastMove}
            onSquarePress={selectSquare}
            isFlipped={playerColor === 'black'}
            isInteractive={isPlayerTurn && status === 'playing'}
          />
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
          />
        </View>
        
        {/* Action bar */}
        <View style={styles.actionBar}>
          <GradientButton 
            title="Đầu hàng" 
            onPress={handleResign} 
            variant="outline" 
            size="small" 
          />
        </View>
      </View>

      {/* Game Over Modal */}
      <GameOverModal
        visible={showGameOverModal}
        winner={gameResult?.winner || null}
        reason={gameResult?.reason || ''}
        playerColor={playerColor}
        goldEarned={gameResult?.winner === playerColor ? 30 : 5}
        xpEarned={gameResult?.winner === playerColor ? 25 : 10}
        ratingChange={gameResult?.winner === playerColor ? 15 : -12}
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
  },
  topSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  boardSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  cardsSection: {
    paddingBottom: SPACING.sm,
  },
  actionBar: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
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
