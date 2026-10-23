// ============================================================
// ChessSquare - Individual board square with piece
// ============================================================

import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View } from 'react-native';
import { COLORS, FONT_SIZES } from '../../constants/theme';
import { ChessPiece } from '../../types/chess';
import { PIECE_SYMBOLS } from '../../constants/chess';

interface ChessSquareProps {
  row: number;
  col: number;
  piece: ChessPiece | null;
  isLight: boolean;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCapture: boolean;
  size: number;
  onPress: () => void;
}

export const ChessSquare: React.FC<ChessSquareProps> = React.memo(({
  row,
  col,
  piece,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  isCapture,
  size,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pieceScaleAnim = useRef(new Animated.Value(piece ? 1 : 0)).current;

  // Animate piece appearance
  useEffect(() => {
    if (piece) {
      Animated.spring(pieceScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 200,
        friction: 12,
      }).start();
    } else {
      pieceScaleAnim.setValue(0);
    }
  }, [piece?.id]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getBackgroundColor = () => {
    if (isSelected) return COLORS.boardHighlight;
    if (isLastMove) return COLORS.boardLastMove;
    return isLight ? COLORS.boardLight : COLORS.boardDark;
  };

  const getPieceSymbol = () => {
    if (!piece) return null;
    return PIECE_SYMBOLS[piece.type][piece.color];
  };

  const getPieceShadowColor = () => {
    if (!piece) return 'transparent';
    return piece.color === 'white' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)';
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.square,
        {
          width: size,
          height: size,
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      {/* Selected highlight glow */}
      {isSelected && (
        <View style={[styles.selectedOverlay, { width: size, height: size }]} />
      )}

      {/* Chess piece */}
      {piece && (
        <Animated.View
          style={[
            styles.pieceContainer,
            {
              transform: [
                { scale: Animated.multiply(scaleAnim, pieceScaleAnim) },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.pieceText,
              {
                fontSize: size * 0.7,
                color: piece.color === 'white' ? '#FEFEFE' : '#1A1A2E',
                textShadowColor: getPieceShadowColor(),
                textShadowOffset: { width: 1, height: 2 },
                textShadowRadius: 3,
              },
            ]}
          >
            {getPieceSymbol()}
          </Text>
        </Animated.View>
      )}

      {/* Valid move indicator */}
      {isValidMove && !isCapture && (
        <View style={[styles.validMoveIndicator, { width: size * 0.3, height: size * 0.3 }]} />
      )}

      {/* Capture indicator (ring) */}
      {isCapture && (
        <View
          style={[
            styles.captureIndicator,
            {
              width: size - 4,
              height: size - 4,
              borderRadius: (size - 4) / 2,
            },
          ]}
        />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedOverlay: {
    position: 'absolute',
    backgroundColor: COLORS.boardHighlight,
  },
  pieceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceText: {
    lineHeight: undefined,
  },
  validMoveIndicator: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.boardValidMove,
  },
  captureIndicator: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: COLORS.boardValidMove,
    backgroundColor: 'transparent',
  },
});
