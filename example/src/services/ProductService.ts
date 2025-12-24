import {Product} from '../models/Product';

class ProductService {
  private static instance: ProductService;
  private products: Product[] = [];
  private isLoading: boolean = false;
  private error: Error | null = null;

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async fetchProducts(): Promise<Product[]> {
    if (this.products.length > 0) {
      return this.products;
    }

    this.isLoading = true;
    this.error = null;

    try {
      // Fetch from JSONPlaceholder API
      const response = await fetch(
        'https://jsonplaceholder.typicode.com/photos?_limit=50',
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.products = await response.json();
      this.isLoading = false;
      return this.products;
    } catch (error) {
      this.error = error as Error;
      this.isLoading = false;
      throw error;
    }
  }

  async fetchProduct(id: number): Promise<Product | null> {
    // Try to find in cache first
    const cachedProduct = this.products.find(p => p.id === id);
    if (cachedProduct) {
      return cachedProduct;
    }

    // Fetch from API
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/photos/${id}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const product = await response.json();

      // Add to cache
      this.products.push(product);

      return product;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  getIsLoading(): boolean {
    return this.isLoading;
  }

  getError(): Error | null {
    return this.error;
  }

  clearCache(): void {
    this.products = [];
  }
}

export default ProductService.getInstance();
