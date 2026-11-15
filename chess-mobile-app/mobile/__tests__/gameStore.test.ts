import { useGameStore } from '../src/store/gameStore';

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
