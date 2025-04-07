"use client";
import { useState, useEffect } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { Search as SearchIcon, Clear as ClearIcon } from "@mui/icons-material";
import { useProducts } from "@/app/context/hooks/useProducts.hook";
import { useDebounce } from "@/app/lib/hooks/useDebounce";

export const SearchBar = () => {
  const { filter, setFilter } = useProducts();
  const [searchTerm, setSearchTerm] = useState(filter.search);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Actualizar el filtro cuando el término debounced cambie
  useEffect(() => {
    if (debouncedSearchTerm !== filter.search) {
      setFilter({ search: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm, setFilter, filter.search]);

  const handleClear = () => {
    setSearchTerm("");
  };

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Buscar productos..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      sx={{
        maxWidth: 500,
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: searchTerm && (
          <InputAdornment position="end">
            <IconButton
              edge="end"
              onClick={handleClear}
              size="small"
              aria-label="clear search"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};
