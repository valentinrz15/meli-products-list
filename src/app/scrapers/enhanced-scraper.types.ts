export interface Product {
  id: string;
  name: string;
  price: number;
  link: string;
  image: string;
  rating?: string;
  reviewsCount?: number;
  position?: number;
  category: string;
  categoryId: string;
  seller?: {
    name: string;
    reputation?: string;
  };
  condition?: string;
}

export interface CategoryData {
  id: string;
  name: string;
  productCount: number;
  products: Product[];
}

export interface ApiResponse {
  fromCache: boolean;
  data: ScrapingResult;
}

export interface ScrapingResult {
  timestamp: string;
  totalCategories: number;
  categoriesWithProducts: number;
  totalProducts: number;
  executionTimeMs: number;
  data: CategoryData[];
  fromCache?: boolean;
  backgroundUpdateInProgress?: boolean;
  backgroundUpdateComplete?: boolean;
  lastExploredId?: number;
  lastUpdatedTimestamp?: string
  scrapingInProgress?: boolean
}
