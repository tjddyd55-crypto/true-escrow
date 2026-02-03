import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const userId = request.headers.get('X-User-Id')
  const { roomId } = params
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/escrow/chat/rooms/${roomId}`, {
      headers: {
        'X-User-Id': userId || '',
      },
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat room' },
      { status: 500 }
    )
  }
}
