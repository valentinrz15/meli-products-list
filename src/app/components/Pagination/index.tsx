"use client";

import { FunctionComponent } from "react";
import { Pagination as MuiPagination, PaginationItem, Box } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { PaginationProps } from "./interfaces";
import { useProducts } from "@/app/context/hooks/useProducts.hook";

export const Pagination: FunctionComponent<PaginationProps> = ({
  currentPage,
  totalPages,
}) => {
  const { setFilter } = useProducts();

  // Cambiar a la página especificada
  const handleChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (page >= 1 && page <= totalPages) {
      setFilter({ page });
      
      // Hacer scroll hacia arriba para una mejor experiencia
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
      <MuiPagination
        count={totalPages}
        page={currentPage}
        onChange={handleChange}
        color="primary"
        shape="rounded"
        showFirstButton
        showLastButton
        siblingCount={1}
        boundaryCount={1}
        renderItem={(item) => (
          <PaginationItem
            slots={{ previous: ChevronLeft, next: ChevronRight }}
            {...item}
          />
        )}
      />
    </Box>
  );
};
