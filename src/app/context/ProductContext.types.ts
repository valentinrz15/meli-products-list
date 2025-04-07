import { BackgroundStatus, Category, ProductsFilter } from "../lib/types";
import { Product } from "../scrapers/enhanced-scraper.types";

export interface ProductContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  filter: ProductsFilter;
  setFilter: (filter: Partial<ProductsFilter>) => void;
  filteredProducts: Product[];
  totalPages: number;
  updateStatus: BackgroundStatus | null;
  refreshData: () => Promise<void>;
}
