'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PaymentRequestCard from './PaymentRequestCard'

interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  content: string
  type: string
  createdAt: string
  readAt: string | null
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
    
    if (storedUserId && roomId) {
      fetchMessages()
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [roomId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    if (!userId || !roomId) return
    
    try {
      const response = await fetch(`/api/escrow/chat/rooms/${roomId}/messages`, {
        headers: {
          'X-User-Id': userId,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.data || [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !roomId) return
    
    try {
      const response = await fetch(`/api/escrow/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      })
      
      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading messages...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please set your user ID to view messages.</p>
      </div>
    )
  }

  const [chatRoom, setChatRoom] = useState<{ buyerId: string; sellerId: string; dealId: string | null } | null>(null)

  useEffect(() => {
    if (userId && roomId) {
      fetch(`/api/escrow/chat/rooms/${roomId}`, {
        headers: { 'X-User-Id': userId },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setChatRoom(data.data)
          }
        })
        .catch(console.error)
    }
  }, [userId, roomId])

  const isSeller = chatRoom && userId && chatRoom.sellerId === userId
  const isBuyer = chatRoom && userId && chatRoom.buyerId === userId
  const showEscrowButton = userId && !isSeller && chatRoom?.dealId // 본인 매물 아님, 거래 미완료

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: '800px', margin: '0 auto' }}>
      {/* Sticky Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        backgroundColor: '#fff',
        zIndex: 10,
      }}>
        <button onClick={() => router.push('/chat')} style={{ marginBottom: '8px' }}>
          ← 뒤로
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 600 }}>채팅방</h1>
          {showEscrowButton && (
            <button
              onClick={() => router.push(`/chat/${roomId}/escrow-payment`)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              에스크로 결제
            </button>
          )}
        </div>
      </div>
      
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((message) => {
          const isOwnMessage = message.senderId === userId
          const isSystem = message.type === 'SYSTEM'
          const isPaymentRequest = message.type === 'PAYMENT_REQUEST'
          
          // Payment Request Card
          if (isPaymentRequest) {
            try {
              const paymentData = JSON.parse(message.content)
              return (
                <PaymentRequestCard
                  key={message.id}
                  paymentData={paymentData}
                  isBuyer={isBuyer || false}
                  isSeller={isSeller || false}
                  userId={userId || ''}
                  roomId={roomId}
                  onUpdate={fetchMessages}
                />
              )
            } catch (e) {
              // Fallback to regular message if JSON parse fails
            }
          }
          
          return (
            <div
              key={message.id}
              style={{
                alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                maxWidth: '70%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isSystem
                  ? '#f3f4f6'
                  : isOwnMessage
                  ? '#2563eb'
                  : '#e5e7eb',
                color: isSystem
                  ? '#6b7280'
                  : isOwnMessage
                  ? '#fff'
                  : '#111827',
              }}
            >
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                {isSystem ? 'System' : isOwnMessage ? 'You' : 'Other'}
              </div>
              <div>{message.content}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage()
            }
          }}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
            opacity: newMessage.trim() ? 1 : 0.5,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
