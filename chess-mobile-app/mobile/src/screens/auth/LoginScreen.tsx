import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export const LoginScreen: React.FC = () => {
  // Trạng thái theme: false = Dark Theme, true = Light Theme
  const [isLight, setIsLight] = useState<boolean>(false);

  // Tab Đăng nhập / Đăng ký
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states
  const [email, setEmail] = useState<string>('arcane_grandmaster@chess.gg');
  const [password, setPassword] = useState<string>('12345678');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Hệ thống màu sắc Dark & Light theo đúng thiết kế
  const theme = isLight
    ? {
        bg: '#F4F6FB',
        serverBarText: '#2563EB',
        pingText: '#2563EB',
        logoText: '#C25E00',
        subTagText: '#2563EB',
        tabContainerBg: '#FFFFFF',
        tabActiveBg: '#EA580C',
        tabActiveText: '#FFFFFF',
        tabInactiveText: '#475569',
        cardBg: '#FFFFFF',
        cardBorder: '#E2E8F0',
        labelPrimary: '#1E293B',
        labelSub: '#3B82F6',
        inputBg: '#F8FAFC',
        inputText: '#0F172A',
        placeholder: '#94A3B8',
        iconColor: '#64748B',
        checkboxActive: '#EA580C',
        checkboxInactive: '#CBD5E1',
        textMuted: '#64748B',
        linkText: '#1E293B',
        ctaBg: '#EA580C',
        ctaText: '#FFFFFF',
        dividerText: '#64748B',
        socialBtnBg: '#FFFFFF',
        socialBtnBorder: '#E2E8F0',
        guestLink: '#2563EB',
        footerBadgeBg: '#EEF2FF',
        footerBadgeText: '#3730A3',
        footerSubText: '#94A3B8',
        shadowColor: '#000000',
      }
    : {
        bg: '#0B0F17',
        serverBarText: '#38BDF8',
        pingText: '#38BDF8',
        logoText: '#F59E0B',
        subTagText: '#38BDF8',
        tabContainerBg: '#131B28',
        tabActiveBg: '#F59E0B',
        tabActiveText: '#0B0F17',
        tabInactiveText: '#94A3B8',
        cardBg: '#111723',
        cardBorder: '#1E293B',
        labelPrimary: '#94A3B8',
        labelSub: '#38BDF8',
        inputBg: '#090D14',
        inputText: '#F8FAFC',
        placeholder: '#475569',
        iconColor: '#F59E0B',
        checkboxActive: '#F59E0B',
        checkboxInactive: '#334155',
        textMuted: '#94A3B8',
        linkText: '#CBD5E1',
        ctaBg: '#F59E0B',
        ctaText: '#0B0F17',
        dividerText: '#64748B',
        socialBtnBg: '#161F30',
        socialBtnBorder: '#1E293B',
        guestLink: '#F8FAFC',
        footerBadgeBg: '#162235',
        footerBadgeText: '#38BDF8',
        footerSubText: '#64748B',
        shadowColor: '#F59E0B',
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={theme.bg}
      />

      {/* TOP BAR: SERVER STATUS & THEME TOGGLE */}
      <View style={styles.topBar}>
        <View style={styles.serverInfo}>
          <View style={[styles.statusDot, { backgroundColor: theme.serverBarText }]} />
          <Text style={[styles.serverText, { color: theme.serverBarText }]}>ARCANE-US-EAST</Text>
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: isLight ? '#E2E8F0' : '#1E293B' }]}
            onPress={() => setIsLight(!isLight)}
          >
            <Text style={{ fontSize: 11, color: theme.serverBarText, fontWeight: '700' }}>
              {isLight ? '☀️ LIGHT' : '🌙 DARK'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.pingText, { color: theme.pingText }]}>28ms 📶</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO & TITLE */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoFrame}>
              <View style={[styles.logoPlaceholder, { borderColor: theme.logoText }]}>
                <Text style={{ fontSize: 32 }}>⚔️</Text>
                <Text style={[styles.logoMiniText, { color: theme.logoText }]}>CHESS</Text>
              </View>
              {isLight && (
                <View style={styles.ivoryTag}>
                  <Text style={styles.ivoryTagText}>IVORY ARCANE</Text>
                </View>
              )}
            </View>

            <Text style={[styles.mainTitle, { color: theme.logoText }]}>ARCANE CHESS</Text>
            <Text style={[styles.subTitle, { color: theme.subTagText }]}>
              ✦ TACTICAL RPG & STRATEGY ✦
            </Text>
          </View>

          {/* TAB ĐĂNG NHẬP / ĐĂNG KÝ */}
          <View style={[styles.tabContainer, { backgroundColor: theme.tabContainerBg }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'login' && { backgroundColor: theme.tabActiveBg },
              ]}
              onPress={() => setActiveTab('login')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'login' ? theme.tabActiveText : theme.tabInactiveText,
                  },
                ]}
              >
                ⚔️ Đăng Nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'register' && { backgroundColor: theme.tabActiveBg },
              ]}
              onPress={() => setActiveTab('register')}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'register' ? theme.tabActiveText : theme.tabInactiveText,
                  },
                ]}
              >
                🛡️ Đăng Ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORM CARD */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
                shadowColor: theme.shadowColor,
              },
            ]}
          >
            {/* INPUT EMAIL */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.labelPrimary }]}>
                  TÊN ĐĂNG NHẬP / EMAIL
                </Text>
                <Text style={[styles.subLabel, { color: theme.labelSub }]}>
                  Cấp độ Hiệp Sĩ
                </Text>
              </View>
              <View style={[styles.inputBox, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.inputIcon, { color: theme.iconColor }]}>🛡️</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Nhập tên đăng nhập hoặc email..."
                  placeholderTextColor={theme.placeholder}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* INPUT PASSWORD */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.fieldLabel, { color: theme.labelPrimary }]}>
                  MẬT KHẨU
                </Text>
                <Text style={[styles.subLabel, { color: theme.textMuted }]}>
                  Tối thiểu 8 ký tự
                </Text>
              </View>
              <View style={[styles.inputBox, { backgroundColor: theme.inputBg }]}>
                <Text style={[styles.inputIcon, { color: theme.iconColor }]}>🔒</Text>
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nhập mật khẩu..."
                  placeholderTextColor={theme.placeholder}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={[styles.inputIconRight, { color: theme.iconColor }]}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* REMEMBER & FORGOT PASSWORD */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: rememberMe ? theme.checkboxActive : 'transparent',
                      borderColor: theme.checkboxActive,
                    },
                  ]}
                >
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.rememberText, { color: theme.linkText }]}>
                  Ghi nhớ đăng nhập
                </Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={[styles.forgotPasswordText, { color: theme.linkText }]}>
                  Quên mật khẩu?
                </Text>
              </TouchableOpacity>
            </View>

            {/* CTA BUTTON */}
            <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.ctaBg }]}>
              <Text style={[styles.ctaButtonText, { color: theme.ctaText }]}>
                ⚔️ VÀO BÀN CỜ ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* SOCIAL LOGIN DIVIDER */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={[styles.dividerLabel, { color: theme.dividerText }]}>
              ✦ HOẶC TIẾP TỤC VỚI ✦
            </Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SOCIAL ICONS (4 Nút) */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[
                styles.socialBtn,
                { backgroundColor: theme.socialBtnBg, borderColor: theme.socialBtnBorder },
              ]}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EA4335' }}>G</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialBtn,
                { backgroundColor: theme.socialBtnBg, borderColor: theme.socialBtnBorder },
              ]}
            >
              <Text style={{ fontSize: 18, color: theme.inputText }}></Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialBtn,
                { backgroundColor: theme.socialBtnBg, borderColor: theme.socialBtnBorder },
              ]}
            >
              <Text style={{ fontSize: 18, color: '#1877F2' }}>f</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.socialBtn,
                { backgroundColor: theme.socialBtnBg, borderColor: theme.socialBtnBorder },
              ]}
            >
              <Text style={{ fontSize: 18, color: '#06B6D4' }}>♟️</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* GUEST ACCESS */}
          <View style={styles.guestSection}>
            <TouchableOpacity>
              <Text style={[styles.guestLinkText, { color: theme.guestLink }]}>
                Chơi Ngay Không Cần Tài Khoản (Khách) →
              </Text>
            </TouchableOpacity>
            <Text style={[styles.guestNotice, { color: theme.textMuted }]}>
              Tiến trình xếp hạng và trang phục thần thoại sẽ được lưu tạm thời trên thiết bị này.
            </Text>
          </View>

          {/* SECURITY FOOTER */}
          <View style={[styles.securityBadge, { backgroundColor: theme.footerBadgeBg }]}>
            <Text style={[styles.securityBadgeText, { color: theme.footerBadgeText }]}>
              🛡️ MÃ HOÁ KẾT NỐI ARCANE SSL 256-BIT
            </Text>
          </View>
          <Text style={[styles.engineText, { color: theme.footerSubText }]}>
            v1.4.2 Arcane Engine • Grandmaster Network
          </Text>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  serverText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  themeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  logoFrame: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoPlaceholder: {
    width: 86,
    height: 86,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMiniText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  ivoryTag: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#C25E00',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ivoryTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 10,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  inputIconRight: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  checkmark: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 12,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  ctaButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#33415530',
  },
  dividerLabel: {
    marginHorizontal: 10,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#06B6D4',
  },
  guestSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  guestLinkText: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  guestNotice: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  securityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 6,
  },
  securityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  engineText: {
    fontSize: 9,
    fontWeight: '600',
  },
});