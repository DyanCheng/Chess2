type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');
type Interstitial = ReturnType<GoogleMobileAdsModule['InterstitialAd']['createForAdRequest']>;

let adsModule: GoogleMobileAdsModule | null | undefined;

function getAdsModule(): GoogleMobileAdsModule | null {
  if (adsModule !== undefined) return adsModule;
  try {
    adsModule = require('react-native-google-mobile-ads') as GoogleMobileAdsModule;
  } catch {
    adsModule = null;
  }
  return adsModule;
}

export class AdMobService {
  private initPromise: Promise<void> | null = null;
  private interstitial: Interstitial | null = null;
  private loaded = false;
  private loading = false;
  private lastHandledMatchId: string | null = null;
  private unsubscribe: Array<() => void> = [];

  initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initializeSdk();
    return this.initPromise;
  }

  private async initializeSdk(): Promise<void> {
    const ads = getAdsModule();
    if (!ads) return;
    try {
      await ads.default().initialize();
      this.preload();
    } catch {
      // Expo Go does not include this native module. Ads remain disabled without blocking the app.
    }
  }

  private clearInterstitial(): void {
    this.unsubscribe.forEach(unsubscribe => unsubscribe());
    this.unsubscribe = [];
    this.interstitial = null;
    this.loaded = false;
    this.loading = false;
  }

  private preload(): void {
    const ads = getAdsModule();
    if (!ads || this.loaded || this.loading) return;

    const unitId = __DEV__
      ? ads.TestIds.INTERSTITIAL
      : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || ads.TestIds.INTERSTITIAL;

    this.loading = true;
    const interstitial = ads.InterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    this.interstitial = interstitial;
    this.unsubscribe = [
      interstitial.addAdEventListener(ads.AdEventType.LOADED, () => {
        this.loaded = true;
        this.loading = false;
      }),
      interstitial.addAdEventListener(ads.AdEventType.CLOSED, () => {
        this.clearInterstitial();
        this.preload();
      }),
      interstitial.addAdEventListener(ads.AdEventType.ERROR, () => {
        this.clearInterstitial();
      }),
    ];
    interstitial.load();
  }

  async showAfterMatch(matchId: string): Promise<boolean> {
    if (!matchId || this.lastHandledMatchId === matchId) return false;
    this.lastHandledMatchId = matchId;
    await this.initialize();

    if (!this.loaded || !this.interstitial) {
      this.preload();
      return false;
    }

    try {
      await this.interstitial.show();
      return true;
    } catch {
      this.clearInterstitial();
      this.preload();
      return false;
    }
  }
}

export const admobService = new AdMobService();
