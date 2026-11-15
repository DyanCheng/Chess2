import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

const COLORS = {
  background: '#101419',
  panel: '#191E24',
  input: '#090D12',
  border: '#202830',
  gold: '#F6A10A',
  goldDark: '#8E5100',
  cyan: '#39D5ED',
  cream: '#D5C5B5',
  muted: '#8E8985',
  white: '#F5F2EF',
  error: '#FF8D82',
};

const REMEMBERED_EMAIL_KEY = 'arcane_chess_remembered_email';

type AuthTab = 'login' | 'register';
export const LoginScreen: React.FC = () => {
  const login = useAuthStore(state => state.login);
  const register = useAuthStore(state => state.register);
  const enterGuestMode = useAuthStore(state => state.enterGuestMode);
  const isLoading = useAuthStore(state => state.isLoading);
  const authError = useAuthStore(state => state.error);
  const clearAuthError = useAuthStore(state => state.clearError);

  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(REMEMBERED_EMAIL_KEY)
      .then(savedEmail => {
        if (isMounted && savedEmail) setEmail(savedEmail);
      })
      .catch(() => {
        if (isMounted) setFormError('Không thể tải email đã lưu trên thiết bị.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const changeTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setFormError(null);
    clearAuthError();
  };

  const handleSubmit = async () => {
    setFormError(null);
    clearAuthError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    if (activeTab === 'register') {
      if (!username.trim()) {
        setFormError('Vui lòng nhập tên hiển thị.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setFormError('Vui lòng nhập địa chỉ email hợp lệ.');
        return;
      }
      if (password.length < 8) {
        setFormError('Mật khẩu cần có ít nhất 8 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Mật khẩu xác nhận không khớp.');
        return;
      }

      try {
        const confirmationRequired = await register(trimmedEmail, password, username.trim());
        if (confirmationRequired) {
          setActiveTab('login');
          setPassword('');
          setConfirmPassword('');
          Alert.alert('Kiểm tra email', 'Hãy xác nhận email trước khi đăng nhập.');
          return;
        }
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'Đăng ký thất bại.');
      }
      return;
    }

    try {
      await login(trimmedEmail, password);
      try {
        if (rememberEmail) {
          await AsyncStorage.setItem(REMEMBERED_EMAIL_KEY, trimmedEmail);
        } else {
          await AsyncStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        Alert.alert(
          'Đăng nhập thành công',
          'Không thể lưu tùy chọn ghi nhớ email trên thiết bị này.',
        );
        return;
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Đăng nhập thất bại.');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Chưa hỗ trợ khôi phục mật khẩu',
      'Máy chủ hiện chưa có chức năng gửi email đặt lại mật khẩu.',
    );
  };

  const title = activeTab === 'login' ? 'VÀO BÀN CỜ' : 'TẠO TÀI KHOẢN';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.topBar}>
        <View style={styles.serverInfo}>
          <View style={styles.statusDot} />
          <Text style={styles.serverName}>ARCANE CHESS</Text>
        </View>
        <Text style={styles.serverLabel}>TACTICAL RPG</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.branding}>
            <View style={styles.logoFrame}>
              <Image
                source={require('../../assets/images/arcane-chess-logo.png')}
                style={styles.logo}
                accessibilityLabel="Biểu tượng Arcane Chess"
              />
            </View>
            <Text style={styles.brandTitle}>ARCANE CHESS</Text>
            <Text style={styles.tagline}>✦  TACTICAL RPG & STRATEGY  ✦</Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'login' }}
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => changeTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                ⚔  Đăng Nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'register' }}
              style={[styles.tab, activeTab === 'register' && styles.activeTab]}
              onPress={() => changeTab('register')}
            >
              <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                ✥  Đăng Ký
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            {activeTab === 'register' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>TÊN HIỂN THỊ</Text>
                  <Text style={styles.hint}>Tên trong game</Text>
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.inputIcon}>♙</Text>
                  <TextInput
                    accessibilityLabel="Tên hiển thị"
                    style={styles.textInput}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Nhập tên của bạn"
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>EMAIL TÀI KHOẢN</Text>
                <Text style={styles.hint}>Cấp độ Hiệp Sĩ</Text>
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>♙</Text>
                <TextInput
                  accessibilityLabel="Email tài khoản"
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>MẬT KHẨU</Text>
                <Text style={styles.hint}>Tối thiểu 8 ký tự</Text>
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputIcon}>♙</Text>
                <TextInput
                  accessibilityLabel="Mật khẩu"
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={COLORS.muted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType={activeTab === 'register' ? 'next' : 'go'}
                  onSubmitEditing={activeTab === 'login' ? handleSubmit : undefined}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onPress={() => setShowPassword(value => !value)}
                  hitSlop={8}
                >
                  <Text style={styles.visibilityIcon}>{showPassword ? '◉' : '◎'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeTab === 'register' && (
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>XÁC NHẬN MẬT KHẨU</Text>
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.inputIcon}>♙</Text>
                  <TextInput
                    accessibilityLabel="Xác nhận mật khẩu"
                    style={styles.textInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor={COLORS.muted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                  />
                </View>
              </View>
            )}

            {activeTab === 'login' ? (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberEmail }}
                  style={styles.rememberButton}
                  onPress={() => setRememberEmail(value => !value)}
                >
                  <View style={[styles.checkbox, rememberEmail && styles.checkedBox]}>
                    {rememberEmail && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Ghi nhớ email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {(formError || authError) && (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {formError || authError}
              </Text>
            )}

            <TouchableOpacity
              accessibilityRole="button"
              disabled={isLoading}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.goldDark} />
              ) : (
                <Text style={styles.submitButtonText}>
                  ⚔  {activeTab === 'login' ? title : 'TẠO TÀI KHOẢN'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>◆  HOẶC TIẾP TỤC VỚI  ◆</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.providerRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={styles.providerTile}><Text style={styles.googleIcon}>G</Text></View>
            <View style={styles.providerTile}><Text style={styles.appleIcon}>●</Text></View>
            <View style={styles.providerTile}><Text style={styles.facebookIcon}>f</Text></View>
            <View style={styles.providerTile}><Text style={styles.chessIcon}>♜</Text></View>
          </View>
          <Text style={styles.providerNote}>Đăng nhập bên thứ ba sẽ sớm ra mắt</Text>

          <TouchableOpacity style={styles.guestButton} onPress={enterGuestMode}>
            <Text style={styles.guestText}>Chơi ngay không cần tài khoản (Khách)  →</Text>
          </TouchableOpacity>
          <Text style={styles.guestNote}>
            Tiến trình chơi khách được lưu tạm thời trên thiết bị này.
          </Text>

          <View style={styles.footer}>
            <Text style={styles.securityText}>◇  KẾT NỐI ĐƯỢC BẢO VỆ BỞI ARCANE</Text>
            <Text style={styles.versionText}>Arcane Chess  •  Grandmaster Network</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    minHeight: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cyan,
  },
  serverName: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  serverLabel: {
    color: COLORS.cream,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  branding: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 22,
  },
  logoFrame: {
    width: 126,
    height: 126,
    borderRadius: 24,
    padding: 6,
    backgroundColor: '#222832',
    marginBottom: 14,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  brandTitle: {
    color: '#FFC477',
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 1.7,
    textShadowColor: 'rgba(246, 161, 10, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  tagline: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 5,
  },
  tabs: {
    width: '100%',
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#080C11',
    marginBottom: 16,
  },
  tab: {
    minHeight: 48,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: COLORS.gold,
  },
  tabText: {
    color: COLORS.cream,
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.goldDark,
  },
  formCard: {
    width: '100%',
    borderRadius: 20,
    padding: 18,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: '#20262D',
  },
  inputGroup: {
    marginBottom: 15,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  fieldLabel: {
    color: COLORS.cream,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.45,
  },
  hint: {
    color: COLORS.cyan,
    fontSize: 10,
  },
  inputBox: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.input,
  },
  inputIcon: {
    width: 24,
    color: '#FFC477',
    fontSize: 19,
    fontWeight: '700',
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: COLORS.white,
    fontSize: 14,
    paddingVertical: 0,
  },
  visibilityIcon: {
    color: COLORS.cream,
    fontSize: 21,
    paddingHorizontal: 4,
  },
  actionRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -1,
    marginBottom: 15,
  },
  rememberButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  checkedBox: {
    backgroundColor: COLORS.gold,
  },
  checkmark: {
    color: COLORS.goldDark,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  rememberText: {
    color: COLORS.cream,
    fontSize: 12,
  },
  forgotText: {
    color: '#FFC477',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gold,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: COLORS.goldDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 18,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: '#38414A',
  },
  dividerText: {
    color: COLORS.cream,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  providerRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  providerTile: {
    height: 52,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#1C2229',
  },
  googleIcon: {
    color: '#E8EAED',
    fontSize: 27,
    fontWeight: '700',
  },
  appleIcon: {
    color: '#E8EAED',
    fontSize: 22,
  },
  facebookIcon: {
    color: '#E8EAED',
    fontSize: 30,
    fontWeight: '900',
  },
  chessIcon: {
    color: COLORS.cyan,
    fontSize: 28,
  },
  providerNote: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
  },
  guestButton: {
    marginTop: 21,
    paddingVertical: 4,
  },
  guestText: {
    color: COLORS.cream,
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    textDecorationColor: '#285767',
  },
  guestNote: {
    maxWidth: 340,
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  securityText: {
    color: COLORS.cream,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  versionText: {
    color: '#706B68',
    fontSize: 11,
    fontWeight: '700',
  },
});
