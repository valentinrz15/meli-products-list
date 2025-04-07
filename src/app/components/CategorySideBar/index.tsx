"use client";

import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItemButton, 
  ListItemText, 
  Chip, 
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useProducts } from "@/app/context/hooks/useProducts.hook";

export const CategorySidebar = () => {
  const { categories, filter, setFilter } = useProducts();
  const [categorySearch, setCategorySearch] = useState('');
  
  // Limitar a 100 categorías para mejorar rendimiento
  const limitedCategories = categories.slice(0, 100);
  
  // Filtrar y ordenar categorías por nombre
  const filteredCategories = limitedCategories
    .filter(cat => cat.name.toLowerCase().includes(categorySearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Cambiar la categoría seleccionada
  const handleCategoryClick = (categoryId: string) => {
    setFilter({ category: categoryId === filter.category ? '' : categoryId });
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2, 
        overflow: 'hidden' 
      }}
    >
      <Box p={2}>
        <Typography 
          variant="h6" 
          fontWeight="medium" 
          gutterBottom
        >
          Categorías
        </Typography>
      </Box>
      <Divider />
      <List
        component="nav"
        sx={{
          maxHeight: '70vh',
          overflow: 'auto',
          p: 0,
        }}
      >
        <ListItemButton
          selected={filter.category === ''}
          onClick={() => setFilter({ category: '' })}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          }}
        >
          <ListItemText primary="Todas las categorías" />
        </ListItemButton>
        
        <Divider />
        
        {filteredCategories.map((category) => (
          <ListItemButton
            key={category.id}
            selected={filter.category === category.id}
            onClick={() => handleCategoryClick(category.id)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiChip-root': {
                  backgroundColor: 'white',
                  color: 'primary.main',
                }
              },
            }}
          >
            <ListItemText 
              primary={category.name}
              primaryTypographyProps={{
                noWrap: true,
                title: category.name
              }}
            />
            <Chip
              label={category.productCount}
              size="small"
              sx={{
                minWidth: 30,
                height: 24,
                fontSize: '0.75rem',
                ml: 1
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
};
