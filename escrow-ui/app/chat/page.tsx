'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ChatRoom {
  id: string
  dealId: string
  buyerId: string
  sellerId: string
  status: string
  createdAt: string
  lastMessageAt: string | null
  unreadCount: number
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID from localStorage or context
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
    
    if (storedUserId) {
      fetchChatRooms(storedUserId)
    }
  }, [])

  const fetchChatRooms = async (uid: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/escrow/chat/rooms', {
        headers: {
          'X-User-Id': uid,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRooms(data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading chat rooms...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please set your user ID to view chat rooms.</p>
        <input
          type="text"
          placeholder="Enter User ID"
          onBlur={(e) => {
            const uid = e.target.value
            if (uid) {
              localStorage.setItem('userId', uid)
              setUserId(uid)
              fetchChatRooms(uid)
            }
          }}
          style={{ padding: '8px', marginTop: '10px' }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Chat Rooms</h1>
      
      {rooms.length === 0 ? (
        <p>No chat rooms found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/chat/${room.id}`}
              style={{
                display: 'block',
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'inherit',
                backgroundColor: room.unreadCount > 0 ? '#f0f9ff' : '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    Deal: {room.dealId.substring(0, 8)}...
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {room.lastMessageAt
                      ? `Last message: ${new Date(room.lastMessageAt).toLocaleString()}`
                      : 'No messages yet'}
                  </div>
                </div>
                {room.unreadCount > 0 && (
                  <div
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {room.unreadCount}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
