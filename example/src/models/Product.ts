export interface Product {
  id: number;
  albumId: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

export class ProductHelper {
  static getDisplayTitle(product: Product): string {
    const capitalized = product.title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return capitalized.length > 50
      ? `${capitalized.substring(0, 50)}...`
      : capitalized;
  }

  static getPrice(product: Product): number {
    // Mock price: ID modulo 100 + base price
    return (product.id % 100) + 9.99;
  }

  static getCurrency(): string {
    return 'USD';
  }

  static getCategory(product: Product): string {
    const categories = [
      'Electronics',
      'Home & Garden',
      'Fashion',
      'Sports',
      'Books',
      'Toys',
    ];
    return categories[product.albumId % categories.length];
  }

  static getImageUrl(product: Product, size: number = 150): string {
    // Use picsum.photos for reliable image loading
    return `https://picsum.photos/seed/product${product.id}/${size}`;
  }
}
