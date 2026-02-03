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
  
  // STEP 1: API Key 존재 여부만 확인 (prefix 검사 제거)
  const lemonKey = process.env.LEMON_API_KEY;
  const lemonKeyPresent = lemonKey != null && lemonKey.trim().length > 0;
  // Prefix 정보는 보안상 노출하지 않음 (JWT format)
  const lemonKeyPrefix: string | null = lemonKeyPresent ? "JWT" : null;
  
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
