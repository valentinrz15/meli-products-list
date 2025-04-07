"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Inter } from "next/font/google";
import {
  ReactNode,
  useState,
  useMemo,
  createContext,
  useContext,
  useEffect,
  FunctionComponent,
} from "react";
import useMediaQuery from "@mui/material/useMediaQuery";

const inter = Inter({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export type ColorMode = "light" | "dark";

interface ThemeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext debe ser usado dentro de ThemeRegistry");
  }
  return context;
};

export const ThemeRegistry: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ColorMode>("light");

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);
        localStorage.setItem("theme-mode", newMode);
      },
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? "#2D3277" : "#4F5BD5",
          },
          secondary: {
            main: "#FFD100",
          },
          background: {
            default: mode === "light" ? "#f5f5f5" : "#121212",
            paper: mode === "light" ? "#ffffff" : "#1e1e1e",
          },
        },
        typography: {
          fontFamily: inter.style.fontFamily,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: "8px",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                "&:hover": {
                  boxShadow:
                    mode === "light"
                      ? "0 8px 16px rgba(0, 0, 0, 0.1)"
                      : "0 8px 16px rgba(0, 0, 0, 0.4)",
                  transform: "translateY(-4px)",
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 500,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: "6px",
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                "&.Mui-selected": {
                  backgroundColor: mode === "light" ? "#2D3277" : "#4F5BD5",
                  color: "white",
                  "&:hover": {
                    backgroundColor: mode === "light" ? "#232861" : "#3F49AB",
                  },
                },
              },
            },
          },
        },
      }),
    [mode, inter.style.fontFamily]
  );

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem("theme-mode") as ColorMode | null;
    if (savedMode) {
      setMode(savedMode);
    } else {
      setMode(prefersDarkMode ? "dark" : "light");
    }
  }, [prefersDarkMode]);

  if (!mounted) {
    return <div style={{ visibility: "hidden" }} />;
  }

  return (
    <ThemeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
