"use client";

import { FunctionComponent } from "react";
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { StatusBadgeProps } from "./interfaces";

export const StatusBadge: FunctionComponent<StatusBadgeProps> = ({
  status,
}) => {
  if (!status) return null;

  if (status.inProgress) {
    return (
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: "flex",
          alignItems: "center",
          p: 2,
          borderRadius: 2,
          backgroundColor: "primary.main",
          color: "white",
          zIndex: 1000,
        }}
      >
        <CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />
        <Box>
          <Typography variant="body2" fontWeight="medium">
            Buscando nuevos productos
          </Typography>
          {status.progress !== undefined && (
            <Typography variant="caption">
              {status.progress}% completado
            </Typography>
          )}
        </Box>
      </Paper>
    );
  }

  if (status.complete) {
    return (
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          p: 2,
          borderRadius: 2,
          backgroundColor: "success.main",
          color: "white",
          zIndex: 1000,
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          Base actualizada: {status.categoriesFound} categorías encontradas
        </Typography>
      </Paper>
    );
  }

  return null;
};
