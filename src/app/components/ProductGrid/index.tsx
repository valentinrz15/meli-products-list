"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Grid,
  Paper,
  Skeleton,
} from "@mui/material";
import { ProductCard } from "../ProductCard";
import { Pagination } from "../Pagination";
import { useProducts } from "@/app/context/hooks/useProducts.hook";

export const ProductGrid = () => {
  const { filteredProducts, isLoading, filter, totalPages } = useProducts();
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setColumns(1);
      } else if (width < 960) {
        setColumns(2);
      } else if (width < 1280) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            backgroundColor: "background.paper",
          }}
        >
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="text" width="30%" height={20} />
        </Paper>

        <Grid container spacing={2}>
          {Array.from(new Array(8)).map((_, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Skeleton variant="rectangular" height={180} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" sx={{ mt: 2 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // Mensaje cuando no hay productos
  if (!isLoading && filteredProducts.length === 0) {
    return (
      <Alert
        severity="info"
        sx={{
          p: 4,
          borderRadius: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AlertTitle>No se encontraron productos</AlertTitle>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Intenta cambiar tus filtros o realizar otra búsqueda.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Encabezado de la sección */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h6" component="h2">
          {filter.category
            ? "Productos en esta categoría"
            : "Todos los productos"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {`Mostrando ${filteredProducts.length} producto${
            filteredProducts.length !== 1 ? "s" : ""
          }`}
        </Typography>
      </Paper>

      <Grid container spacing={2}>
        {filteredProducts.slice(0, 50).map((product) => (
          <Grid
            size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
            key={`${product.id}-${product.categoryId}`}
          >
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      {totalPages > 1 && (
        <Pagination currentPage={filter.page} totalPages={totalPages} />
      )}
    </Box>
  );
};
