"use client";

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Box,
  Button,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useProducts } from "../context/hooks/useProducts.hook";
import { Loader } from "../components/Loader";
import { StatusBadge } from "../components/StatusBadge";
import { SearchBar } from "../components/SearchBar";
import { ThemeToggle } from "../components/ThemeToggle";
import { CategorySidebar } from "../components/CategorySideBar";
import { FilterSection } from "../components/FilterSection";
import { ProductGrid } from "../components/ProductGrid";

export default function Dashboard() {
  const { isLoading, updateStatus, refreshData } = useProducts();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {!isLoading && <StatusBadge status={updateStatus} />}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            MercadoLibre Productos
          </Typography>
          {!isMobile && <SearchBar />}
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      {isMobile && (
        <Box sx={{ py: 2, px: 2, backgroundColor: "background.paper" }}>
          <SearchBar />
        </Box>
      )}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3, lg: 2.5 }}>
            <Box
              sx={{
                position: { md: "sticky" },
                top: { md: 24 },
                height: { md: "calc(100vh - 140px)" },
                overflowY: { md: "auto" },
                pb: { md: 4 },
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {!isLoading && (
                <>
                  <CategorySidebar />
                  <FilterSection />
                  <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="medium"
                      gutterBottom
                    >
                      Actualización
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Buscar nuevos productos y categorías manualmente.
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={refreshData}
                      startIcon={<RefreshIcon />}
                      disabled={updateStatus?.inProgress}
                    >
                      {updateStatus?.inProgress ? (
                        <>
                          <CircularProgress
                            size={20}
                            color="inherit"
                            sx={{ mr: 1 }}
                          />
                          Actualizando...
                        </>
                      ) : (
                        "Actualizar datos"
                      )}
                    </Button>
                  </Paper>
                </>
              )}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>
            {isLoading ? <Loader /> : <ProductGrid />}
          </Grid>
        </Grid>
      </Container>
      <Box
        component="footer"
        sx={{
          py: 2,
          mt: "auto",
          backgroundColor:
            theme.palette.mode === "dark"
              ? "rgba(0, 0, 0, 0.3)"
              : "rgba(0, 0, 0, 0.05)",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} MercadoLibre Productos
        </Typography>
      </Box>
    </Box>
  );
}
