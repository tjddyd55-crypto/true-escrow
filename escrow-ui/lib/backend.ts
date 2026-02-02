// Backend API wrapper
// 실제 백엔드 escrow 서버와 통신하는 함수들

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function createDeal(template: string) {
  const res = await fetch(`${API_BASE_URL}/api/deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ template }),
  });
  return res.json();
}

export async function getDeal(dealId: string) {
  const res = await fetch(`${API_BASE_URL}/api/deals/${dealId}`);
  return res.json();
}
