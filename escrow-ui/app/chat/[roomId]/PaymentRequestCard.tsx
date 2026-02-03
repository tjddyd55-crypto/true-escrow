'use client'

import { useState } from 'react'

interface PaymentRequestCardProps {
  paymentData: {
    itemName: string
    amount: number
    currency: string
    paymentType: string
    milestones?: Array<{ title: string; amount: number; orderIndex: number }>
  }
  isBuyer: boolean
  isSeller: boolean
  userId: string
  roomId: string
  onUpdate: () => void
}

export default function PaymentRequestCard({
  paymentData,
  isBuyer,
  isSeller,
  userId,
  roomId,
  onUpdate,
}: PaymentRequestCardProps) {
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'COMPLETED'>('PENDING')
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      // TODO: 실제 결제 처리 API 호출
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setStatus('PAID')
      // Send system message
      await fetch(`/api/escrow/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          content: '구매자가 결제를 완료했습니다. 결제 금액은 플랫폼에서 보관 중입니다.',
          type: 'SYSTEM',
        }),
      })
      onUpdate()
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRequest = async () => {
    setLoading(true)
    try {
      await fetch(`/api/escrow/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          content: '판매자가 거래 완료를 요청했습니다.',
          type: 'SYSTEM',
        }),
      })
      onUpdate()
    } catch (error) {
      console.error('Complete request failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmComplete = async () => {
    setLoading(true)
    try {
      setStatus('COMPLETED')
      await fetch(`/api/escrow/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          content: '거래가 완료되었습니다. 결제 금액이 판매자에게 지급되었습니다.',
          type: 'SYSTEM',
        }),
      })
      onUpdate()
    } catch (error) {
      console.error('Confirm complete failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '12px auto',
      padding: '16px',
      border: '2px solid #2563eb',
      borderRadius: '12px',
      backgroundColor: '#fff',
    }}>
      <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
        에스크로 결제 {status === 'PENDING' ? '요청' : ''}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>금액:</strong> {paymentData.amount.toLocaleString()} {paymentData.currency}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>결제 방식:</strong> {paymentData.paymentType === 'FULL' ? '전체 금액' : '마일스톤 분할'}
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <strong>상태:</strong>{' '}
        {status === 'PENDING' && '결제 대기중'}
        {status === 'PAID' && '보관중 (HOLD)'}
        {status === 'COMPLETED' && '거래 완료'}
      </div>

      {status === 'PENDING' && isBuyer && (
        <button
          onClick={handlePayment}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '처리 중...' : '결제하기'}
        </button>
      )}

      {status === 'PAID' && isSeller && (
        <button
          onClick={handleCompleteRequest}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#10b981',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '처리 중...' : '거래 완료 요청'}
        </button>
      )}

      {status === 'PAID' && isBuyer && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 600 }}>거래 완료 확인</div>
          <div style={{ marginBottom: '12px', fontSize: '14px', color: '#6b7280' }}>
            모든 거래가 정상적으로 완료되었습니까?
          </div>
          <button
            onClick={handleConfirmComplete}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '처리 중...' : '예, 거래 완료'}
          </button>
        </div>
      )}
    </div>
  )
}
