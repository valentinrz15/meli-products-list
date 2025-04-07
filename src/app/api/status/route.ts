import {
  checkBackgroundUpdateStatus,
  forceBackgroundUpdate,
  resumeBackgroundUpdate,
} from "@/app/scrapers/enhanced-scraper";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const status = await checkBackgroundUpdateStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error al obtener estado de actualización:", error);
    return NextResponse.json(
      { error: "Error al verificar el estado de actualización" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, fromId } = body;

    if (action === "force") {
      const result = await forceBackgroundUpdate();
      return NextResponse.json({ success: result });
    }

    if (action === "resume" && typeof fromId === "number") {
      const result = await resumeBackgroundUpdate(fromId);
      return NextResponse.json({ success: result });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error al iniciar actualización en segundo plano:", error);
    return NextResponse.json(
      { error: "Error al iniciar la actualización" },
      { status: 500 }
    );
  }
}
