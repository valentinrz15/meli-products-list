"use client";

import { FunctionComponent } from "react";
import { Card, CardContent, CardMedia, Typography, Box, Chip, Rating } from '@mui/material';
import { ProductCardProps } from "./interfaces";

export const ProductCard: FunctionComponent<ProductCardProps> = ({
  product,
}) => {
 // Formatear precio en pesos argentinos
 const formattedPrice = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0
}).format(product.price);

// Imagen por defecto si no hay imagen disponible
const imageUrl = product.image || '/placeholder-product.png';

return (
  <Card 
    component="a"
    href={product.link}
    target="_blank"
    rel="noopener noreferrer"
    sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      textDecoration: 'none',
      cursor: 'pointer',
      transition: 'transform 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)'
      }
    }}
  >
    <Box position="relative">
      {product.position && (
        <Chip
          label={`#${product.position}`}
          size="small"
          color="primary"
          sx={{ 
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1
          }}
        />
      )}
      <CardMedia
        component="img"
        height="180"
        image={imageUrl}
        alt={product.name}
        sx={{ 
          objectFit: 'contain',
          backgroundColor: '#f5f5f5'
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = '/placeholder-product.png';
        }}
      />
    </Box>

    <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {product.category}
      </Typography>
      
      <Typography 
        variant="subtitle1" 
        component="h3" 
        sx={{ 
          fontWeight: 500,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          height: 48,
          mb: 1
        }}
      >
        {product.name}
      </Typography>
      
      <Typography 
        variant="h6" 
        color="primary" 
        sx={{ fontWeight: 700, my: 1 }}
      >
        {formattedPrice}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {product.condition || 'Nuevo'}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '50%' }}>
          {product.seller?.name || 'MercadoLibre'}
        </Typography>
      </Box>
      {(product.rating || product.reviewsCount) && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          {product.rating && (
            <Rating 
              value={parseFloat(product.rating)} 
              precision={0.5} 
              size="small" 
              readOnly 
            />
          )}
          {product.reviewsCount && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              ({product.reviewsCount})
            </Typography>
          )}
        </Box>
      )}
    </CardContent>
  </Card>
);
};
