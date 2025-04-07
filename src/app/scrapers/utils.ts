import fs from "fs";
import path from "path";
import {
  CategoryData,
  Product,
  ScrapingResult,
} from "./enhanced-scraper.types";

const CACHE_FILE = path.join(process.cwd(), "data", "ml-products-cache.json");

export async function saveToCache(data: ScrapingResult): Promise<void> {
  try {
    await fs.promises.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.promises.writeFile(CACHE_FILE, JSON.stringify(data), "utf8");
  } catch (error) {
    console.error("Error al guardar en caché:", error);
  }
}

export async function loadFromCache(): Promise<ScrapingResult | null> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = await fs.promises.readFile(CACHE_FILE, "utf8");
      const parsedData = JSON.parse(data) as ScrapingResult;
      return {
        ...parsedData,
        fromCache: true,
      };
    }
  } catch (error) {
    console.error("Error al cargar desde caché:", error);
  }
  return null;
}

export async function updateCache(newData: ScrapingResult): Promise<void> {
  try {
    const existingData = await loadFromCache();
    if (!existingData) {
      await saveToCache(newData);
      return;
    }

    const combinedCategories: CategoryData[] = [...existingData.data];

    for (const newCategory of newData.data) {
      const existingCategoryIndex = combinedCategories.findIndex(
        (cat) => cat.id === newCategory.id
      );

      if (existingCategoryIndex === -1) {
        combinedCategories.push(newCategory);
      } else {
        const existingCategory = combinedCategories[existingCategoryIndex];
        const existingProductIds = new Set(
          existingCategory.products.map((p) => p.id)
        );

        for (const newProduct of newCategory.products) {
          if (!existingProductIds.has(newProduct.id)) {
            existingCategory.products.push(newProduct);
          }
        }

        existingCategory.productCount = existingCategory.products.length;
      }
    }

    const updatedData: ScrapingResult = {
      timestamp: new Date().toISOString(),
      totalCategories: combinedCategories.length,
      categoriesWithProducts: combinedCategories.filter(
        (cat) => cat.productCount > 0
      ).length,
      totalProducts: combinedCategories.reduce(
        (sum, cat) => sum + cat.productCount,
        0
      ),
      executionTimeMs: existingData.executionTimeMs,
      data: combinedCategories,
      fromCache: true,
      backgroundUpdateInProgress: false,
      lastExploredId: newData.lastExploredId || existingData.lastExploredId,
    };

    await saveToCache(updatedData);
  } catch (error) {
    console.error("Error al actualizar la caché:", error);
  }
}

export async function extractProductDetails(
  context: any,
  productLink: string,
  productBase: Partial<Product>
): Promise<Product | null> {
  try {
    const productPage = await context.newPage();
    await productPage.goto(productLink, { timeout: 15000 });

    const details = await productPage.evaluate(() => {
      const mainImage = document.querySelector(".ui-pdp-gallery__figure img");
      const imageSrc = mainImage ? mainImage.getAttribute("src") : null;

      return {
        condition: document
          .querySelector(".ui-pdp-subtitle")
          ?.textContent?.trim(),
        seller: {
          name: document
            .querySelector(".ui-pdp-seller__link-trigger")
            ?.textContent?.trim(),
          reputation: document
            .querySelector(".ui-pdp-seller__sales-description")
            ?.textContent?.trim(),
        },
        detailImage: imageSrc,
      };
    });

    const product: Product = {
      id: productBase.id || `unknown-${Date.now()}`,
      name: productBase.name || "Producto sin nombre",
      price: productBase.price || 0,
      link: productLink,
      image: details.detailImage || productBase.image || "",
      position: productBase.position,
      rating: productBase.rating,
      reviewsCount: productBase.reviewsCount || 0,
      condition: details.condition || undefined,
      seller: details.seller,
      category: productBase.category || "Sin categoría",
      categoryId: productBase.categoryId || "unknown",
    };

    await productPage.close();
    return product;
  } catch (error: any) {
    console.error(
      `Error obteniendo detalles para ${productLink}:`,
      error?.message
    );
    return null;
  }
}

/**
 * Deduplica productos por ID en los datos del scraping
 * para evitar problemas de renderizado en la UI
 */
export function deduplicateProducts(data: ScrapingResult): ScrapingResult {
  if (!data || !data.data) return data;

  // Conjunto para rastrear IDs de productos ya procesados
  const processedProductIds = new Set<string>();

  // Procesar cada categoría y deduplicar sus productos
  const deduplicatedCategories: CategoryData[] = data.data.map((category) => {
    const uniqueProducts: Product[] = [];

    // Para cada producto en la categoría, verificar si ya se procesó su ID
    for (const product of category.products) {
      if (!processedProductIds.has(product.id)) {
        uniqueProducts.push(product);
        processedProductIds.add(product.id);
      }
    }

    // Actualizar el conteo de productos de la categoría
    return {
      ...category,
      productCount: uniqueProducts.length,
      products: uniqueProducts,
    };
  });

  // Calcular nuevo total de productos
  const totalProducts = deduplicatedCategories.reduce(
    (sum, category) => sum + category.productCount,
    0
  );

  // Retornar resultado actualizado
  return {
    ...data,
    totalProducts,
    data: deduplicatedCategories,
  };
}
