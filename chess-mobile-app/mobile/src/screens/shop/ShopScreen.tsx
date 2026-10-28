// ============================================================
// ShopScreen - Store for skins, cards, and currency
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { useShopStore } from '../../store/shopStore';
import { usePlayerStore } from '../../store/playerStore';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { ShopItemCard } from '../../components/shop/ShopItemCard';
import { GradientButton } from '../../components/common/GradientButton';
import { useAuthStore } from '../../store/authStore';
import { apiService } from '../../services/api/apiService';
import {
  getIapStoreProducts,
  isPurchaseCancelled,
  purchaseIapProduct,
} from '../../services/iap/revenueCat';

export const ShopScreen: React.FC = () => {
  const {
    items, featuredItems, selectedCategory, isLoading,
    setCategory, purchaseItem, setStorePrices, setLoading,
  } = useShopStore();
  const { profile, spendGold, spendGems, setCurrency } = usePlayerStore();
  const { isAuthenticated, userId } = useAuthStore();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [iapMessage, setIapMessage] = useState('');

  const refreshStore = useCallback(async (showAlert = false) => {
    if (!isAuthenticated || !userId) {
      setIapMessage('Đăng nhập để tải giá Google Play và thực hiện giao dịch.');
      return;
    }

    setLoading(true);
    const errors: string[] = [];
    try {
      const wallet = await apiService.getWallet();
      if (wallet.data) setCurrency(wallet.data.gold, wallet.data.gems);
      else if (wallet.error) errors.push(wallet.error);

      const catalog = await apiService.getIapProducts();
      if (catalog.data) {
        try {
          const products = await getIapStoreProducts(
            userId,
            catalog.data.products.map(product => product.productId),
          );
          setStorePrices(Object.fromEntries(
            products.map(product => [product.identifier, product.priceString]),
          ));
        } catch (reason) {
          errors.push(reason instanceof Error ? reason.message : 'Không tải được giá Google Play');
        }
      } else if (catalog.error) {
        errors.push(catalog.error);
      }
    } finally {
      setLoading(false);
    }

    setIapMessage(errors[0] || 'Đã kết nối cửa hàng và đồng bộ số dư.');
    if (showAlert) {
      Alert.alert(errors.length ? 'Chưa đồng bộ hoàn toàn' : 'Đồng bộ thành công', errors[0] || 'Số dư đã được cập nhật.');
    }
  }, [isAuthenticated, setCurrency, setLoading, setStorePrices, userId]);

  useEffect(() => {
    void refreshStore(false);
  }, [refreshStore]);

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

  const handleBuy = async (item: any) => {
    if (item.isOwned) return;

    if (item.currencyType === 'real') {
      if (!isAuthenticated || !userId) {
        Alert.alert('Cần đăng nhập', 'Hãy đăng nhập trước khi mua hàng để giao dịch gắn đúng tài khoản.');
        return;
      }
      if (!item.storeProductId || purchasingId) return;

      setPurchasingId(item.id);
      try {
        await purchaseIapProduct(userId, item.storeProductId);
        const sync = await apiService.syncIapPurchases();
        if (!sync.data) {
          Alert.alert(
            'Giao dịch đang chờ đồng bộ',
            `Google Play đã xử lý giao dịch nhưng backend chưa cộng vật phẩm: ${sync.error || 'lỗi không xác định'}. Hãy bấm Đồng bộ giao dịch sau.`,
          );
          return;
        }
        setCurrency(sync.data.wallet.gold, sync.data.wallet.gems);
        Alert.alert('Mua thành công', `${item.name} đã được cộng vào tài khoản.`);
      } catch (reason) {
        if (!isPurchaseCancelled(reason)) {
          Alert.alert('Không thể mua', reason instanceof Error ? reason.message : 'Giao dịch thất bại');
        }
      } finally {
        setPurchasingId(null);
      }
      return;
    }
    
    let success = false;
    if (item.currencyType === 'gold') {
      success = spendGold(item.price);
    } else if (item.currencyType === 'gems') {
      success = spendGems(item.price);
    }

    if (success) {
      purchaseItem(item.id);
    } else {
      Alert.alert('Không đủ tiền', 'Hãy chơi thêm ván với bot để nhận vàng.');
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
        <View style={styles.iapPanel}>
          <View style={styles.iapTextContainer}>
            <Text style={styles.iapTitle}>Google Play Billing</Text>
            <Text style={styles.iapMessage}>{iapMessage}</Text>
          </View>
          {isLoading || purchasingId ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : (
            <GradientButton
              title="Đồng bộ giao dịch"
              onPress={() => void apiService.syncIapPurchases().then(result => {
                if (result.data) {
                  setCurrency(result.data.wallet.gold, result.data.wallet.gems);
                  Alert.alert('Đồng bộ thành công', `Đã ghi nhận ${result.data.creditedPurchases} giao dịch mới.`);
                } else {
                  Alert.alert('Không thể đồng bộ', result.error || 'Lỗi không xác định');
                }
              })}
              variant="outline"
              size="small"
              disabled={!isAuthenticated}
            />
          )}
        </View>

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
  iapPanel: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  iapTextContainer: {
    gap: SPACING.xs,
  },
  iapTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  iapMessage: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
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
