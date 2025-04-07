import { useContext } from "react";
import { ProductContext } from "../ProductContext";

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts debe usarse dentro de un ProductProvider");
  }
  return context;
};
