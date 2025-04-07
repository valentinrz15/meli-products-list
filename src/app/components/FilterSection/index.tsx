"use client";

import { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Stack, 
  TextField, 
  Button, 
  Box, 
  Divider 
} from '@mui/material';
import { FilterAlt as FilterIcon, RestartAlt as ResetIcon } from '@mui/icons-material';
import { useProducts } from "@/app/context/hooks/useProducts.hook";

export const FilterSection = () => {
  const { filter, setFilter, products } = useProducts();
  const [minPrice, setMinPrice] = useState<string>(filter.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState<string>(filter.maxPrice?.toString() || '');

  // Calcular el rango de precios disponible
  useEffect(() => {
    if (products.length > 0 && (!minPrice && !maxPrice)) {
      // Tomar solo una muestra de productos para evitar sobrecarga (hasta 500)
      const sampleProducts = products.slice(0, 500);
      const prices = sampleProducts.map(p => p.price).filter(p => p > 0);
      
      if (prices.length > 0) {
        const min = Math.floor(Math.min(...prices));
        const max = Math.ceil(Math.max(...prices));
        
        // No actualizar estado si ya tenemos los valores
        if (min === Number(minPrice) && max === Number(maxPrice)) {
          return;
        }
        
        setMinPrice('');
        setMaxPrice('');
      }
    }
  }, [products]);

  // Manejar cambios en el ordenamiento
  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilter({ sort: event.target.value as any });
  };

  // Aplicar filtro de precio
  const applyPriceFilter = () => {
    setFilter({
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null
    });
  };

  // Limpiar filtros
  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setFilter({
      search: '',
      category: '',
      minPrice: null,
      maxPrice: null,
      sort: 'position'
    });
  };

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Box p={2}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Filtros
        </Typography>
      </Box>
      
      <Divider />
      
      <Box p={2}>
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 3 }}>
          <InputLabel id="sort-select-label">Ordenar por</InputLabel>
          <Select
            labelId="sort-select-label"
            value={filter.sort}
            onChange={handleSortChange as any}
            label="Ordenar por"
          >
            <MenuItem value="position">Más vendidos</MenuItem>
            <MenuItem value="popularity">Popularidad</MenuItem>
            <MenuItem value="price_asc">Precio: menor a mayor</MenuItem>
            <MenuItem value="price_desc">Precio: mayor a menor</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle2" gutterBottom>
          Rango de precio
        </Typography>
        
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            inputProps={{ min: 0 }}
          />
          <Typography variant="body2" color="text.secondary">-</Typography>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            fullWidth
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </Stack>
        
        <Button
          variant="contained"
          fullWidth
          onClick={applyPriceFilter}
          startIcon={<FilterIcon />}
          sx={{ mb: 2 }}
        >
          Aplicar filtros
        </Button>
        
        <Button
          variant="outlined"
          fullWidth
          onClick={clearFilters}
          startIcon={<ResetIcon />}
        >
          Limpiar filtros
        </Button>
      </Box>
    </Paper>
  );
};
