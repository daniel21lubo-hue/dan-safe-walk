import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://www.oref.org.il/WarningMessages/alert/alerts.json",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json, text/plain, */*",
          Referer: "https://www.oref.org.il/",
          "X-Requested-With": "XMLHttpRequest",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Live alerts request failed with ${response.status}` },
        { status: response.status }
      );
    }

    const text = await response.text();

    if (!text || !text.trim()) {
      return new NextResponse("", {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch live alerts" },
      { status: 500 }
    );
  }
}