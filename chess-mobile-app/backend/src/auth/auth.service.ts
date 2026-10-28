import {
  BadRequestException, HttpException, HttpStatus, Injectable,
  InternalServerErrorException, UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async register(email: string, password: string, username: string) {
    const cleanEmail = email?.trim().toLowerCase();
    const cleanUsername = username?.trim();
    if (!cleanEmail || !cleanUsername || !password || cleanUsername.length > 40 || password.length < 8) {
      throw new BadRequestException('Cần email, tên 1–40 ký tự và mật khẩu ít nhất 8 ký tự');
    }
    const { data, error } = await this.supabase.publicClient().auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { username: cleanUsername } },
    });
    if (error) {
      const code = 'code' in error ? error.code : undefined;
      if (error.status === 429 || code === 'over_email_send_rate_limit') {
        throw new HttpException(
          'Supabase đã đạt giới hạn gửi email. Vui lòng thử lại sau hoặc cấu hình SMTP riêng.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new BadRequestException(error.message);
    }
    if (!data.user) throw new InternalServerErrorException('Không tạo được tài khoản');
    return {
      user: { id: data.user.id, email: data.user.email, username: cleanUsername },
      accessToken: data.session?.access_token ?? null,
      refreshToken: data.session?.refresh_token ?? null,
      emailConfirmationRequired: !data.session,
    };
  }

  async login(email: string, password: string) {
    if (!email?.trim() || !password) throw new BadRequestException('Cần email và mật khẩu');
    const { data, error } = await this.supabase.publicClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(), password,
    });
    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Email, mật khẩu hoặc xác nhận email chưa hợp lệ');
    }
    const profile = await this.getProfile(data.session.access_token);
    return {
      user: profile,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Thiếu refresh token');
    const { data, error } = await this.supabase.publicClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    const profile = await this.getProfile(data.session.access_token);
    return {
      user: profile,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async getUser(accessToken: string) {
    const { data, error } = await this.supabase.publicClient().auth.getUser(accessToken);
    if (error || !data.user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ');
    return data.user;
  }

  async getProfile(accessToken: string) {
    const user = await this.getUser(accessToken);
    const { data, error } = await this.supabase.userClient(accessToken)
      .from('profiles').select('id,username,created_at,updated_at').eq('id', user.id).single();
    if (error) throw new InternalServerErrorException('Không đọc được hồ sơ Supabase');
    return { ...data, email: user.email };
  }

  async updateProfile(accessToken: string, username: string) {
    const cleanUsername = username?.trim();
    if (!cleanUsername || cleanUsername.length > 40) {
      throw new BadRequestException('Tên cần từ 1 đến 40 ký tự');
    }
    const user = await this.getUser(accessToken);
    const { data, error } = await this.supabase.userClient(accessToken)
      .from('profiles').update({ username: cleanUsername, updated_at: new Date().toISOString() })
      .eq('id', user.id).select('id,username,created_at,updated_at').single();
    if (error) throw new BadRequestException(error.message);
    return { ...data, email: user.email };
  }
}
