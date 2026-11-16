import { createSupabaseAuth } from '../src/services/supabaseAuth';

describe('supabaseAuth', () => {
  const auth = createSupabaseAuth(() => ({
    url: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
  }));

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs in with Supabase and returns the token pair', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }),
    } as Response);

    await expect(auth.signInWithPassword(' User@Example.com ', 'password'))
      .resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=password',
      expect.objectContaining({
        method: 'POST',
        headers: {
          apikey: 'sb_publishable_test',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'user@example.com', password: 'password' }),
      }),
    );
  });

  it('reports invalid credentials without returning a session', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error_code: 'invalid_credentials' }),
    } as Response);

    await expect(auth.signInWithPassword('user@example.com', 'wrong'))
      .rejects.toMatchObject({
        name: 'SupabaseAuthError',
        status: 400,
        code: 'invalid_credentials',
        message: 'Email hoặc mật khẩu không hợp lệ.',
      });
  });

  it('refreshes a session with the stored refresh token', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ access_token: 'new-access', refresh_token: 'new-refresh' }),
    } as Response);

    await expect(auth.refreshSession('old-refresh'))
      .resolves.toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://project.supabase.co/auth/v1/token?grant_type=refresh_token',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refresh_token: 'old-refresh' }),
      }),
    );
  });
});
