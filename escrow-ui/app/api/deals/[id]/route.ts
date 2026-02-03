import { NextRequest, NextResponse } from "next/server";

/**
 * STEP 3: GET /api/deals/[id]
 * Proxy to backend API and add milestone status from escrow state.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  console.log("===== STEP 3: FRONTEND DEAL QUERY API START =====");
  console.log("Deal ID:", id);
  
  try {
    // Try to fetch milestone status from backend (for demo deals, this may fail)
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const backendUrl = `${apiBaseUrl}/api/deals/${id}`;
    
    console.log("Backend URL:", backendUrl);
    console.log("Fetching from backend...");
    
    let milestones: any[] = [];
    let backendSuccess = false;
    
    try {
      const res = await fetch(backendUrl, {
        headers: {
          "Accept": "application/json",
        },
      });
      
      console.log("Backend response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Backend response data:", JSON.stringify(data, null, 2));
        
        // Extract milestones from response
        // Backend returns: { data: { milestones: [...] } }
        milestones = data.data?.milestones || [];
        backendSuccess = true;
        console.log("Extracted milestones from backend:", milestones.length);
        milestones.forEach((m: any, idx: number) => {
          console.log(`  Milestone ${idx + 1}: id=${m.id}, status=${m.status}`);
        });
      } else {
        console.warn("Backend API returned error status:", res.status);
        // For demo deals (non-UUID), continue with default milestones
        if (res.status === 400) {
          console.log("Assuming demo deal (non-UUID format), using default milestones");
        }
      }
    } catch (backendError: any) {
      console.warn("Backend API call failed:", backendError.message);
      console.log("Continuing with default milestones for demo deal");
    }
    
    // If backend didn't return milestones, use default for demo deals
    if (!backendSuccess || milestones.length === 0) {
      console.log("Using default milestone for demo deal");
      milestones = [
        {
          id: "deposit",
          status: "PENDING", // Default status, will be updated by webhook
        }
      ];
    }
    
    // STEP 3: Format response for frontend with payment details
    const formattedMilestones = milestones.map((m: any) => ({
      id: m.id || "deposit",
      title: m.id === "deposit" ? "Deposit" : m.id,
      amount: m.amount || 100000, // Use amount from backend if available
      currency: m.currency || "USD",
      status: m.status || "PENDING",
      orderId: m.orderId || null, // STEP 3: Lemon Squeezy order ID
      paidAt: m.paidAt || null, // STEP 3: Payment timestamp
    }));
    
    console.log("Formatted milestones:", formattedMilestones);
    console.log("===== STEP 3: FRONTEND DEAL QUERY API SUCCESS =====");
    
    return NextResponse.json({
      id: id,
      milestones: formattedMilestones,
    });
  } catch (error: any) {
    console.error("===== STEP 3: FRONTEND DEAL QUERY API ERROR =====");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to fetch deal" },
      { status: 500 }
    );
  }
}
