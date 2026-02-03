import { NextRequest, NextResponse } from "next/server";
import { createLemonCheckout } from "@/lib/lemon";

/**
 * Generate Lemon Checkout URL for a deal.
 * 
 * POST /api/deals/[id]/checkout
 * 
 * Request Body (optional):
 * {
 *   milestoneId?: string
 * }
 * 
 * Success Response (200):
 * {
 *   checkoutUrl: string
 * }
 * 
 * Error Response (500):
 * {
 *   error: string,
 *   requestId: string
 * }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  
  try {
    // Extract dealId from URL params
    const { id: dealId } = await context.params;
    
    if (!dealId) {
      return NextResponse.json(
        { error: "dealId is required", requestId },
        { status: 400 }
      );
    }
    
    // Extract milestoneId from request body (optional)
    let milestoneId: string | undefined;
    try {
      const body = await request.json();
      milestoneId = body.milestoneId;
    } catch {
      // Request body가 없거나 JSON이 아닌 경우 무시 (정상)
    }
    
    console.log(`[${requestId}] Checkout request: dealId=${dealId}, milestoneId=${milestoneId || "none"}`);
    
    const url = await createLemonCheckout(dealId, milestoneId);
    
    console.log(`[${requestId}] Checkout URL generated successfully`);
    return NextResponse.json({ checkoutUrl: url });
  } catch (e: any) {
    console.error(`[${requestId}] Checkout generation failed:`, e);
    return NextResponse.json(
      { 
        error: e.message || "Failed to generate checkout URL",
        requestId 
      },
      { status: 500 }
    );
  }
}
