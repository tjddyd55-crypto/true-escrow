import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const userId = request.headers.get('X-User-Id')
  const { roomId } = await params
  
  if (!userId) {
    return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
  }
  
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/api/escrow/chat/rooms/${roomId}/payment-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create payment request' },
      { status: 500 }
    )
  }
}
