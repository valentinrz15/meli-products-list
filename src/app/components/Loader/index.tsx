"use client";
import React, { memo } from "react";
import { Box, Typography, CircularProgress, Paper } from "@mui/material";

export const Loader = memo(() => (
  <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
    <CircularProgress size={40} />
    <Typography variant="body1" sx={{ mt: 2 }}>
      Cargando productos...
    </Typography>
  </Paper>
));

Loader.displayName = "Loader";
