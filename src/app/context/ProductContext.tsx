
import { createContext } from "react";
import { ProductContextType } from "./ProductContext.types";

export const ProductContext = createContext<ProductContextType | undefined>(
  undefined
);
