import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, StatusBar, Switch,
} from 'react-native';
import { COLORS, LIGHT_COLORS } from '../../constants/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '../../constants/theme';

const AVATAR_IMG = require('../../assets/images/champion_avatar.png');

// ============================================================
// THEME CONTEXT
// ============================================================
type Palette = typeof COLORS;
const ThemeContext = React.createContext<{
  isDark: boolean;
  toggle: () => void;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  onNavigate?: (id: string) => void;
} | null>(null);
const useTheme = () => React.useContext(ThemeContext)!;

// ============================================================
// TOP STATUS BAR (ping + wifi)
// ============================================================
const TopStatus = () => {
  const { styles, isDark } = useTheme();
  return (
    <View style={styles.topStatus}>
      <View style={styles.row}>
        <View style={styles.serverDot} />
        <Text style={styles.serverText}>ARCANE-US-EAST</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.pingText}>28ms </Text>
        <Text style={styles.wifiIcon}>📶</Text>
        <TouchableOpacity style={styles.themeToggle}>
          <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// LOGO SECTION
// ============================================================
const LogoSection = () => {
  const { styles, isDark } = useTheme();
  return (
    <View style={styles.logoSection}>
      <View style={styles.logoImgWrap}>
        <Image source={AVATAR_IMG} style={styles.logoImg} resizeMode="cover" />
        {!isDark && (
          <View style={styles.logoLightBadge}><Text style={styles.logoLightBadgeText}>IVORY ARCANA</Text></View>
        )}
      </View>
      <Text style={styles.appName}>ARCANE CHESS</Text>
      <View style={styles.row}>
        {isDark ? (
          <>
            <Text style={styles.appSubIcon}>✦ </Text>
            <Text style={styles.appSub}>TACTICAL RPG &amp; STRATEGY</Text>
            <Text style={styles.appSubIcon}> ✦</Text>
          </>
        ) : (
          <>
            <Text style={styles.appSubIconLight}>‹ </Text>
            <Text style={styles.appSub}>TACTICAL RPG &amp; STRATEGY</Text>
            <Text style={styles.appSubIconLight}> ›</Text>
          </>
        )}
      </View>
    </View>
  );
};

// ============================================================
// AUTH TOGGLE (Đăng Nhập / Đăng Ký)
// ============================================================
const AuthToggle = ({ mode, setMode }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void }) => {
  const { styles, colors } = useTheme();
  return (
    <View style={styles.authToggle}>
      <TouchableOpacity
        style={[styles.authToggleBtn, mode === 'login' && styles.authToggleBtnActive]}
        onPress={() => setMode('login')}
      >
        <Text style={[styles.authToggleText, mode === 'login' && styles.authToggleTextActive]}>
          {mode === 'login' ? '⚔' : '◎'} Đăng Nhập
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.authToggleBtn, mode === 'register' && styles.authToggleBtnActive]}
        onPress={() => setMode('register')}
      >
        <Text style={[styles.authToggleText, mode === 'register' && styles.authToggleTextActive]}>
          {mode === 'register' ? '⚔' : '◎'} Đăng Ký
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// LOGIN FORM
// ============================================================
const LoginForm = () => {
  const { styles, colors, isDark } = useTheme();
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [username, setUsername] = useState('arcane_grandmaster@chess.gg');
  const [password, setPassword] = useState('••••••••••••');

  return (
    <View style={styles.form}>
      {/* Username */}
      <View style={styles.fieldWrap}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>TÊN ĐĂNG NHẬP / EMAIL</Text>
          <Text style={styles.fieldHint}>Cấp độ Hiệp Sĩ</Text>
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🛡</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="arcane_grandmaster@chess.gg"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Password */}
      <View style={[styles.fieldWrap, { marginTop: SPACING.md }]}>
        <View style={styles.fieldLabelRow}>
          <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
          <Text style={styles.fieldHint}>Tối thiểu 8 ký tự</Text>
        </View>
        <View style={styles.inputWrap}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            placeholder="••••••••••••"
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Remember + Forgot */}
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: SPACING.md }]}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.checkbox, remember && styles.checkboxActive]}
            onPress={() => setRemember(v => !v)}
          >
            {remember && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
          <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
      </View>

      {/* Login CTA */}
      <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85}>
        <Text style={styles.loginBtnText}>⚔ VÀO BÀN CỜ {isDark ? '' : '›'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// SOCIAL LOGIN
// ============================================================
const SocialLogin = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.socialWrap}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>◆ HOẶC TIẾP TỤC VỚI ◆</Text>
        <View style={styles.divider} />
      </View>
      <View style={styles.socialBtns}>
        {[
          { icon: 'G', color: '#EA4335', bg: '#EA433315' },
          { icon: '', color: '#FFF', bg: '#2A2A3E', appleIcon: true },
          { icon: 'f', color: '#1877F2', bg: '#1877F215' },
          { icon: '♚', color: '#FFB347', bg: '#FFB34715', badge: true },
        ].map((s, i) => (
          <TouchableOpacity key={i} style={[styles.socialBtn, { backgroundColor: s.bg }]}>
            <Text style={[styles.socialIcon, { color: s.color }]}>
              {s.appleIcon ? '🍎' : s.icon}
            </Text>
            {s.badge && <View style={styles.socialBadge}><View style={styles.socialBadgeDot} /></View>}
          </TouchableOpacity>
        ))}
      </View>
      {/* Guest */}
      <TouchableOpacity style={styles.guestBtn}>
        <Text style={styles.guestText}>Chơi Ngay Không Cần Tài Khoản (Khách) →</Text>
      </TouchableOpacity>
      <Text style={styles.guestNote}>
        Tiến trình xếp hạng và trang phục thần thoại sẽ được lưu tạm thời trên thiết bị này.
      </Text>
    </View>
  );
};

// ============================================================
// FOOTER
// ============================================================
const Footer = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.footer}>
      <View style={styles.row}>
        <Text style={styles.footerIcon}>🔒</Text>
        <Text style={styles.footerSecure}>MÃ HOÁ KẾT NỐI ARCANE SSL 256-BIT</Text>
      </View>
      <Text style={styles.footerVersion}>v1.4.2 Arcane Engine • Grandmaster Network</Text>
    </View>
  );
};

// ============================================================
// SCREEN ROOT
// ============================================================
const LoginScreen = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const [isDark, setIsDark] = useState(true);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const colors: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(colors, isDark), [isDark]);
  const ctx = React.useMemo(
    () => ({ isDark, toggle: () => setIsDark(v => !v), colors, styles, onNavigate }),
    [isDark, styles, onNavigate],
  );

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundDark} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Toggle theme in top status bar */}
          <View style={styles.topStatus}>
            <View style={styles.row}>
              <View style={styles.serverDot} />
              <Text style={styles.serverText}>ARCANE-US-EAST</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.pingText}>28ms </Text>
              <Text style={styles.wifiIcon}>📶</Text>
              <TouchableOpacity style={styles.themeToggle} onPress={() => setIsDark(v => !v)}>
                <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <LogoSection />
          <View style={styles.card}>
            <AuthToggle mode={mode} setMode={setMode} />
            <LoginForm />
          </View>
          <SocialLogin />
          <Footer />
        </ScrollView>
      </View>
    </ThemeContext.Provider>
  );
};

// ============================================================
// STYLES
// ============================================================
const makeStyles = (COLORS: Palette, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.xxl },
  row: { flexDirection: 'row', alignItems: 'center' },

  // top status
  topStatus: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.backgroundDark, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingTop: SPACING.xxl + 10,
  },
  serverDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: SPACING.xs },
  serverText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.bold, letterSpacing: 1 },
  pingText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.bold },
  wifiIcon: { fontSize: 12, marginRight: SPACING.xs },
  themeToggle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center', alignItems: 'center', marginLeft: SPACING.sm,
  },
  themeToggleIcon: { fontSize: 14 },

  // logo
  logoSection: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.lg },
  logoImgWrap: {
    width: 90, height: 90, borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2.5, borderColor: COLORS.primary, overflow: 'hidden',
    marginBottom: SPACING.md, ...SHADOW.gold,
    backgroundColor: isDark ? '#0A0520' : '#FFF5E6',
  },
  logoImg: { width: '100%', height: '100%' },
  logoLightBadge: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.primary + 'CC', alignItems: 'center', paddingVertical: 3,
  },
  logoLightBadgeText: { fontSize: 7, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 1 },
  appName: {
    fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary,
    letterSpacing: 3, marginBottom: SPACING.xs,
  },
  appSub: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.bold, letterSpacing: 2 },
  appSubIcon: { fontSize: FONT_SIZE.xs + 1, color: COLORS.accent },
  appSubIconLight: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.extrabold },

  // card
  card: {
    marginHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.backgroundCard, borderWidth: 1.5, borderColor: COLORS.border,
    overflow: 'hidden', ...SHADOW.sm,
  },

  // auth toggle
  authToggle: {
    flexDirection: 'row', backgroundColor: isDark ? '#0D0D1A' : '#F0F2F8',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  authToggleBtn: { flex: 1, paddingVertical: SPACING.md + 2, alignItems: 'center' },
  authToggleBtnActive: { backgroundColor: COLORS.primary },
  authToggleText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textMuted },
  authToggleTextActive: { color: '#1A1205' },

  // form
  form: { padding: SPACING.lg },
  fieldWrap: {},
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  fieldLabel: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textSecondary, letterSpacing: 0.5 },
  fieldHint: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#0D0D1A' : '#FFFFFF',
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5,
    borderColor: isDark ? COLORS.border : '#D8DCE8',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2,
    ...SHADOW.sm,
  },
  inputIcon: { fontSize: 16, marginRight: SPACING.sm },
  input: {
    flex: 1, fontSize: FONT_SIZE.md, color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.medium, outlineStyle: 'none' as any,
  },
  eyeBtn: { paddingLeft: SPACING.sm },
  eyeIcon: { fontSize: 18 },
  checkbox: {
    width: 20, height: 20, borderRadius: BORDER_RADIUS.xs, borderWidth: 2,
    borderColor: COLORS.border, backgroundColor: 'transparent',
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm,
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkMark: { fontSize: 12, color: '#1A1205', fontWeight: FONT_WEIGHT.extrabold },
  rememberText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },
  forgotText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  loginBtn: {
    marginTop: SPACING.xl, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.lg, alignItems: 'center', ...SHADOW.gold,
  },
  loginBtnText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 1 },

  // social
  socialWrap: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 9, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.bold, marginHorizontal: SPACING.sm, letterSpacing: 0.5 },
  socialBtns: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.md, marginBottom: SPACING.lg },
  socialBtn: {
    width: 54, height: 54, borderRadius: BORDER_RADIUS.xl, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border, ...SHADOW.sm,
  },
  socialIcon: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold },
  socialBadge: { position: 'absolute', top: 6, right: 6 },
  socialBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accentBlue },
  guestBtn: { alignItems: 'center', marginBottom: SPACING.sm },
  guestText: { fontSize: FONT_SIZE.md, color: isDark ? COLORS.textPrimary : COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  guestNote: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, textAlign: 'center', lineHeight: 17 },

  // footer
  footer: { alignItems: 'center', paddingTop: SPACING.xl, paddingBottom: SPACING.md, gap: SPACING.sm },
  footerIcon: { fontSize: 12, marginRight: SPACING.xs },
  footerSecure: { fontSize: 9, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.bold, letterSpacing: 0.5 },
  footerVersion: { fontSize: 9, color: COLORS.textMuted },
});

export default LoginScreen;
