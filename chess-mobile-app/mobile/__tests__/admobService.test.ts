const mockListeners: Record<string, (() => void) | undefined> = {};
const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockShow = jest.fn().mockResolvedValue(undefined);
const mockLoad = jest.fn();
const mockCreateForAdRequest = jest.fn(() => ({
  addAdEventListener: jest.fn((event: string, listener: () => void) => {
    mockListeners[event] = listener;
    return jest.fn();
  }),
  load: mockLoad,
  show: mockShow,
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(() => ({ initialize: mockInitialize })),
  InterstitialAd: { createForAdRequest: mockCreateForAdRequest },
  AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' },
  TestIds: { INTERSTITIAL: 'test-interstitial' },
}));

import { AdMobService } from '../src/services/ads/admobService';

beforeEach(() => {
  jest.clearAllMocks();
  Object.keys(mockListeners).forEach(key => delete mockListeners[key]);
});

test('preloads one interstitial and shows it once per match', async () => {
  const service = new AdMobService();

  await service.initialize();
  expect(mockInitialize).toHaveBeenCalledTimes(1);
  expect(mockCreateForAdRequest).toHaveBeenCalledWith('test-interstitial', {
    requestNonPersonalizedAdsOnly: true,
  });
  expect(mockLoad).toHaveBeenCalledTimes(1);

  mockListeners.loaded?.();
  await expect(service.showAfterMatch('match-1')).resolves.toBe(true);
  await expect(service.showAfterMatch('match-1')).resolves.toBe(false);
  expect(mockShow).toHaveBeenCalledTimes(1);
});
