import React from 'react';
import { act, render } from '@testing-library/react-native';
import { GameOverModal } from '../src/components/game/GameOverModal';
import { admobService } from '../src/services/ads/admobService';

jest.mock('../src/services/ads/admobService', () => ({
  admobService: { showAfterMatch: jest.fn().mockResolvedValue(true) },
}));

describe('GameOverModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows the post-match ad after the result appears', () => {
    render(
      <GameOverModal
        visible
        winner="white"
        reason="CHECKMATE"
        playerColor="white"
        matchId="match-42"
        onPlayAgain={jest.fn()}
        onGoHome={jest.fn()}
      />,
    );

    act(() => { jest.advanceTimersByTime(650); });
    expect(admobService.showAfterMatch).toHaveBeenCalledWith('match-42');
  });
});
