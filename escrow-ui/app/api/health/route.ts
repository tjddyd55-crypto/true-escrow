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
  const lemonKey = process.env.LEMON_API_KEY;
  const lemonKeyPrefix = lemonKey ? lemonKey.slice(0, 7) : null;
  
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
