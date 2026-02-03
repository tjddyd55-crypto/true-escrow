'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Milestone {
  title: string
  description?: string
  amount: number
  orderIndex: number
}

export default function EscrowPaymentSetupPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [itemName, setItemName] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('MNT')
  const [paymentType, setPaymentType] = useState<'FULL' | 'MILESTONE'>('FULL')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    setUserId(storedUserId)
    
    // Get country code from localStorage or default to MNT
    const countryCode = localStorage.getItem('countryCode') || 'MN'
    const currencyMap: Record<string, string> = {
      'MN': 'MNT',
      'UZ': 'UZS',
      'KZ': 'KZT',
      'KG': 'KGS',
    }
    setCurrency(currencyMap[countryCode] || 'USD')
  }, [])

  const addMilestone = () => {
    if (milestones.length >= 3) return
    setMilestones([...milestones, {
      title: '',
      amount: 0,
      orderIndex: milestones.length + 1,
    }])
  }

  const updateMilestone = (index: number, field: keyof Milestone, value: string | number) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    setMilestones(updated)
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index).map((m, i) => ({ ...m, orderIndex: i + 1 })))
  }

  const validateMilestones = () => {
    if (paymentType !== 'MILESTONE') return true
    if (milestones.length === 0) return false
    const total = milestones.reduce((sum, m) => sum + m.amount, 0)
    return total === 100
  }

  const handleSubmit = async () => {
    if (!itemName || !amount || !userId || !roomId) return
    if (paymentType === 'MILESTONE' && !validateMilestones()) {
      alert('마일스톤 합계가 100%가 되어야 합니다.')
      return
    }

    setLoading(true)
    try {
      const totalAmount = parseFloat(amount)
      const milestoneData = paymentType === 'MILESTONE' 
        ? milestones.map(m => ({
            title: m.title,
            description: m.description || '',
            amount: (totalAmount * m.amount / 100),
            orderIndex: m.orderIndex,
          }))
        : []

      const response = await fetch(`/api/escrow/chat/rooms/${roomId}/payment-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          itemName,
          amount: totalAmount,
          currency,
          paymentType,
          milestones: milestoneData,
        }),
      })

      if (response.ok) {
        router.push(`/chat/${roomId}`)
      } else {
        alert('결제 요청 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to create payment request:', error)
      alert('결제 요청 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: '#fff',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => router.back()} style={{ marginBottom: '12px' }}>
          ← 뒤로
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>에스크로 결제 설정</h1>
      </div>

      {/* 거래 요약 */}
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f3f4f6', 
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>매물명</strong>
        </div>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="매물명을 입력하세요"
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginTop: '8px',
          }}
        />
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
          거래 상대: 채팅 상대방
        </div>
      </div>

      {/* 결제 금액 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          결제 금액 <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10,000,000"
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            <option value="MNT">MNT</option>
            <option value="UZS">UZS</option>
            <option value="KZT">KZT</option>
            <option value="KGS">KGS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* 결제 방식 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
          결제 방식
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              checked={paymentType === 'FULL'}
              onChange={() => setPaymentType('FULL')}
            />
            전체 금액 한 번에 결제
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              checked={paymentType === 'MILESTONE'}
              onChange={() => setPaymentType('MILESTONE')}
            />
            마일스톤 분할 결제 (선택)
          </label>
        </div>
      </div>

      {/* 마일스톤 설정 */}
      {paymentType === 'MILESTONE' && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontWeight: 600 }}>마일스톤 설정</label>
            {milestones.length < 3 && (
              <button
                onClick={addMilestone}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                + 추가
              </button>
            )}
          </div>
          {milestones.map((milestone, index) => (
            <div key={index} style={{ 
              padding: '12px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong>마일스톤 {milestone.orderIndex}</strong>
                <button onClick={() => removeMilestone(index)} style={{ fontSize: '12px', color: '#ef4444' }}>
                  삭제
                </button>
              </div>
              <input
                type="text"
                value={milestone.title}
                onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                placeholder="제목 (예: 계약금)"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  value={milestone.amount}
                  onChange={(e) => updateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="비율 (%)"
                  min="0"
                  max="100"
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <span style={{ lineHeight: '36px' }}>%</span>
              </div>
            </div>
          ))}
          {milestones.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: validateMilestones() ? '#10b981' : '#ef4444' }}>
              합계: {milestones.reduce((sum, m) => sum + m.amount, 0)}%
              {!validateMilestones() && ' (100%가 되어야 합니다)'}
            </div>
          )}
        </div>
      )}

      {/* 보호 안내 문구 */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#eff6ff', 
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        color: '#1e40af',
      }}>
        결제 금액은 거래 완료 전까지 플랫폼에서 안전하게 보관됩니다.
      </div>

      {/* 하단 CTA */}
      <button
        onClick={handleSubmit}
        disabled={!itemName || !amount || loading || (paymentType === 'MILESTONE' && !validateMilestones())}
        style={{
          width: '100%',
          padding: '16px',
          backgroundColor: itemName && amount && !loading && (paymentType === 'FULL' || validateMilestones()) ? '#2563eb' : '#9ca3af',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: itemName && amount && !loading && (paymentType === 'FULL' || validateMilestones()) ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? '처리 중...' : '결제 요청 보내기'}
      </button>
    </div>
  )
}
