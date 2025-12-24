import {NavigationContainerRef} from '@react-navigation/native';

export interface DeepLinkData {
  url?: string;
  path?: string | null;
  smartLinkId?: string | null;
  clickId?: string | null;
  parameters: Record<string, any>;
}

class DeepLinkRouter {
  private static instance: DeepLinkRouter;
  private navigationRef: NavigationContainerRef<any> | null = null;
  private currentDeepLinkData: DeepLinkData | null = null;

  // Deduplication tracking
  private lastProcessedUrl: string | null = null;
  private lastNavigationTime: Date | null = null;

  private constructor() {}

  static getInstance(): DeepLinkRouter {
    if (!DeepLinkRouter.instance) {
      DeepLinkRouter.instance = new DeepLinkRouter();
    }
    return DeepLinkRouter.instance;
  }

  setNavigationRef(ref: NavigationContainerRef<any> | null) {
    this.navigationRef = ref;
  }

  handleDeepLink(deepLinkData: DeepLinkData): void {
    console.log('🔗 [DeepLinkRouter] handleDeepLink called');
    console.log('   Path:', deepLinkData.path);
    console.log('   URL:', deepLinkData.url);
    console.log('   Parameters:', deepLinkData.parameters);

    // Deduplicate based on URL within 2 seconds
    if (
      this.lastProcessedUrl &&
      this.lastNavigationTime &&
      this.lastProcessedUrl === deepLinkData.url &&
      new Date().getTime() - this.lastNavigationTime.getTime() < 2000
    ) {
      console.log('   ⚠️ Duplicate navigation detected within 2s, updating attribution only');
      this.currentDeepLinkData = deepLinkData; // Update with enriched data
      return;
    }

    // Store for deduplication
    this.lastProcessedUrl = deepLinkData.url || null;
    this.lastNavigationTime = new Date();

    this.currentDeepLinkData = deepLinkData;

    if (!this.navigationRef) {
      console.log('   ⚠️ Navigation ref not set, cannot navigate');
      return;
    }

    // Wait for navigation to be ready before navigating
    const navigate = () => {
      if (!this.navigationRef?.isReady()) {
        console.log('   ⏳ Navigation not ready, waiting...');
        setTimeout(navigate, 50);
        return;
      }

      // Check if path is "/products" or contains "products"
      if (deepLinkData.path?.includes('products')) {
        console.log('   ✅ Path contains "products"');
        // Extract product_id from parameters
        const productIdString = deepLinkData.parameters?.product_id;
        if (productIdString) {
          const productId = parseInt(productIdString, 10);
          console.log('   ✅ Product ID found:', productId);

          // Navigate to Products tab first, then to ProductDetail
          // This ensures ProductList is in the stack for the back button
          this.navigationRef.navigate('Products', {
            screen: 'ProductList',
          });

          // Small delay to ensure the tab navigation completes
          setTimeout(() => {
            if (this.navigationRef) {
              this.navigationRef.navigate('Products', {
                screen: 'ProductDetail',
                params: {productId},
              });
              console.log('   ✅ Navigating to product', productId);
            }
          }, 100);
        } else {
          console.log('   ⚠️ No product_id found, just switching tab');
          // No product_id, just switch to products tab
          this.navigationRef.navigate('Products');
        }
      }
      // Check if URL contains "products" (for custom URL schemes where path might be nil)
      else if (deepLinkData.url?.includes('products')) {
        console.log('   ✅ URL contains "products"');
        const productIdString = deepLinkData.parameters?.product_id;
        if (productIdString) {
          const productId = parseInt(productIdString, 10);
          console.log('   ✅ Product ID found:', productId);

          // Navigate to Products tab first
          this.navigationRef.navigate('Products', {
            screen: 'ProductList',
          });

          // Then navigate to ProductDetail
          setTimeout(() => {
            if (this.navigationRef) {
              this.navigationRef.navigate('Products', {
                screen: 'ProductDetail',
                params: {productId},
              });
              console.log('   ✅ Navigating to product', productId);
            }
          }, 100);
        } else {
          console.log('   ⚠️ No product_id found, just switching tab');
          this.navigationRef.navigate('Products');
        }
      }
      // Backward compatibility: fallback to checking product_id without path
      else if (deepLinkData.parameters?.product_id) {
        const productIdString = deepLinkData.parameters.product_id;
        const productId = parseInt(productIdString, 10);
        console.log('   ✅ Fallback: Product ID found:', productId);

        // Navigate to Products tab first
        this.navigationRef.navigate('Products', {
          screen: 'ProductList',
        });

        // Then navigate to ProductDetail
        setTimeout(() => {
          if (this.navigationRef) {
            this.navigationRef.navigate('Products', {
              screen: 'ProductDetail',
              params: {productId},
            });
            console.log('   ✅ Navigating to product', productId);
          }
        }, 100);
      } else {
        console.log('   ❌ No routing logic matched');
      }
    };

    navigate();
  }

  getCurrentDeepLinkData(): DeepLinkData | null {
    return this.currentDeepLinkData;
  }

  getAttributionParameters(): Record<string, any> {
    if (!this.currentDeepLinkData) {
      return {};
    }

    const params: Record<string, any> = {};
    const data = this.currentDeepLinkData;

    if (data.parameters?.utm_source) {
      params.utm_source = data.parameters.utm_source;
    }
    if (data.parameters?.utm_medium) {
      params.utm_medium = data.parameters.utm_medium;
    }
    if (data.parameters?.utm_campaign) {
      params.utm_campaign = data.parameters.utm_campaign;
    }
    if (data.clickId) {
      params.click_id = data.clickId;
    }
    if (data.smartLinkId) {
      params.smart_link_id = data.smartLinkId;
    }

    return params;
  }
}

export default DeepLinkRouter.getInstance();
