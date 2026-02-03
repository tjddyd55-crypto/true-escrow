import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export async function GET(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const { dealId } = params
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/escrow/payment/${dealId}`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment info' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const userId = request.headers.get('X-User-Id')
  const { dealId } = params
  
  try {
    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/api/escrow/payment/${dealId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId || '',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update payment info' },
      { status: 500 }
    )
  }
}
