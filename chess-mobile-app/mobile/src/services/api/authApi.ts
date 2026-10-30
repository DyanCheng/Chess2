import { apiService } from './apiService';

export interface LoginParams {
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  username: string;
}

export const authApi = {
  login: (params: LoginParams) => apiService.login(params.email || params.username || '', params.password),
  register: (params: RegisterParams) => apiService.register(params.email, params.password, params.username),
  getProfile: () => apiService.getProfile(),
  updateProfile: (data: any) => apiService.updateProfile(data),
  logout: () => {
    apiService.clearToken();
    return Promise.resolve({ data: { success: true }, error: null, status: 200 });
  },
};
