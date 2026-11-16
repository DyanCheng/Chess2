import { getLocalMoveRules, useGameStore } from '../src/store/gameStore';
import { SKILL_CARD_BY_ID } from '../src/constants/skillCards';

test('ending a local game as a draw opens the game-over result', () => {
  useGameStore.getState().initGame('pve', 'white');

  useGameStore.getState().agreeDraw();

  const game = useGameStore.getState();
  expect(game.status).toBe('finished');
  expect(game.gameResult).toEqual({ winner: 'draw', reason: 'Hòa theo thỏa thuận' });
  expect(game.showGameOverModal).toBe(true);
});

test('cannot agree to a draw before a game starts', () => {
  useGameStore.getState().resetGame();

  useGameStore.getState().agreeDraw();

  expect(useGameStore.getState().status).toBe('waiting');
});

test('activating Freeze enters target mode and locks the selected enemy piece', () => {
  const store = useGameStore;
  store.getState().initGame('pve', 'white');
  const card = {
    card: SKILL_CARD_BY_ID.skill_freeze,
    instanceId: 'freeze-test',
    isUsable: true,
    cooldownRemaining: 0,
    usesRemaining: 1,
  };
  store.setState({ playerCards: [card] });

  store.getState().useCard(card);
  expect(store.getState().targetingCard?.card.effectType).toBe('freeze');

  store.getState().selectCardTarget({ row: 1, col: 4 });

  const game = store.getState();
  expect(game.targetingCard).toBeNull();
  expect(game.playerCards[0].usesRemaining).toBe(0);
  expect(getLocalMoveRules(game.activeEffects).frozenSquares).toContain('e7');
});
