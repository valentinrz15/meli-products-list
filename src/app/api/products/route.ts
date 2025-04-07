import { ScrapingResult } from "@/app/lib/types";
import { scrapeML } from "@/app/scrapers/enhanced-scraper";
import { loadFromCache } from "@/app/scrapers/utils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cachedData = await loadFromCache();

    if (!cachedData) {
      return NextResponse.json(cachedData);
    }

    const initialData: ScrapingResult = {
      timestamp: new Date().toISOString(),
      totalCategories: 0,
      categoriesWithProducts: 0,
      totalProducts: 0,
      executionTimeMs: 0,
      data: [],
      scrapingInProgress: true,
    };

    scrapeML().catch((err) => {
      console.error("Error durante el scraping inicial:", err);
    });

    return NextResponse.json(initialData);
  } catch (error) {
    console.error("Error en API de productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
