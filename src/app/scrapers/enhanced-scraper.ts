import { chromium } from "playwright";
import {
  CategoryData,
  Product,
  ScrapingResult,
} from "./enhanced-scraper.types";
import {
  extractProductDetails,
  loadFromCache,
  saveToCache,
  updateCache,
} from "./utils";

export const scrapeML = async (): Promise<ScrapingResult> => {
  const startTime = Date.now();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const allData: CategoryData[] = [];

  try {
    await page.goto("https://www.mercadolibre.com.ar/mas-vendidos", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const categories = await page.$$eval(
      "div.dynamic-carousel__container--with-link",
      (containers) =>
        containers.map((container) => {
          const title =
            container
              .querySelector("h2.dynamic__carousel-title")
              ?.textContent?.trim() || "";
          const linkElement = container.querySelector(
            "a.splinter-link.dynamic__carousel-link"
          );
          const url = linkElement?.getAttribute("href") || "";
          const categoryId = url.match(/MLA\d+/)?.[0] || "";

          return { id: categoryId, name: title, url };
        })
    );

    for (const category of categories) {
      const { id: categoryId, name: categoryName, url } = category;

      if (!url || !categoryName) {
        continue;
      }

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

        const products = await page.evaluate(() => {
          const productCards = Array.from(
            document.querySelectorAll(".poly-card")
          );
          return productCards
            .map((card, idx) => {
              const content = card.querySelector(".poly-card__content");
              if (!content) return null;

              const rank =
                content
                  .querySelector(".poly-component__highlight")
                  ?.textContent?.trim() || `${idx + 1}º`;
              const nameElement = content.querySelector(
                "a.poly-component__title"
              );
              const name =
                nameElement?.textContent?.trim() || `Producto ${idx + 1}`;
              const link = nameElement?.getAttribute("href") || "";
              const priceText =
                content
                  .querySelector(".andes-money-amount__fraction")
                  ?.textContent?.trim() || "0";

              let image = "";

              const portadaImg = card.querySelector(".poly-card__portada img");
              if (portadaImg && portadaImg.getAttribute("src")) {
                image = portadaImg.getAttribute("src") || "";
              } else if (!image) {
                const figureImg = card.querySelector(".poly-figure img");
                if (figureImg && figureImg.getAttribute("src")) {
                  image = figureImg.getAttribute("src") || "";
                }
              } else if (!image) {
                const anyImg = card.querySelector("img");
                if (anyImg && anyImg.getAttribute("src")) {
                  image = anyImg.getAttribute("src") || "";
                }
              }

              if (image.startsWith("data:image/gif;base64")) {
                const allImages = Array.from(card.querySelectorAll("img"));
                for (const img of allImages) {
                  const src = img.getAttribute("src") || "";
                  if (src && !src.startsWith("data:image/gif;base64")) {
                    image = src;
                    break;
                  }
                }
              }

              const rating = content
                .querySelector(".poly-reviews__rating")
                ?.textContent?.trim();
              const reviewsText =
                content.querySelector(".poly-reviews__total")?.textContent ||
                "0";
              const reviewsCount =
                parseInt(
                  reviewsText
                    .replace(/[()]/g, "")
                    .replace(/\./g, "")
                    .replace(/,/g, "")
                ) || 0;

              const positionMatch = rank.match(/\d+/);
              const position = positionMatch
                ? parseInt(positionMatch[0])
                : idx + 1;

              const price =
                parseFloat(priceText.replace(/\./g, "").replace(/,/g, ".")) ||
                0;

              const idMatch = link.match(/MLA\d+/);
              const id = idMatch ? idMatch[0] : `unknown-${idx}`;

              return {
                id,
                name,
                price,
                link,
                image,
                position,
                rating,
                reviewsCount,
              };
            })
            .filter((item) => item !== null);
        });

        const topProducts = products.slice(0, 5);
        for (const product of topProducts) {
          if (!product.link) continue;

          try {
            const productPage = await context.newPage();
            await productPage.goto(product.link, { timeout: 15000 });

            // Mejora en la función de evaluación para extractProductDetails
            const details = await productPage.evaluate(() => {
              // Recolectar todas las posibles imágenes del producto en la página de detalle
              let detailImage = null;

              // Estrategia 1: Imagen principal de la galería
              const mainGalleryImage = document.querySelector(
                ".ui-pdp-gallery__figure img"
              );
              if (mainGalleryImage && mainGalleryImage.getAttribute("src")) {
                detailImage = mainGalleryImage.getAttribute("src");
              }

              // Estrategia 2: Si no hay galería, buscar en el contenedor de imagen principal
              if (!detailImage) {
                const mainImage = document.querySelector(".ui-pdp-image");
                if (mainImage && mainImage.getAttribute("src")) {
                  detailImage = mainImage.getAttribute("src");
                }
              }

              // Estrategia 3: Buscar cualquier imagen que no sea un placeholder
              if (
                !detailImage ||
                detailImage.includes("data:image/gif;base64")
              ) {
                const allImages = Array.from(document.querySelectorAll("img"));
                for (const img of allImages) {
                  const src = img.getAttribute("src") || "";
                  const dataSrc = img.getAttribute("data-src") || ""; // Buscar también en data-src para lazy loading
                  if (
                    src &&
                    !src.includes("data:image/gif;base64") &&
                    src.includes("http")
                  ) {
                    detailImage = src;
                    break;
                  } else if (dataSrc && dataSrc.includes("http")) {
                    detailImage = dataSrc;
                    break;
                  }
                }
              }

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
                detailImage,
              };
            });

            Object.assign(product, {
              condition: details.condition,
              seller: details.seller,
              image:
                details.detailImage &&
                !details.detailImage.startsWith("data:image/gif;base64")
                  ? details.detailImage
                  : product.image,
            });

            await productPage.close();
          } catch (error: any) {
            console.error(
              `Error obteniendo detalles para ${product.name}:`,
              error?.message
            );
          }
        }

        allData.push({
          id: categoryId,
          name: categoryName,
          productCount: products.length,
          products: products.map((p) => ({
            ...p,
            category: categoryName,
            categoryId,
          })),
        });
      } catch (error: any) {
        console.error(`Error en categoría "${categoryName}":`, error?.message);
        allData.push({
          id: categoryId,
          name: categoryName,
          productCount: 0,
          products: [],
        });
      }
    }

    const executionTimeMs = Date.now() - startTime;

    const scrapingResult: ScrapingResult = {
      timestamp: new Date().toISOString(),
      totalCategories: allData.length,
      categoriesWithProducts: allData.filter((cat) => cat.productCount > 0)
        .length,
      totalProducts: allData.reduce((sum, cat) => sum + cat.productCount, 0),
      executionTimeMs,
      data: allData,
      backgroundUpdateInProgress: true,
    };

    await saveToCache(scrapingResult);

    exploreAdditionalCategories(scrapingResult).catch((error) => {
      console.error("Error al iniciar la exploración en segundo plano:", error);
    });

    return scrapingResult;
  } finally {
    await browser.close();
  }
};

export async function exploreAdditionalCategories(
  existingData: ScrapingResult
): Promise<void> {
  // Marcar que la actualización en segundo plano está en progreso
  const currentData = await loadFromCache();
  if (currentData) {
    await saveToCache({
      ...currentData,
      backgroundUpdateInProgress: true,
      backgroundUpdateComplete: false,
      lastUpdatedTimestamp: new Date().toISOString(),
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

  const browser = await chromium.launch({ headless: true });
  console.log("Navegador iniciado para exploración");
  const context = await browser.newContext();

  try {
    const exploredCategories = new Set(existingData.data.map((cat) => cat.id));
    const exploredProducts = new Set();
    existingData.data.forEach((cat) => {
      cat.products.forEach((prod) => exploredProducts.add(prod.id));
    });

    console.log(`Categorías ya exploradas: ${exploredCategories.size}`);
    console.log(`Productos ya explorados: ${exploredProducts.size}`);

    const newCategories: CategoryData[] = [];
    // Iniciar desde donde se quedó o desde el principio
    let startId = currentData?.lastExploredId
      ? currentData.lastExploredId + 1
      : 1;
    // Modificado: explorar hasta 9999
    let maxId = 9999;

    if (currentData) {
      const initialUpdate: ScrapingResult = {
        timestamp: new Date().toISOString(),
        totalCategories: currentData.totalCategories,
        categoriesWithProducts: currentData.categoriesWithProducts,
        totalProducts: currentData.totalProducts,
        executionTimeMs: currentData.executionTimeMs,
        data: currentData.data,
        backgroundUpdateInProgress: true,
        backgroundUpdateComplete: false,
        lastUpdatedTimestamp: new Date().toISOString(),
      };

      // Actualización inicial para mostrar que ha comenzado
      await saveToCache(initialUpdate);
    }

    console.log(`Comenzando exploración desde ID: ${startId} hasta ${maxId}`);

    const page = await context.newPage();

    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 500;

    while (startId <= maxId) {
      const categoryId = `MLA${String(startId).padStart(4, "0")}`;
      const currentId = startId; // Guardar para actualizar después
      startId++;

      // Actualizar más frecuentemente el estado (cada 10 IDs)

      if (currentId % 10 === 0) {
        // Asegurarnos de incluir siempre un timestamp
        const progressUpdate: ScrapingResult = {
          timestamp: new Date().toISOString(), // Siempre proporcionar un timestamp
          totalCategories: currentData?.totalCategories || 0,
          categoriesWithProducts: currentData?.categoriesWithProducts || 0,
          totalProducts: currentData?.totalProducts || 0,
          executionTimeMs: currentData?.executionTimeMs || 0,
          data: currentData?.data || [], // Mantener los datos existentes
          backgroundUpdateInProgress: true,
          backgroundUpdateComplete: false,
          lastExploredId: currentId,
          lastUpdatedTimestamp: new Date().toISOString(),
        };

        // Actualizar estado sin esperar a que termine
        saveToCache(progressUpdate).catch((e) =>
          console.error("Error actualizando caché de progreso:", e)
        );

        console.log(
          `Progreso: ${currentId}/${maxId} (${Math.round(
            (currentId / maxId) * 100
          )}%)`
        );
      }

      // Si ya exploramos esta categoría, continuar
      if (exploredCategories.has(categoryId)) {
        continue;
      }

      try {
        const url = `https://www.mercadolibre.com.ar/mas-vendidos/${categoryId}`;
        console.log(`Explorando ${url} (${startId - 1}/${maxId})`);
        const response = await page.goto(url, { timeout: 30000 }); // Aumentado a 30s

        // Verificar si la página fue encontrada
        if (response?.status() === 404) {
          console.log(`Categoría ${categoryId} no encontrada`);
          consecutiveFailures++;

          // Si hay demasiados fallos consecutivos, hacer una pausa para evitar sobrecarga
          if (consecutiveFailures > MAX_CONSECUTIVE_FAILURES) {
            console.log(
              `Demasiados fallos consecutivos (${consecutiveFailures}), haciendo pausa...`
            );
            await new Promise((resolve) => setTimeout(resolve, 30000)); // Pausa de 30 segundos
            consecutiveFailures = 0;
          }
          continue;
        }

        // Resetear contador de fallos cuando se encuentra una página válida
        consecutiveFailures = 0;

        // Estrategia mejorada para obtener el nombre de la categoría
        let categoryName: string | undefined = "";
        try {
          // Intentar extraer usando múltiples selectores posibles
          categoryName = await page.evaluate(() => {
            // Intento 1: Selector original (h1.breadcrumb__title)
            const breadcrumbTitle = document.querySelector(
              "h1.breadcrumb__title"
            );
            if (breadcrumbTitle && breadcrumbTitle.textContent) {
              return breadcrumbTitle.textContent.trim();
            }

            // Intento 2: Selector h2.ui-search-breadcrumb__title
            const uiSearchTitle = document.querySelector(
              "h2.ui-search-breadcrumb__title, h2.ui-label-builder.ui-search-breadcrumb__title"
            );
            if (uiSearchTitle && uiSearchTitle.textContent) {
              // Limpiar el texto "Más vendidos en" si existe
              let text = uiSearchTitle.textContent.trim();
              return text.replace("Más vendidos en", "").trim();
            }

            // Intento 3: Buscar cualquier elemento con la palabra "breadcrumb" y "title"
            const breadcrumbElements = document.querySelectorAll(
              "[class*='breadcrumb'][class*='title']"
            );
            for (const element of breadcrumbElements) {
              if (element.textContent) {
                let text = element.textContent.trim();
                return text.replace("Más vendidos en", "").trim();
              }
            }

            // Intento 4: Buscar en el título de la página
            const pageTitle = document.title;
            if (pageTitle) {
              // Si el título incluye "Más Vendidos en [Categoría]"
              const match = pageTitle.match(
                /Más Vendidos en\s+(.+?)(?:\s+|$)/i
              );
              if (match && match[1]) {
                return match[1].trim();
              }

              // Si el título tiene un formato diferente pero incluye "MercadoLibre"
              if (pageTitle.includes("MercadoLibre")) {
                return pageTitle.split("|")[0].trim();
              }
            }

            // Si todo lo anterior falla, intentar buscar cualquier encabezado prominente
            const headings = [
              ...document.querySelectorAll("h1, h2, h3"),
            ].filter(
              (h) =>
                h.textContent &&
                (h.textContent.includes("vendido") ||
                  h.textContent.includes("categoría") ||
                  h.textContent.includes("productos"))
            );

            if (headings.length > 0) {
              let text = headings[0]?.textContent?.trim();
              return text?.replace("Más vendidos en", "").trim();
            }

            return "";
          });

          // Si aún no tenemos nombre, intentar extraer del URL
          if (!categoryName) {
            const url = page.url();
            const urlMatch = url.match(/\/mas-vendidos\/([^\/]+)/);
            if (urlMatch && urlMatch[1]) {
              // Convertir algo como "juegos-y-juguetes" a "Juegos y Juguetes"
              categoryName = urlMatch[1]
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());
            }
          }
        } catch (error) {
          console.error(`Error al extraer nombre de categoría: ${error}`);
          categoryName = "";
        }

        // Verificar si se obtuvo un nombre de categoría
        if (!categoryName) {
          // Como último recurso, crear un nombre genérico basado en el ID
          categoryName = `Categoría ${categoryId}`;
          console.log(
            `No se pudo obtener el nombre exacto, usando nombre genérico: ${categoryName}`
          );
        } else {
          console.log(`Nombre de categoría extraído: ${categoryName}`);
        }

        // MEJORA: Extracción mejorada de productos con imágenes correctas
        const products = await page.evaluate(() => {
          const productCards = Array.from(
            document.querySelectorAll(".poly-card")
          );
          return productCards
            .map((card, idx) => {
              // Buscar el contenido principal del card
              const content = card.querySelector(".poly-card__content");
              if (!content) return null;

              // Extraer los datos básicos
              const rank =
                content
                  .querySelector(".poly-component__highlight")
                  ?.textContent?.trim() || `${idx + 1}º`;
              const nameElement = content.querySelector(
                "a.poly-component__title"
              );
              const name =
                nameElement?.textContent?.trim() || `Producto ${idx + 1}`;
              const link = nameElement?.getAttribute("href") || "";
              const priceText =
                content
                  .querySelector(".andes-money-amount__fraction")
                  ?.textContent?.trim() || "0";

              // MEJORA PRINCIPAL: Estrategia múltiple para encontrar la imagen
              let image = "";

              // 1. Buscar todas las fuentes de imágenes posibles
              const imageSources = [];

              // Buscar en portada con selectores específicos
              const portadaImg = card.querySelector(".poly-card__portada img");
              if (portadaImg) {
                const src = portadaImg.getAttribute("src");
                const dataSrc = portadaImg.getAttribute("data-src");
                if (src) imageSources.push(src);
                if (dataSrc) imageSources.push(dataSrc);
              }

              // Buscar en otros contenedores comunes
              const figureImg = card.querySelector(".poly-figure img");
              if (figureImg) {
                const src = figureImg.getAttribute("src");
                const dataSrc = figureImg.getAttribute("data-src");
                if (src) imageSources.push(src);
                if (dataSrc) imageSources.push(dataSrc);
              }

              // Buscar en clase específica
              const pictureImg = card.querySelector(".poly-component__picture");
              if (pictureImg) {
                const src = pictureImg.getAttribute("src");
                const dataSrc = pictureImg.getAttribute("data-src");
                if (src) imageSources.push(src);
                if (dataSrc) imageSources.push(dataSrc);
              }

              // Buscar cualquier imagen
              const anyImgs = Array.from(card.querySelectorAll("img"));
              for (const img of anyImgs) {
                const src = img.getAttribute("src");
                const dataSrc = img.getAttribute("data-src");
                if (src) imageSources.push(src);
                if (dataSrc) imageSources.push(dataSrc);
              }

              // 2. Filtrar sources para encontrar la mejor imagen
              for (const src of imageSources) {
                // Excluir placeholders y favicons
                if (
                  src &&
                  !src.startsWith("data:image/gif;base64") &&
                  !src.includes("favicon") &&
                  src.includes("http")
                ) {
                  image = src;
                  break;
                }
              }

              // Extraer la puntuación y reseñas
              const rating = content
                .querySelector(".poly-reviews__rating")
                ?.textContent?.trim();
              const reviewsText =
                content.querySelector(".poly-reviews__total")?.textContent ||
                "0";
              const reviewsCount =
                parseInt(
                  reviewsText
                    .replace(/[()]/g, "")
                    .replace(/\./g, "")
                    .replace(/,/g, "")
                ) || 0;

              // Extraer posición
              const positionMatch = rank.match(/\d+/);
              const position = positionMatch
                ? parseInt(positionMatch[0])
                : idx + 1;

              // Calcular precio
              const price =
                parseFloat(priceText.replace(/\./g, "").replace(/,/g, ".")) ||
                0;

              // Extraer ID
              const idMatch = link.match(/MLA\d+/);
              const id = idMatch ? idMatch[0] : `unknown-${idx}`;

              return {
                id,
                name,
                price,
                link,
                image,
                position,
                rating,
                reviewsCount,
              };
            })
            .filter((item) => item !== null); // Filtrar elementos nulos
        });

        if (products.length === 0) {
          console.log(
            `No se encontraron productos en la categoría ${categoryId}`
          );
          continue;
        }

        console.log(
          `Encontrados ${products.length} productos en ${categoryName} (${categoryId})`
        );

        // Explorar detalles de los primeros productos (limitamos a 3 para no sobrecargar)
        const detailedProducts: Product[] = [];
        const productsToExplore = products.slice(0, 3);

        for (const product of productsToExplore) {
          if (!product.link || exploredProducts.has(product.id)) continue;

          const detailedProduct = await extractProductDetails(
            context,
            product.link,
            {
              ...product,
              category: categoryName,
              categoryId,
            }
          );

          if (detailedProduct) {
            detailedProducts.push(detailedProduct);
            exploredProducts.add(detailedProduct.id);
          }
        }

        // Añadir productos sin detalles
        const remainingProducts = products
          .filter((p) => !productsToExplore.find((ep) => ep.id === p.id))
          .map((p) => ({
            ...p,
            category: categoryName,
            categoryId,
          }));

        // Combinar con productos detallados
        const allProducts = [...detailedProducts, ...remainingProducts];

        // Añadir la nueva categoría
        newCategories.push({
          id: categoryId,
          name: categoryName,
          productCount: allProducts.length,
          products: allProducts,
        });

        exploredCategories.add(categoryId);

        if (newCategories.length % 5 === 0 || startId % 1000 === 0) {
          const updatedResult: ScrapingResult = {
            timestamp: new Date().toISOString(),
            totalCategories: newCategories.length,
            categoriesWithProducts: newCategories.filter(
              (cat) => cat.productCount > 0
            ).length,
            totalProducts: newCategories.reduce(
              (sum, cat) => sum + cat.productCount,
              0
            ),
            executionTimeMs: 0,
            data: newCategories,
            backgroundUpdateInProgress: true,
            lastExploredId: startId - 1,
            lastUpdatedTimestamp: new Date().toISOString(),
          };

          await updateCache(updatedResult);
          console.log(
            `Actualización de caché: ${startId - 1}/${maxId} IDs explorados, ${
              newCategories.length
            } categorías encontradas`
          );
        }
      } catch (error: any) {
        console.error(`Error explorando ${categoryId}:`, error?.message);

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (newCategories.length > 0) {
      const finalResult: ScrapingResult = {
        timestamp: new Date().toISOString(),
        totalCategories: newCategories.length,
        categoriesWithProducts: newCategories.filter(
          (cat) => cat.productCount > 0
        ).length,
        totalProducts: newCategories.reduce(
          (sum, cat) => sum + cat.productCount,
          0
        ),
        executionTimeMs: 0,
        data: newCategories,
        backgroundUpdateComplete: true,
        backgroundUpdateInProgress: false,
        lastExploredId: maxId,
        lastUpdatedTimestamp: new Date().toISOString(),
      };

      await updateCache(finalResult);
    }
  } catch (error) {
    console.error("Error en la exploración en segundo plano:", error);
  } finally {
    // Actualizar el estado para indicar que la actualización en segundo plano ha terminado
    const finalData = await loadFromCache();
    if (finalData) {
      await saveToCache({
        ...finalData,
        backgroundUpdateInProgress: false,
        backgroundUpdateComplete: true,
        lastUpdatedTimestamp: new Date().toISOString(),
      });
    }

    await browser.close();
  }
}

export async function checkBackgroundUpdateStatus(): Promise<{
  inProgress: boolean;
  complete: boolean;
  categoriesFound?: number;
  lastExploredId?: number;
  progress?: number;
}> {
  const cachedData = await loadFromCache();

  if (!cachedData) {
    return { inProgress: false, complete: false };
  }

  // Calcular el progreso como porcentaje
  let progress;
  if (cachedData.lastExploredId) {
    progress = Math.min(
      100,
      Math.round((cachedData.lastExploredId / 9999) * 100)
    );
  }

  return {
    inProgress: cachedData.backgroundUpdateInProgress || false,
    complete: cachedData.backgroundUpdateComplete || false,
    categoriesFound: cachedData.totalCategories,
    lastExploredId: cachedData.lastExploredId,
    progress,
  };
}

export async function forceBackgroundUpdate(): Promise<boolean> {
  const cachedData = await loadFromCache();
  if (!cachedData) {
    // Crear datos iniciales para poder iniciar la exploración
    const initialData: ScrapingResult = {
      timestamp: new Date().toISOString(),
      totalCategories: 0,
      categoriesWithProducts: 0,
      totalProducts: 0,
      executionTimeMs: 0,
      data: [],
      backgroundUpdateInProgress: true,
    };
    await saveToCache(initialData);

    // Iniciar exploración con datos vacíos
    exploreAdditionalCategories(initialData).catch((error) => {
      console.error(
        "Error al iniciar la exploración con datos iniciales:",
        error
      );
    });
    return true;
  }

  // Verificar si ya hay una actualización en progreso
  if (cachedData.backgroundUpdateInProgress) {
    return false;
  }

  // Marcar como en progreso antes de iniciar
  await saveToCache({
    ...cachedData,
    backgroundUpdateInProgress: true,
    backgroundUpdateComplete: false,
  });

  // Iniciar actualización en segundo plano
  exploreAdditionalCategories(cachedData).catch((error) => {
    console.error(
      "Error al iniciar la exploración forzada en segundo plano:",
      error
    );
  });

  return true;
}

// Función para reanudar la exploración desde un ID específico
export async function resumeBackgroundUpdate(
  fromId?: number
): Promise<boolean> {
  const cachedData = await loadFromCache();
  if (!cachedData) {
    return false;
  }

  // Si ya hay una actualización en progreso, no iniciar otra
  if (cachedData.backgroundUpdateInProgress) {
    return false;
  }

  // Si se proporciona un ID de inicio, actualizar el valor en la caché
  if (fromId && fromId > 0 && fromId < 9999) {
    await saveToCache({
      ...cachedData,
      lastExploredId: fromId - 1, // Restar 1 porque el explorador incrementará antes de empezar
      backgroundUpdateInProgress: true,
      backgroundUpdateComplete: false,
    });
  }

  // Iniciar actualización en segundo plano
  exploreAdditionalCategories(cachedData).catch((error) => {
    console.error("Error al reanudar la exploración en segundo plano:", error);
  });

  return true;
}
