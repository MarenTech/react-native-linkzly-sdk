import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useIsFocused} from '@react-navigation/native';
import LinkzlySDK from '@linkzly/react-native-sdk';
import ProductService from '../services/ProductService';
import DeepLinkRouter from '../navigation/DeepLinkRouter';
import {Product, ProductHelper} from '../models/Product';

const ProductListScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (isFocused) {
      trackProductListViewed();
    }
  }, [isFocused, products.length]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProducts = await ProductService.fetchProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const trackProductListViewed = () => {
    const params: Record<string, any> = {
      screen: 'product_list',
      product_count: products.length,
    };

    const attributionParams = DeepLinkRouter.getAttributionParameters();
    Object.assign(params, attributionParams);

    LinkzlySDK.trackEvent('product_list_viewed', params);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', {productId: product.id});
  };

  const handleRetry = () => {
    loadProducts();
  };

  const renderProduct = ({item}: {item: Product}) => {
    const imageUrl = ProductHelper.getImageUrl(item, 150);
    const displayTitle = ProductHelper.getDisplayTitle(item);
    const price = ProductHelper.getPrice(item);
    const category = ProductHelper.getCategory(item);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleProductPress(item)}>
        <Image
          source={{uri: imageUrl}}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {displayTitle}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>
              ${price.toFixed(2)}
            </Text>
            <Text style={styles.productCategory}>{category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load Products</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>↻ Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
  },
  productInfo: {
    padding: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    minHeight: 40,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196f3',
  },
  productCategory: {
    fontSize: 11,
    color: '#999',
  },
});

export default ProductListScreen;
