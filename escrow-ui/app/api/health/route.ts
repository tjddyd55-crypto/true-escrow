import { NextResponse } from "next/server";

/**
 * Health check endpoint for deployment verification.
 * Returns build fingerprint and environment status.
 */
export async function GET() {
  const commitSha = process.env.RAILWAY_GIT_COMMIT_SHA || 
                    process.env.VERCEL_GIT_COMMIT_SHA || 
                    "unknown";
  
  const buildTime = process.env.BUILD_TIME || "unknown";
  
  const lemonStoreIdPresent = !!process.env.LEMON_STORE_ID;
  const lemonVariantIdPresent = !!process.env.LEMON_VARIANT_ID;
  
  // API Key prefix only (never full key)
  // Extract prefix safely: sk_test_ (8 chars) or sk_live_ (8 chars)
  const lemonKey = process.env.LEMON_API_KEY;
  let lemonKeyPrefix: string | null = null;
  if (lemonKey) {
    const trimmed = lemonKey.trim();
    if (trimmed.startsWith("sk_test_")) {
      lemonKeyPrefix = "sk_test_";
    } else if (trimmed.startsWith("sk_live_")) {
      lemonKeyPrefix = "sk_live_";
    } else if (trimmed.length > 0) {
      // Unknown format - show first 7 chars only for safety
      lemonKeyPrefix = trimmed.slice(0, 7) + "...";
    }
  }
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? null;
  
  return NextResponse.json({
    commitSha,
    buildTime,
    lemonStoreIdPresent,
    lemonVariantIdPresent,
    lemonKeyPrefix,
    apiBaseUrl,
    timestamp: new Date().toISOString(),
  });
}
