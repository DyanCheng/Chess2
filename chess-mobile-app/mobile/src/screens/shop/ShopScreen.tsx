import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, StatusBar, Dimensions,
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
// DATA
// ============================================================
const TABS_SHOP = [
  { id: 'featured', label: '⭐ Đề Xuất' },
  { id: 'pieces', label: '♟ Bán Cờ' },
  { id: 'sets', label: '♜ Bộ Quân Cờ' },
  { id: 'effects', label: '✨ Hiệu Ứng' },
];

const NAV_TABS = [
  { id: 'home', label: 'Trang chủ', icon: '🛡️' },
  { id: 'modes', label: 'Chế độ', icon: '⚔️' },
  { id: 'puzzle', label: 'Giải đố', icon: '🧩' },
  { id: 'ranking', label: 'Xếp hạng', icon: '🏅' },
  { id: 'shop', label: 'Cửa hàng', icon: '🛒' },
];

const FEATURED_ITEMS = [
  {
    id: 'shadow_crown',
    name: 'BỘ VŨ KHÍ SHADOW CROWN',
    tier: 'THẦN THOẠI',
    badge: '-35%',
    oldPrice: 3580,
    price: 2275,
    currency: '💎 KIM CƯƠNG',
    tags: ['Bán cờ Không', 'Quân Hắc Long', 'FX Phượng Hoàng'],
    isBig: true,
  },
];

const SHOP_ITEMS = [
  {
    id: 'obsidian',
    name: 'Obsidian Hư Không',
    type: 'Bán cờ chiến lựu',
    tier: '⭐ THẦN THOẠI',
    oldPrice: 1600,
    price: 1200,
    currency: '💎',
    badge: '-25%',
    hot: false,
  },
  {
    id: 'dragon_rook',
    name: 'Quân Rồng Lửa Neon',
    type: 'Bộ quân tinh anh',
    tier: '🔵 SỬU THI',
    price: 850,
    currency: '💎',
    badge: null,
    hot: false,
    new_: true,
  },
  {
    id: 'arcane_theme',
    name: 'Arcane Chess Theme',
    type: 'Hiệu ứng bàn cờ',
    tier: null,
    price: 25000,
    currency: '🪙 VÀNG',
    badge: null,
    hot: true,
    exclusive: true,
  },
  {
    id: 'dragon_crown',
    name: 'Vương Miện Hắc Ám',
    type: 'Khung hồ sơ độc quyền',
    tier: '🔵 SỬU THI',
    price: 600,
    currency: '💎',
    badge: '-21%',
    hot: false,
    new_: true,
  },
];

const BATTLE_PASS = {
  name: 'MÙA 4: CHIẾN THẦN',
  level: 24,
  maxLevel: 50,
  price: 999,
  perks: [
    { icon: '🎁', text: 'Đạt nhận 12/50 phần thưởng (Vàng, Xương cờ, EXP 6 tháng kỳ 1,000 ◈)' },
    { icon: '📅', text: 'Mở 6 tự động' },
  ],
  bonus: [
    { icon: '🔥', label: 'THƯỞNG HẠNG', desc: 'Skin Vua Hắc Long x2 EXP 6,5/đạt lên là 1,000 ◈' },
    { icon: '⭐', label: 'HOT', desc: 'Đi 1,000 Kim Cương' },
  ],
};

// ============================================================
// HEADER
// ============================================================
const Header = () => {
  const { styles, isDark, toggle, colors } = useTheme();
  return (
    <View style={styles.header}>
      {/* Left: Logo */}
      <View style={styles.row}>
        <View style={styles.logoBox}><Text style={styles.logoIcon}>♚</Text></View>
        <View>
          <Text style={styles.logoText}>ARCANE CHESS</Text>
          <Text style={styles.logoSub}>CỬA HÀNG</Text>
        </View>
      </View>
      {/* Right: stats + toggle */}
      <View style={styles.row}>
        <View style={styles.currencyPill}>
          <Text style={styles.currencyVal}>12,450</Text>
          <Text style={styles.currencyIcon}>🪙</Text>
        </View>
        <View style={[styles.currencyPill, { marginLeft: SPACING.xs }]}>
          <Text style={styles.currencyValDiamond}>1,850</Text>
          <Text style={styles.currencyIcon}>💎</Text>
        </View>
        <TouchableOpacity style={styles.topupBtn}>
          <Text style={styles.topupText}>+ NẠP</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={toggle}>
          <Text>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// FEATURED BANNER (Shadow Crown)
// ============================================================
const FeaturedBanner = () => {
  const { styles, colors } = useTheme();
  const item = FEATURED_ITEMS[0];
  return (
    <View style={styles.banner}>
      {/* Banner image placeholder */}
      <View style={styles.bannerImg}>
        <Image source={AVATAR_IMG} style={styles.bannerAvatar} />
        <View style={styles.bannerGlow} />
        {/* Badge */}
        <View style={styles.bannerBadge}><Text style={styles.bannerBadgeText}>{item.badge} ĐỦ BÁN KHỦNG</Text></View>
        <View style={styles.bannerTier}><Text style={styles.bannerTierText}>PHẨM CẤP: {item.tier}</Text></View>
        {/* Timer */}
        <View style={styles.bannerTimer}>
          <Text style={styles.bannerTimerIcon}>🕒</Text>
          <Text style={styles.bannerTimerText}>2 ngày 14 giờ</Text>
        </View>
        <View style={styles.bannerSeason}><Text style={styles.bannerSeasonText}>HÀNG</Text></View>
      </View>
      {/* Info below */}
      <View style={styles.bannerInfo}>
        <Text style={styles.bannerName}>{item.name}</Text>
        <Text style={styles.bannerDesc} numberOfLines={2}>
          Bao gồm: Bán cờ Hư Không, Bộ Quân Cờ Hắc Long, Hiệu ứng Chiếu: Lửt Phượng Hoàng Hắc Ám & Khung Tím Ám Độc.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: SPACING.sm }}>
          <View style={styles.row}>
            {item.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>✦ {tag}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.row}>
          <View style={styles.priceOldWrap}>
            <Text style={styles.priceOld}>{item.oldPrice.toLocaleString('en-US')}</Text>
          </View>
          <Text style={styles.priceCurrent}>  {item.currency}  {item.price.toLocaleString('en-US')} KIM CƯƠNG</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>👁 XEM VÀ SỞ HỮU</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// SHOP TABS
// ============================================================
const ShopTabs = ({ active, setActive }: { active: string; setActive: (s: string) => void }) => {
  const { styles, colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsWrap} contentContainerStyle={styles.tabsContent}>
      {TABS_SHOP.map(t => {
        const isActive = t.id === active;
        return (
          <TouchableOpacity key={t.id} style={[styles.shopTab, isActive && styles.shopTabActive]} onPress={() => setActive(t.id)}>
            <Text style={[styles.shopTabText, isActive && styles.shopTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ============================================================
// ITEM CARD
// ============================================================
const ItemCard = ({ item }: { item: typeof SHOP_ITEMS[0] }) => {
  const { styles, colors } = useTheme();
  return (
    <View style={styles.card}>
      {/* Image area */}
      <View style={styles.cardImgWrap}>
        <Image source={AVATAR_IMG} style={styles.cardImg} resizeMode="cover" />
        {item.badge && <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{item.badge}</Text></View>}
        {item.hot && <View style={styles.cardHot}><Text style={styles.cardHotText}>🔥 NỔI BẬT</Text></View>}
        {(item as any).new_ && <View style={styles.cardNew}><Text style={styles.cardNewText}>MỚI</Text></View>}
        {(item as any).exclusive && <View style={styles.cardExcl}><Text style={styles.cardExclText}>ĐỘC QUYỀN</Text></View>}
      </View>
      {/* Info */}
      <View style={styles.cardBody}>
        {item.tier && <Text style={styles.cardTier}>{item.tier}</Text>}
        <Text style={styles.cardType} numberOfLines={1}>{item.type}</Text>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.row, { justifyContent: 'space-between', marginTop: SPACING.xs }]}>
          <View>
            {item.oldPrice != null && <Text style={styles.cardOldPrice}>{item.oldPrice}</Text>}
            <Text style={styles.cardPrice}>{item.currency} {item.price.toLocaleString('en-US')}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.buyBtn}>
          <Text style={styles.buyBtnText}>Xem Thử / Mua</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// FEATURED ITEMS GRID
// ============================================================
const FeaturedGrid = () => {
  const { styles } = useTheme();
  return (
    <View>
      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: SPACING.md }]}>
        <Text style={styles.sectionTitle}>⚔ Vật Phẩm Nổi Bật</Text>
        <TouchableOpacity><Text style={styles.seeAll}>XEM TẤT CẢ ›</Text></TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {SHOP_ITEMS.map(item => <ItemCard key={item.id} item={item} />)}
      </View>
    </View>
  );
};

// ============================================================
// BATTLE PASS SECTION
// ============================================================
const BattlePass = () => {
  const { styles, colors } = useTheme();
  const bp = BATTLE_PASS;
  const pct = Math.round((bp.level / bp.maxLevel) * 100);
  return (
    <View style={styles.bpWrap}>
      <View style={[styles.row, { marginBottom: SPACING.md }]}>
        <Text style={styles.bpTitle}>✦ BATTLE PASS THEO MÙA</Text>
        <View style={styles.bpLvBadge}><Text style={styles.bpLvText}>CẤP {bp.level} / {bp.maxLevel}</Text></View>
      </View>
      <Text style={styles.bpName}>{bp.name}</Text>
      {/* Progress */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>
      {/* Perks */}
      {bp.perks.map((p, i) => (
        <View key={i} style={[styles.row, { marginTop: SPACING.sm }]}>
          <Text style={styles.bpIcon}>{p.icon}</Text>
          <Text style={styles.bpPerk}>{p.text}</Text>
        </View>
      ))}
      {/* Bonus */}
      <View style={styles.bpBonusRow}>
        {bp.bonus.map((b, i) => (
          <View key={i} style={styles.bpBonusCard}>
            <View style={styles.row}>
              <Text style={styles.bpBonusIcon}>{b.icon}</Text>
              <Text style={styles.bpBonusLabel}>{b.label}</Text>
            </View>
            <Text style={styles.bpBonusDesc} numberOfLines={2}>{b.desc}</Text>
          </View>
        ))}
      </View>
      {/* CTA */}
      <TouchableOpacity style={styles.bpBtn}>
        <Text style={styles.bpBtnText}>♛ NÂNG CẤP PASS CHỈ {bp.price} 💎</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// TAB BAR
// ============================================================
const TabBar = () => {
  const { styles, colors, onNavigate } = useTheme();
  return (
    <View style={styles.tabBar}>
      {NAV_TABS.map(t => {
        const active = t.id === 'shop';
        return (
          <TouchableOpacity key={t.id} style={styles.tabItem} onPress={() => onNavigate?.(t.id)}>
            <Text style={[styles.tabIcon, { opacity: active ? 1 : 0.5 }]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, { color: active ? colors.tabBarActive : colors.tabBarInactive }]}>{t.label}</Text>
            {active && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============================================================
// SCREEN ROOT
// ============================================================
const ShopScreen = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');
  const colors: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(colors), [isDark]);
  const ctx = React.useMemo(
    () => ({ isDark, toggle: () => setIsDark(v => !v), colors, styles, onNavigate }),
    [isDark, styles, onNavigate],
  );

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundDark} />
        <Header />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          stickyHeaderIndices={[1]}
        >
          <FeaturedBanner />
          <ShopTabs active={activeTab} setActive={setActiveTab} />
          <FeaturedGrid />
          <BattlePass />
          <View style={{ height: 90 }} />
        </ScrollView>
        <TabBar />
      </View>
    </ThemeContext.Provider>
  );
};

// ============================================================
// STYLES
// ============================================================
const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.lg },
  row: { flexDirection: 'row', alignItems: 'center' },

  // header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, paddingTop: SPACING.xxl + 20,
    backgroundColor: COLORS.backgroundDark, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logoBox: {
    width: 32, height: 32, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.backgroundCard,
    borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm,
  },
  logoIcon: { fontSize: 16, color: COLORS.primary },
  logoText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, letterSpacing: 1.2 },
  logoSub: { fontSize: 8, color: COLORS.accent, letterSpacing: 2, fontWeight: FONT_WEIGHT.bold },
  currencyPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, marginRight: SPACING.xs,
  },
  currencyVal: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, marginRight: 3 },
  currencyValDiamond: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.accent, marginRight: 3 },
  currencyIcon: { fontSize: 12 },
  topupBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, marginRight: SPACING.xs,
  },
  topupText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center', alignItems: 'center',
  },

  // banner
  banner: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.lg, borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1.5, borderColor: COLORS.secondary + '88', overflow: 'hidden',
    backgroundColor: COLORS.backgroundCard,
  },
  bannerImg: {
    height: 180, backgroundColor: '#0A0520', justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  bannerAvatar: { width: '100%', height: '100%', position: 'absolute', opacity: 0.85 },
  bannerGlow: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.secondary + '30',
  },
  bannerBadge: {
    position: 'absolute', top: SPACING.sm, left: SPACING.sm, backgroundColor: COLORS.accentRed,
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  bannerBadgeText: { fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, color: '#FFF' },
  bannerTier: {
    position: 'absolute', top: SPACING.sm, right: SPACING.sm, backgroundColor: COLORS.secondary + 'CC',
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  bannerTierText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#FFF', letterSpacing: 0.5 },
  bannerTimer: {
    position: 'absolute', bottom: SPACING.sm, right: SPACING.sm,
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  bannerTimerIcon: { fontSize: 10, marginRight: 3 },
  bannerTimerText: { fontSize: 9, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  bannerSeason: {
    position: 'absolute', bottom: SPACING.sm, left: SPACING.sm, backgroundColor: COLORS.primary + 'CC',
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  bannerSeasonText: { fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  bannerInfo: { padding: SPACING.lg },
  bannerName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  bannerDesc: { fontSize: FONT_SIZE.xs + 1, color: COLORS.textSecondary, lineHeight: 17 },
  tag: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.borderLight, paddingHorizontal: SPACING.sm, paddingVertical: 3, marginRight: SPACING.xs,
  },
  tagText: { fontSize: 9, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
  priceOldWrap: { backgroundColor: COLORS.accentRed + '22', borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 4 },
  priceOld: { fontSize: FONT_SIZE.sm, color: COLORS.accentRed, textDecorationLine: 'line-through', fontWeight: FONT_WEIGHT.bold },
  priceCurrent: { fontSize: FONT_SIZE.sm + 1, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.bold },
  viewBtn: {
    marginTop: SPACING.md, backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md, alignItems: 'center', ...SHADOW.purple,
  },
  viewBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: '#FFFFFF', letterSpacing: 0.5 },

  // shop tabs
  tabsWrap: { backgroundColor: COLORS.backgroundDark, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabsContent: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, gap: SPACING.sm },
  shopTab: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border,
  },
  shopTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  shopTabText: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },
  shopTabTextActive: { color: '#1A1205' },

  // section
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary },
  seeAll: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  // grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },

  // card
  card: {
    width: '47.5%', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOW.sm,
  },
  cardImgWrap: { height: 110, backgroundColor: COLORS.surface, position: 'relative', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%', opacity: 0.9 },
  cardBadge: {
    position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.accentRed,
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 5, paddingVertical: 2,
  },
  cardBadgeText: { fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, color: '#FFF' },
  cardHot: {
    position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.primary + 'EE',
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 5, paddingVertical: 2,
  },
  cardHotText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  cardNew: {
    position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.accentGreen,
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 5, paddingVertical: 2,
  },
  cardNewText: { fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, color: '#FFF' },
  cardExcl: {
    position: 'absolute', bottom: 6, left: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 5, paddingVertical: 2, alignItems: 'center',
  },
  cardExclText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, letterSpacing: 0.5 },
  cardBody: { padding: SPACING.sm },
  cardTier: { fontSize: 8, color: COLORS.secondary, fontWeight: FONT_WEIGHT.bold, marginBottom: 2 },
  cardType: { fontSize: 8, color: COLORS.textMuted, marginBottom: 2 },
  cardName: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary },
  cardOldPrice: { fontSize: 9, color: COLORS.textMuted, textDecorationLine: 'line-through' },
  cardPrice: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary },
  buyBtn: {
    marginTop: SPACING.sm, backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.primary + '66',
    paddingVertical: SPACING.sm, alignItems: 'center',
  },
  buyBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },

  // battle pass
  bpWrap: {
    marginHorizontal: SPACING.lg, marginTop: SPACING.xl, backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5, borderColor: COLORS.primary + '55',
    padding: SPACING.lg, ...SHADOW.gold,
  },
  bpTitle: { flex: 1, fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, letterSpacing: 0.8 },
  bpLvBadge: {
    backgroundColor: COLORS.primary + '22', borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.primary + '55', paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  bpLvText: { fontSize: 9, color: COLORS.primary, fontWeight: FONT_WEIGHT.extrabold },
  bpName: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  progressBg: { height: 7, borderRadius: 4, backgroundColor: COLORS.surface, overflow: 'hidden', marginBottom: SPACING.sm },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  bpIcon: { fontSize: 14, marginRight: SPACING.sm },
  bpPerk: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, lineHeight: 16 },
  bpBonusRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  bpBonusCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm,
  },
  bpBonusIcon: { fontSize: 14, marginRight: SPACING.xs },
  bpBonusLabel: { fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary },
  bpBonusDesc: { fontSize: 9, color: COLORS.textSecondary, marginTop: SPACING.xs, lineHeight: 13 },
  bpBtn: {
    marginTop: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md + 2, alignItems: 'center', ...SHADOW.gold,
  },
  bpBtnText: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 0.5 },

  // tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.tabBarBg, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: SPACING.lg, paddingTop: SPACING.sm, paddingHorizontal: SPACING.sm,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xs },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 9, fontWeight: FONT_WEIGHT.medium },
  tabIndicator: { position: 'absolute', top: -SPACING.sm - 1, width: 24, height: 3, backgroundColor: COLORS.primary, borderRadius: 1.5 },
});

export default ShopScreen;
