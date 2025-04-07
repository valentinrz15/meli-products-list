// Definición de tipos para nuestro proyecto
export interface Product {
  id: string;
  name: string;
  price: number;
  link: string;
  image: string;
  position?: number;
  rating?: string;
  reviewsCount?: number;
  condition?: string;
  seller?: {
    name?: string;
    reputation?: string;
  };
  category: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  productCount: number;
  products: Product[];
}

export interface ScrapingResult {
  timestamp: string;
  totalCategories: number;
  categoriesWithProducts: number;
  totalProducts: number;
  executionTimeMs: number;
  data: Category[];
  backgroundUpdateInProgress?: boolean;
  backgroundUpdateComplete?: boolean;
  lastExploredId?: number;
  lastUpdatedTimestamp?: string;
  fromCache?: boolean;
  scrapingInProgress?: boolean;
}

export interface ProductsFilter {
  search: string;
  category: string;
  sort: "price_asc" | "price_desc" | "popularity" | "position";
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
}

export interface BackgroundStatus {
  inProgress: boolean;
  complete: boolean;
  categoriesFound?: number;
  lastExploredId?: number;
  progress?: number;
}
