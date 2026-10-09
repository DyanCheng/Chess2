// ============================================================
// ChessBoard - Interactive chess board component
// ============================================================

import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { BoardState, BoardPosition } from '../../types/chess';
import { BOARD_SIZE, BOARD_PADDING } from '../../constants/chess';
import { ChessSquare } from './ChessSquare';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_WIDTH = SCREEN_WIDTH - SPACING.xl * 2;
const SQUARE_SIZE = (BOARD_WIDTH - BOARD_PADDING * 2) / BOARD_SIZE;

interface ChessBoardProps {
  board: BoardState;
  selectedSquare: BoardPosition | null;
  validMoves: BoardPosition[];
  lastMove: { from: BoardPosition; to: BoardPosition } | null;
  onSquarePress: (pos: BoardPosition) => void;
  isFlipped?: boolean;
  isInteractive?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedSquare,
  validMoves,
  lastMove,
  onSquarePress,
  isFlipped = false,
  isInteractive = true,
}) => {
  const isSelectedSquare = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isValidMoveSquare = (row: number, col: number) => {
    return validMoves.some(m => m.row === row && m.col === col);
  };

  const isLastMoveSquare = (row: number, col: number) => {
    if (!lastMove) return false;
    return (
      (lastMove.from.row === row && lastMove.from.col === col) ||
      (lastMove.to.row === row && lastMove.to.col === col)
    );
  };

  const rows = useMemo(() => {
    const r = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      r.push(isFlipped ? BOARD_SIZE - 1 - row : row);
    }
    return r;
  }, [isFlipped]);

  const cols = useMemo(() => {
    const c = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      c.push(isFlipped ? BOARD_SIZE - 1 - col : col);
    }
    return c;
  }, [isFlipped]);

  return (
    <View style={styles.boardContainer}>
      {/* Board shadow/glow frame */}
      <View style={styles.boardFrame}>
        {/* Ornate border */}
        <View style={styles.boardBorder}>
          <View style={styles.board}>
            {rows.map(row => (
              <View key={`row-${row}`} style={styles.row}>
                {cols.map(col => {
                  const piece = board[row]?.[col] || null;
                  const isLight = (row + col) % 2 === 0;
                  const isSelected = isSelectedSquare(row, col);
                  const isValidMove = isValidMoveSquare(row, col);
                  const isLastMove = isLastMoveSquare(row, col);

                  return (
                    <ChessSquare
                      key={`${row}-${col}`}
                      row={row}
                      col={col}
                      piece={piece}
                      isLight={isLight}
                      isSelected={isSelected}
                      isValidMove={isValidMove}
                      isLastMove={isLastMove}
                      isCapture={isValidMove && piece !== null}
                      size={SQUARE_SIZE}
                      onPress={() => isInteractive && onSquarePress({ row, col })}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Column labels */}
      <View style={styles.colLabels}>
        {cols.map(col => (
          <View key={`col-${col}`} style={[styles.label, { width: SQUARE_SIZE }]}>
            <View style={styles.labelText}>
              {/* Column letter a-h rendered via StyleSheet */}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export { SQUARE_SIZE, BOARD_WIDTH };

const styles = StyleSheet.create({
  boardContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  boardFrame: {
    borderRadius: BORDER_RADIUS.lg + 4,
    padding: 3,
    backgroundColor: COLORS.accentDark,
    ...SHADOWS.large,
  },
  boardBorder: {
    borderRadius: BORDER_RADIUS.lg + 2,
    padding: 2,
    backgroundColor: COLORS.accent,
  },
  board: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  colLabels: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    paddingHorizontal: BOARD_PADDING,
  },
  label: {
    alignItems: 'center',
  },
  labelText: {
    // Placeholder for label rendering
  },
});
