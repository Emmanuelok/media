import { NextRequest, NextResponse } from "next/server";
import { radioBrowserFetch } from "@/lib/radio";

const ALLOWED_RADIO_PATH =
  /^\/json\/stations\/(?:topclick\/\d+|bytagexact\/[^?]+|bycountrycodeexact\/[^?]+|search|byuuid\/[^?]+)(?:\?.*)?$/;

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") || "";
  if (
    !path ||
    path.length > 1600 ||
    path.includes("\r") ||
    path.includes("\n") ||
    !ALLOWED_RADIO_PATH.test(path)
  ) {
    return NextResponse.json({ error: "Unsupported radio query." }, { status: 400 });
  }

  try {
    const data = await radioBrowserFetch<unknown>(path);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "The radio directory is temporarily unavailable." },
      { status: 503 },
    );
  }
}
