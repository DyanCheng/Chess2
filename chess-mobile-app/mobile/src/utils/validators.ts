// ============================================================
// Validators - Input validation helpers
// ============================================================

export function isValidUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Tên người dùng không được để trống' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'Tên người dùng phải có ít nhất 3 ký tự' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Tên người dùng không được quá 20 ký tự' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Tên chỉ được chứa chữ cái, số và dấu gạch dưới' };
  }
  return { valid: true };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  return { valid: true };
}
