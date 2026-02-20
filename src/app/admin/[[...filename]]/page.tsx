import { NextRequest, NextResponse } from "next/server";

/**
 * TinaCMS Local GraphQL Proxy
 * Proxies Next.js requests → Tina GraphQL Dev Server
 */

const TINA_GQL_URL = "http://localhost:4001/graphql";

export async function POST(request: NextRequest) {
  try {
    // Always resolve to a valid string (prevents undici crash)
    const body = (await request.text()) || "{}";

    const response = await fetch(TINA_GQL_URL, {
      method: "POST",
      headers: {
        // Forward original content-type when available
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
      },
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("TinaCMS API Error:", error);

    return NextResponse.json(
      {
        error: "TinaCMS server not running",
        fix: "Start Tina with: npx tinacms dev",
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "TinaCMS GraphQL Proxy Active",
    graphql: TINA_GQL_URL,
  });
}
