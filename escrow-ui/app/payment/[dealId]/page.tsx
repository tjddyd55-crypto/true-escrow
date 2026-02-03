'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface PaymentInfo {
  id: string
  dealId: string
  buyerId: string
  sellerId: string
  totalAmount: number
  currency: string
  status: string
  paymentMethod: string | null
  paymentProvider: string | null
  paidAt: string | null
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const dealId = params.dealId as string
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentProvider, setPaymentProvider] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
    
    if (dealId) {
      fetchPaymentInfo()
    }
  }, [dealId])

  const fetchPaymentInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/escrow/payment/${dealId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentInfo(data.data)
          setPaymentMethod(data.data.paymentMethod || '')
          setPaymentProvider(data.data.paymentProvider || '')
        }
      } else if (response.status === 404) {
        // Payment info doesn't exist yet, create it
        setPaymentInfo(null)
      }
    } catch (error) {
      console.error('Failed to fetch payment info:', error)
    } finally {
      setLoading(false)
    }
  }

  const savePaymentInfo = async () => {
    if (!paymentMethod || !paymentProvider || !userId) return
    
    try {
      setSaving(true)
      const response = await fetch(`/api/escrow/payment/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          buyerId: userId,
          paymentMethod,
          paymentProvider,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentInfo(data.data)
          alert('Payment information saved successfully!')
        }
      }
    } catch (error) {
      console.error('Failed to save payment info:', error)
      alert('Failed to save payment information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading payment information...</p>
      </div>
    )
  }

  if (!userId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Please set your user ID to view payment information.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Payment Setup</h1>
      <p style={{ marginBottom: '20px', color: '#6b7280' }}>
        Deal ID: {dealId}
      </p>
      
      {paymentInfo && (
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Status:</strong> {paymentInfo.status}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong>Amount:</strong> {paymentInfo.totalAmount} {paymentInfo.currency}
          </div>
          {paymentInfo.paidAt && (
            <div>
              <strong>Paid At:</strong> {new Date(paymentInfo.paidAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
      
      <div style={{ display: 'grid', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            <option value="">Select payment method</option>
            <option value="CARD">Credit/Debit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="DIGITAL_WALLET">Digital Wallet</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Payment Provider
          </label>
          <select
            value={paymentProvider}
            onChange={(e) => setPaymentProvider(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            <option value="">Select payment provider</option>
            <option value="LEMON_SQUEEZY">Lemon Squeezy</option>
            <option value="STRIPE">Stripe</option>
            <option value="PAYPAL">PayPal</option>
          </select>
        </div>
        
        <button
          onClick={savePaymentInfo}
          disabled={!paymentMethod || !paymentProvider || saving}
          style={{
            padding: '12px 24px',
            backgroundColor: paymentMethod && paymentProvider && !saving ? '#2563eb' : '#9ca3af',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: paymentMethod && paymentProvider && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving...' : 'Save Payment Information'}
        </button>
      </div>
    </div>
  )
}
