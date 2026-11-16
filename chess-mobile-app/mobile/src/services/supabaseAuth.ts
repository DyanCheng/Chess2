export class SupabaseAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = 'SupabaseAuthError';
  }
}

interface TokenSession {
  accessToken: string;
  refreshToken: string;
}

interface SupabaseAuthConfig {
  url?: string;
  publishableKey?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorDetails(payload: unknown): { code: string | null; message: string } {
  if (!isRecord(payload)) return { code: null, message: 'Supabase authentication failed' };

  const codeValue = payload.error_code ?? payload.code ?? payload.error;
  const messageValue = payload.msg ?? payload.message ?? payload.error_description;
  const code = typeof codeValue === 'string' ? codeValue : null;
  const message = typeof messageValue === 'string' ? messageValue : 'Supabase authentication failed';

  if (code === 'invalid_credentials') {
    return {
      code,
      message: 'Email hoặc mật khẩu không hợp lệ.',
    };
  }
  if (code === 'email_not_confirmed') {
    return { code, message: 'Email hoặc mật khẩu không hợp lệ.' };
  }
  if (code === 'over_email_send_rate_limit') {
    return { code, message: 'Supabase đã đạt giới hạn gửi email. Vui lòng thử lại sau.' };
  }
  return { code, message };
}

async function requestToken(
  endpoint: string,
  body: Record<string, string>,
  config: SupabaseAuthConfig,
): Promise<TokenSession> {
  const baseUrl = config.url?.trim().replace(/\/+$/, '');
  const publishableKey = config.publishableKey?.trim();
  if (!baseUrl || !publishableKey) {
    throw new Error('Thiếu cấu hình Supabase công khai trong ứng dụng.');
  }

  const response = await fetch(`${baseUrl}/auth/v1/${endpoint}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error('Supabase trả về phản hồi không hợp lệ.');
  }

  if (!response.ok) {
    const details = getErrorDetails(payload);
    if (response.status === 429) {
      throw new SupabaseAuthError('Đăng nhập đang bị giới hạn. Vui lòng thử lại sau.', response.status, details.code);
    }
    throw new SupabaseAuthError(details.message, response.status, details.code);
  }

  if (
    !isRecord(payload)
    || typeof payload.access_token !== 'string'
    || typeof payload.refresh_token !== 'string'
  ) {
    throw new Error('Supabase không trả về phiên đăng nhập hợp lệ.');
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
  };
}

export function createSupabaseAuth(getConfig: () => SupabaseAuthConfig) {
  return {
    signInWithPassword(email: string, password: string): Promise<TokenSession> {
      return requestToken('token?grant_type=password', {
        email: email.trim().toLowerCase(),
        password,
      }, getConfig());
    },

    refreshSession(refreshToken: string): Promise<TokenSession> {
      return requestToken('token?grant_type=refresh_token', {
        refresh_token: refreshToken,
      }, getConfig());
    },
  };
}

export const supabaseAuth = createSupabaseAuth(() => ({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}));
