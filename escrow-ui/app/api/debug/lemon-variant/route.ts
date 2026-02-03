import { NextRequest, NextResponse } from "next/server";

/**
 * Dev-only helper to verify variant → store relationship.
 * 
 * GET /api/debug/lemon-variant?variantId=1270810
 * 
 * This endpoint should be disabled in production or protected by authentication.
 */
export async function GET(request: NextRequest) {
  // Only allow in development or with explicit flag
  const isDev = process.env.NODE_ENV === "development" || 
                process.env.ENABLE_LEMON_DEBUG === "true";
  
  if (!isDev) {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }
  
  const searchParams = request.nextUrl.searchParams;
  const variantId = searchParams.get("variantId");
  
  if (!variantId) {
    return NextResponse.json(
      { error: "variantId query parameter is required" },
      { status: 400 }
    );
  }
  
  const apiKey = (process.env.LEMON_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "LEMON_API_KEY not configured" },
      { status: 500 }
    );
  }
  
  try {
    const res = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
    });
    
    const text = await res.text();
    
    if (!res.ok) {
      return NextResponse.json(
        { 
          error: `Lemon API error (${res.status})`,
          response: text 
        },
        { status: res.status }
      );
    }
    
    const json = JSON.parse(text);
    const storeId = json.data?.relationships?.store?.data?.id;
    
    return NextResponse.json({
      variantId,
      storeId,
      expectedStoreId: process.env.LEMON_STORE_ID,
      match: storeId === process.env.LEMON_STORE_ID,
      fullResponse: json,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
