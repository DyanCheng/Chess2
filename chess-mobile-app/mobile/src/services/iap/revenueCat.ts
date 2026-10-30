import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PurchasesError,
  PurchasesStoreProduct,
} from 'react-native-purchases';

let activeUserId: string | null = null;

function androidApiKey() {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
  if (!key) {
    throw new Error('Chưa cấu hình EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY');
  }
  return key;
}

async function configure(userId: string) {
  if (Platform.OS !== 'android') {
    throw new Error('Bản hiện tại mới cấu hình In-App Purchase cho Android');
  }

  const configured = await Purchases.isConfigured();
  if (!configured) {
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey: androidApiKey(), appUserID: userId });
    activeUserId = userId;
    return;
  }

  const currentUserId = activeUserId || await Purchases.getAppUserID();
  if (currentUserId !== userId) {
    await Purchases.logIn(userId);
  }
  activeUserId = userId;
}

export async function getIapStoreProducts(userId: string, productIds: string[]) {
  await configure(userId);
  const products = await Purchases.getProducts(
    productIds,
    Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
  );
  return products;
}

export async function purchaseIapProduct(
  userId: string,
  productId: string,
): Promise<PurchasesStoreProduct> {
  const products = await getIapStoreProducts(userId, [productId]);
  const product = products.find(candidate => candidate.identifier === productId);
  if (!product) {
    throw new Error(`Google Play chưa trả về sản phẩm ${productId}`);
  }
  await Purchases.purchaseStoreProduct(product);
  return product;
}

export async function resetIapUser() {
  try {
    if (await Purchases.isConfigured()) await Purchases.logOut();
  } finally {
    activeUserId = null;
  }
}

export function isPurchaseCancelled(reason: unknown) {
  return (reason as Partial<PurchasesError>)?.code
    === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

