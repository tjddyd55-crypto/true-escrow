export default function EscrowProtection() {
  return (
    <main style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <section style={{ marginBottom: 50 }}>
        <a
          href="/"
          style={{
            color: "#0070f3",
            textDecoration: "none",
            fontSize: "0.95rem",
            marginBottom: 20,
            display: "inline-block",
          }}
        >
          ← Back to Home
        </a>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: 20 }}>
          Escrow-Based Payment Protection
        </h1>
        <p style={{ fontSize: "1.3rem", color: "#666", fontWeight: "500" }}>
          에스크로 기반 결제 보호
        </p>
      </section>

      {/* 개요 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔍 개요
        </h2>
        <div style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 15 }}>
            에스크로 기반 결제 보호는 거래 당사자 간 신뢰가 완전히 확보되기 전까지
            자금을 중립적으로 보관하는 구조입니다.
          </p>
          <p>
            <strong>true-escrow</strong>는 결제 금액을 즉시 판매자에게 전달하지 않고,
            거래 조건이 충족될 때까지 에스크로 계정에 안전하게 보관합니다.
          </p>
        </div>
      </section>

      {/* 전체 흐름 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🧭 전체 흐름
        </h2>
        <div
          style={{
            padding: 40,
            backgroundColor: "#f8f9fa",
            borderRadius: 12,
            border: "1px solid #e0e0e0",
          }}
        >
          <div style={{ textAlign: "center", fontSize: "1.1rem", lineHeight: 2.5 }}>
            <div style={{ fontWeight: "600", color: "#0070f3" }}>[Buyer 결제]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#00b894" }}>[Escrow 보관]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#6c5ce7" }}>[조건 검증]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#e74c3c" }}>[Release 또는 Refund]</div>
          </div>
        </div>
      </section>

      {/* 단계별 상세 설명 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🪜 단계별 상세 설명
        </h2>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#0070f3" }}>
            ① 결제 발생
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>구매자가 서비스 또는 상품 대금을 결제</li>
            <li style={{ marginBottom: 10 }}>결제 금액은 판매자에게 즉시 전달되지 않음</li>
            <li>에스크로 상태: <strong>FUNDED</strong></li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#00b894" }}>
            ② 에스크로 보관
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>자금은 중립적인 에스크로 상태로 보관</li>
            <li style={{ marginBottom: 10 }}>어느 한쪽도 단독으로 자금 접근 불가</li>
            <li>분쟁 발생 시 자동 보호 상태 유지</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#6c5ce7" }}>
            ③ 조건 검증
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>계약 또는 거래에서 정의한 조건 확인</li>
            <li>예: 작업 완료, 문서 제출, 검수 승인 등</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#e74c3c" }}>
            ④ 자금 처리
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>조건 충족 → 판매자에게 지급</li>
            <li>조건 미충족 / 분쟁 → 보류 또는 환불</li>
          </ul>
        </div>
      </section>

      {/* 왜 안전한가 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔐 왜 안전한가?
        </h2>
        <div
          style={{
            padding: 30,
            backgroundColor: "#f0f9ff",
            borderRadius: 12,
            border: "1px solid #bae6fd",
          }}
        >
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>자금은 조건 충족 전까지 잠금 상태</li>
            <li style={{ marginBottom: 10 }}>판매자 단독 인출 불가</li>
            <li style={{ marginBottom: 10 }}>구매자 단독 취소 불가</li>
            <li>모든 상태 변화는 기록됨</li>
          </ul>
        </div>
      </section>

      {/* 사용 사례 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          ✅ 이 구조가 필요한 경우
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>디지털 서비스 거래</strong>
          </div>
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>외주 / 프리랜서 계약</strong>
          </div>
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>글로벌 B2B 거래</strong>
          </div>
          <div style={{ padding: 20, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <strong style={{ fontSize: "1.1rem" }}>고액 또는 단계형 프로젝트</strong>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer style={{ marginTop: 80, paddingTop: 40, borderTop: "1px solid #e0e0e0", textAlign: "center" }}>
        <nav style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <a href="/" style={{ color: "#666", textDecoration: "none" }}>Home</a>
          <a href="/about" style={{ color: "#666", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ color: "#666", textDecoration: "none" }}>Pricing</a>
          <a href="/contact" style={{ color: "#666", textDecoration: "none" }}>Contact</a>
        </nav>
      </footer>
    </main>
  );
}
