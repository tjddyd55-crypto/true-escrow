import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/deals/[id]
 * Proxy to backend API and add milestone status from escrow state.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  try {
    // Proxy to backend API
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    const backendUrl = `${apiBaseUrl}/api/deals/${id}`;
    
    const res = await fetch(backendUrl, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend API error: ${res.status}` },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    
    // Extract milestones from response
    // Backend returns: { data: { milestones: [...] } }
    const milestones = data.data?.milestones || [];
    
    // Format response for frontend
    return NextResponse.json({
      id: data.data?.id || id,
      milestones: milestones.map((m: any) => ({
        id: m.id || "deposit",
        title: m.id === "deposit" ? "Deposit" : m.id,
        amount: 100000, // Default amount (can be enhanced later)
        currency: "USD",
        status: m.status || "PENDING",
      })),
    });
  } catch (error: any) {
    console.error("Error fetching deal:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch deal" },
      { status: 500 }
    );
  }
}
