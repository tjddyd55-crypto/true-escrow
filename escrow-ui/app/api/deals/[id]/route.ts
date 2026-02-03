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
    // Proxy to backend API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const backendUrl = `${apiBaseUrl}/api/deals/${id}`;
    
    console.log("Backend URL:", backendUrl);
    console.log("Fetching from backend...");
    
    const res = await fetch(backendUrl, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    console.log("Backend response status:", res.status);
    
    if (!res.ok) {
      console.error("===== STEP 3: BACKEND API ERROR =====");
      console.error("Status:", res.status);
      return NextResponse.json(
        { error: `Backend API error: ${res.status}` },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    console.log("Backend response data:", JSON.stringify(data, null, 2));
    
    // Extract milestones from response
    // Backend returns: { data: { milestones: [...] } }
    const milestones = data.data?.milestones || [];
    console.log("Extracted milestones:", milestones.length);
    milestones.forEach((m: any, idx: number) => {
      console.log(`  Milestone ${idx + 1}: id=${m.id}, status=${m.status}`);
    });
    
    // Format response for frontend
    const formattedMilestones = milestones.map((m: any) => ({
      id: m.id || "deposit",
      title: m.id === "deposit" ? "Deposit" : m.id,
      amount: 100000, // Default amount (can be enhanced later)
      currency: "USD",
      status: m.status || "PENDING",
    }));
    
    console.log("Formatted milestones:", formattedMilestones);
    console.log("===== STEP 3: FRONTEND DEAL QUERY API SUCCESS =====");
    
    return NextResponse.json({
      id: data.data?.id || id,
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
