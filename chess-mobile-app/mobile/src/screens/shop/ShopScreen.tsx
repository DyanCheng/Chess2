// ============================================================
// ShopScreen - Store for skins, cards, and currency
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { useShopStore } from '../../store/shopStore';
import { usePlayerStore } from '../../store/playerStore';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { ShopItemCard } from '../../components/shop/ShopItemCard';
import { GradientButton } from '../../components/common/GradientButton';

export const ShopScreen: React.FC = () => {
  const { items, featuredItems, selectedCategory, setCategory, purchaseItem } = useShopStore();
  const { profile, spendGold, spendGems } = usePlayerStore();

  if (!profile) return null;

  const categories = [
    { id: 'all', name: 'Tất Cả' },
    { id: 'skin', name: 'Trang Phục' },
    { id: 'card', name: 'Thẻ Bài' },
    { id: 'bundle', name: 'Gói Ưu Đãi' },
    { id: 'currency', name: 'Tiền Tệ' },
  ];

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  const handleBuy = (item: any) => {
    if (item.isOwned) return;
    
    let success = false;
    if (item.currencyType === 'gold') {
      success = spendGold(item.price);
    } else if (item.currencyType === 'gems') {
      success = spendGems(item.price);
    } else {
      // Real money purchase flow
      success = true;
    }

    if (success) {
      purchaseItem(item.id);
    } else {
      // Show not enough currency error
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cửa Hàng</Text>
        <CurrencyDisplay gold={profile.gold} gems={profile.gems} compact />
      </View>

      <View style={styles.categoryScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
          {categories.map(cat => (
            <GradientButton
              key={cat.id}
              title={cat.name}
              onPress={() => setCategory(cat.id)}
              variant={selectedCategory === cat.id ? 'primary' : 'outline'}
              size="small"
              style={styles.categoryButton}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {selectedCategory === 'all' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nổi Bật</Text>
            <View style={styles.grid}>
              {featuredItems.map(item => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  onPress={() => {}}
                  onBuy={() => handleBuy(item)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tất Cả Vật Phẩm</Text>
          <View style={styles.grid}>
            {filteredItems.map(item => (
              <ShopItemCard
                key={item.id}
                item={item}
                onPress={() => {}}
                onBuy={() => handleBuy(item)}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.bgCard,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extrabold,
  },
  categoryScroll: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  categoryContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  categoryButton: {
    minWidth: 90,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
