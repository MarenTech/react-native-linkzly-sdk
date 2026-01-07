import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useRoute, RouteProp} from '@react-navigation/native';
import LinkzlySDK from '@linkzly/react-native-sdk';
import ProductService from '../services/ProductService';
import DeepLinkRouter from '../navigation/DeepLinkRouter';
import {Product, ProductHelper} from '../models/Product';

type ProductDetailRouteProp = RouteProp<
  {ProductDetail: {productId: number}},
  'ProductDetail'
>;

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const {productId} = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showAttribution, setShowAttribution] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (product) {
      trackProductViewed();
    }
  }, [product]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const fetchedProduct = await ProductService.fetchProduct(productId);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const trackProductViewed = () => {
    if (!product) return;

    const params: Record<string, any> = {
      product_id: product.id,
      product_name: product.title,
      product_price: ProductHelper.getPrice(product),
      product_category: ProductHelper.getCategory(product),
      screen: 'product_detail',
    };

    const attributionParams = DeepLinkRouter.getAttributionParameters();
    Object.assign(params, attributionParams);

    LinkzlySDK.trackEvent('product_viewed', params);
  };

  const handleAddToCart = () => {
    if (!product) return;

    setAddedToCart(true);

    const params: Record<string, any> = {
      product_id: product.id,
      product_name: product.title,
      product_price: ProductHelper.getPrice(product),
      product_category: ProductHelper.getCategory(product),
      quantity: 1,
      screen: 'product_detail',
    };

    const attributionParams = DeepLinkRouter.getAttributionParameters();
    Object.assign(params, attributionParams);

    LinkzlySDK.trackEvent('add_to_cart', params);
  };

  const handlePurchase = async () => {
    if (!product) return;

    const price = ProductHelper.getPrice(product);

    const params: Record<string, any> = {
      product_id: product.id,
      product_name: product.title,
      amount: price,
      currency: ProductHelper.getCurrency(),
      product_category: ProductHelper.getCategory(product),
      quantity: 1,
      screen: 'product_detail',
    };

    const attributionParams = DeepLinkRouter.getAttributionParameters();
    Object.assign(params, attributionParams);

    // Track purchase using the new trackPurchase() method
    try {
      await LinkzlySDK.trackPurchase(params);
      console.log('✅ Purchase tracked successfully');

      Alert.alert(
        'Purchase Successful!',
        `Thank you for your purchase of ${ProductHelper.getDisplayTitle(
          product,
        )}!\n\nPurchase event has been tracked.`,
      );
    } catch (error) {
      console.error('❌ Purchase tracking failed:', error);
      Alert.alert(
        'Purchase Successful!',
        `Thank you for your purchase of ${ProductHelper.getDisplayTitle(
          product,
        )}!\n\n(Purchase tracking failed)`,
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <Text style={styles.errorMessage}>
          The product you're looking for could not be found.
        </Text>
      </View>
    );
  }

  const imageUrl = ProductHelper.getImageUrl(product, 600);
  const displayTitle = ProductHelper.getDisplayTitle(product);
  const price = ProductHelper.getPrice(product);
  const category = ProductHelper.getCategory(product);
  const deepLinkData = DeepLinkRouter.getCurrentDeepLinkData();

  return (
    <ScrollView style={styles.container}>
      <Image source={{uri: imageUrl}} style={styles.productImage} />

      <View style={styles.content}>
        <Text style={styles.productTitle}>{displayTitle}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>${price.toFixed(2)}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        </View>

        <Text style={styles.productId}>Product ID: {product.id}</Text>

        {deepLinkData && (
          <View style={styles.attributionPanel}>
            <TouchableOpacity
              style={styles.attributionHeader}
              onPress={() => setShowAttribution(!showAttribution)}>
              <Text style={styles.attributionTitle}>
                📊 Attribution Data {showAttribution ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showAttribution && (
              <View style={styles.attributionContent}>
                {deepLinkData.url && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>URL:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.url}
                    </Text>
                  </View>
                )}
                {deepLinkData.path && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>Path:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.path}
                    </Text>
                  </View>
                )}
                {deepLinkData.smartLinkId && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>Smart Link ID:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.smartLinkId}
                    </Text>
                  </View>
                )}
                {deepLinkData.clickId && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>Click ID:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.clickId}
                    </Text>
                  </View>
                )}
                {deepLinkData.parameters?.utm_source && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>UTM Source:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.parameters.utm_source}
                    </Text>
                  </View>
                )}
                {deepLinkData.parameters?.utm_medium && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>UTM Medium:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.parameters.utm_medium}
                    </Text>
                  </View>
                )}
                {deepLinkData.parameters?.utm_campaign && (
                  <View style={styles.attributionRow}>
                    <Text style={styles.attributionLabel}>UTM Campaign:</Text>
                    <Text style={styles.attributionValue}>
                      {deepLinkData.parameters.utm_campaign}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonOutline,
              addedToCart && styles.buttonDisabled,
            ]}
            onPress={handleAddToCart}
            disabled={addedToCart}>
            <Text
              style={[
                styles.buttonText,
                styles.buttonTextOutline,
                addedToCart && styles.buttonTextDisabled,
              ]}>
              {addedToCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handlePurchase}>
            <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
              💳 Buy Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: 20,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#2196f3',
    fontWeight: '600',
  },
  productId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  attributionPanel: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  attributionHeader: {
    padding: 15,
  },
  attributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  attributionContent: {
    backgroundColor: '#fff',
    padding: 15,
  },
  attributionRow: {
    marginBottom: 10,
  },
  attributionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  attributionValue: {
    fontSize: 13,
    color: '#1976d2',
  },
  buttonContainer: {
    marginTop: 10,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  buttonPrimary: {
    backgroundColor: '#2196f3',
  },
  buttonDisabled: {
    borderColor: '#4caf50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextOutline: {
    color: '#2196f3',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextDisabled: {
    color: '#4caf50',
  },
});

export default ProductDetailScreen;
