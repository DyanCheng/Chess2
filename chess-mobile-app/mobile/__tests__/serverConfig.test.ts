jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { resolveServerUrl } from '../src/services/serverConfig';

test('uses the environment URL by default and preserves a saved override', () => {
  expect(resolveServerUrl(null, 'https://api.example.com/')).toBe('https://api.example.com');
  expect(resolveServerUrl('https://custom.example.com', 'https://api.example.com/'))
    .toBe('https://custom.example.com');
  expect(resolveServerUrl('', 'https://api.example.com/')).toBe('');
});
