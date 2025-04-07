"use client";

import { useState, useEffect, ReactNode, FunctionComponent } from "react";
import axios from "axios";
import { BackgroundStatus, ProductsFilter } from "../lib/types";
import { ProductContextType } from "./ProductContext.types";
import { Product, ScrapingResult } from "../scrapers/enhanced-scraper.types";
import { ProductContext } from "./ProductContext";

const initialFilter: ProductsFilter = {
  search: "",
  category: "",
  sort: "position",
  minPrice: null,
  maxPrice: null,
  page: 1,
};

export const ProductProvider: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductsFilter>(initialFilter);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [updateStatus, setUpdateStatus] = useState<BackgroundStatus | null>(
    null
  );

  // Función para cargar los datos - versión corregida
  // Corrección para evitar múltiples solicitudes a la API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let retryCount = 0;
      const maxRetries = 3;

      const attemptFetch = async () => {
        try {
          const response = await axios.get("/api/products");
          const data: ScrapingResult = response.data;

          if (data && data?.data && Array.isArray(data.data)) {
            let hasProductsData = data.data.some(
              (cat) => cat.products && cat.products.length > 0
            );

            if (
              hasProductsData ||
              !data.scrapingInProgress ||
              retryCount >= maxRetries
            ) {
              console.log(
                "Datos cargados correctamente o se alcanzó el máximo de reintentos"
              );
              setScrapingResult(data);
              setIsLoading(false);
              return true;
            } else {
              // Solo reintentar si hay scraping en progreso Y no hemos excedido el límite
              retryCount++;
              console.log(
                `Scraping en progreso, reintento ${retryCount}/${maxRetries}...`
              );
              return false;
            }
          } else {
            console.log("No hay datos disponibles");
            setScrapingResult(data);
            setIsLoading(false);
            return true;
          }
        } catch (err) {
          console.error("Error en fetchData:", err);
          setError(err instanceof Error ? err.message : "Error desconocido");
          setIsLoading(false);
          return true;
        }
      };

      const fetchComplete = await attemptFetch();
      if (!fetchComplete) {
        const retryWithBackoff = async () => {
          const backoffTime = Math.min(2000 * Math.pow(1.5, retryCount), 10000); // max 10 segundos

          await new Promise((resolve) => setTimeout(resolve, backoffTime));
          const complete = await attemptFetch();

          if (!complete && retryCount < maxRetries) {
            retryWithBackoff();
          } else {
            // Asegurarnos de desactivar la carga después del último reintento
            setIsLoading(false);
          }
        };

        retryWithBackoff();
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error grave en fetchData:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setIsLoading(false);
    }
  };

  // Verificar estado de actualización en segundo plano
  const checkUpdateStatus = async () => {
    try {
      if (isLoading) return; 

      const response = await axios.get("/api/status");

      if (response.status === 200) {
        const status: BackgroundStatus = response.data;
        setUpdateStatus(status);

        // Si hay una actualización completa, refrescar datos
        if (status.complete && !status.inProgress && !updateStatus?.complete) {
          await fetchData();
        }
      }
    } catch (error) {
      console.error("Error al verificar el estado de actualización:", error);
    }
  };

  const updateFilter = (newFilter: Partial<ProductsFilter>) => {
    setFilter((prev) => {
      // Si cambia cualquier filtro excepto la página, resetear a página 1
      if (Object.keys(newFilter).some((key) => key !== "page")) {
        return { ...prev, ...newFilter, page: 1 };
      }
      return { ...prev, ...newFilter };
    });
  };

  // Cargar datos iniciales - versión corregida
  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      await fetchData();

      // Solo verificar estado si el componente sigue montado
      if (mounted) {
        setTimeout(() => {
          if (mounted) checkUpdateStatus();
        }, 5000);
      }
    };

    loadInitialData();

    const interval = setInterval(() => {
      if (!isLoading && mounted) {
        checkUpdateStatus();
      }
    }, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []); // Este efecto solo debe ejecutarse al montar el componente

  // Aplicar filtros cuando cambian los parámetros o los datos - versión optimizada
  useEffect(() => {
    if (!scrapingResult || !scrapingResult.data) return;

    // Usar un timeout para evitar bloquear la UI
    const timeoutId = setTimeout(() => {
      try {
        console.log("Aplicando filtros...");

        // Limitar la cantidad de productos para mejorar el rendimiento
        // Obtener hasta 1000 productos máximo para procesar
        const maxProductsToProcess = 1000;
        let allProducts: Product[] = [];
        const processedIds = new Set<string>(); // Set para mantener IDs únicos

        // Tomar los primeros productos de cada categoría hasta llegar al límite
        let productCount = 0;
        for (const category of scrapingResult.data) {
          // Tomar hasta 50 productos por categoría como máximo
          // Filtrar para evitar productos duplicados
          for (const product of category.products.slice(0, 50)) {
            if (!processedIds.has(product.id)) {
              allProducts.push(product);
              processedIds.add(product.id);
              productCount++;

              if (productCount >= maxProductsToProcess) break;
            }
          }

          if (productCount >= maxProductsToProcess) break;
        }

        // Aplicar filtro de categoría
        let filtered = allProducts;
        if (filter.category) {
          filtered = allProducts.filter(
            (product) => product.categoryId === filter.category
          );
        }

        // Aplicar filtro de búsqueda
        if (filter.search.trim()) {
          const searchLower = filter.search.toLowerCase();
          filtered = filtered.filter((product) =>
            product.name.toLowerCase().includes(searchLower)
          );
        }

        // Aplicar filtro de precio
        if (filter.minPrice !== null) {
          filtered = filtered.filter(
            (product) => product.price >= (filter.minPrice || 0)
          );
        }

        if (filter.maxPrice !== null) {
          filtered = filtered.filter(
            (product) => product.price <= (filter.maxPrice || Infinity)
          );
        }

        // Aplicar ordenamiento con límite de tiempo
        switch (filter.sort) {
          case "price_asc":
            filtered.sort((a, b) => a.price - b.price);
            break;
          case "price_desc":
            filtered.sort((a, b) => b.price - a.price);
            break;
          case "popularity":
            filtered.sort(
              (a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0)
            );
            break;
          case "position":
          default:
            filtered.sort((a, b) => (a.position || 999) - (b.position || 999));
            break;
        }

        // Calcular total de páginas (50 productos por página)
        const pageSize = 50;
        const totalItems = filtered.length;
        const pages = Math.max(1, Math.ceil(totalItems / pageSize));
        setTotalPages(pages);

        // Aplicar paginación
        const start = (filter.page - 1) * pageSize;
        const paginatedProducts = filtered.slice(start, start + pageSize);

        console.log(
          `Filtrado completo: ${paginatedProducts.length} productos en la página actual`
        );
        setFilteredProducts(paginatedProducts);
      } catch (error) {
        console.error("Error aplicando filtros:", error);
        // En caso de error, mostrar al menos algunos productos si hay disponibles
        const someProducts =
          scrapingResult.data[0]?.products.slice(0, 10) || [];
        setFilteredProducts(someProducts);
        setTotalPages(1);
      }
    }, 50); // Pequeño retraso para no bloquear la UI

    return () => clearTimeout(timeoutId);
  }, [scrapingResult, filter]);

  // Función para refrescar los datos manualmente
  const refreshData = async () => {
    await fetchData();
    await checkUpdateStatus();
  };

  // Extraer las categorías del resultado
  const categories = scrapingResult?.data || [];

  // Obtener todos los productos (sin filtrar)
  const products = scrapingResult
    ? scrapingResult.data.flatMap((category) => category.products)
    : [];

  const contextValue: ProductContextType = {
    products,
    categories,
    isLoading,
    error,
    filter,
    setFilter: updateFilter,
    filteredProducts,
    totalPages,
    updateStatus,
    refreshData,
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};
