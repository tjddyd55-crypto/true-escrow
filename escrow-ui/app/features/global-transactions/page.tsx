export default function GlobalTransactions() {
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
          Built for Global Transactions
        </h1>
        <p style={{ fontSize: "1.3rem", color: "#666", fontWeight: "500" }}>
          글로벌 거래를 위해 구축된 구조
        </p>
      </section>

      {/* 개요 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔍 개요
        </h2>
        <div style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <p>
            <strong>true-escrow</strong>는 국경을 넘는 거래에서 발생하는 신뢰 문제와
            지급 리스크를 최소화하기 위해 설계되었습니다.
          </p>
        </div>
      </section>

      {/* 글로벌 거래의 문제점 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🌍 글로벌 거래의 문제점
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              국가별 법률·관행 차이
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              서로 다른 법률 체계와 비즈니스 관행으로 인한 불확실성
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              선지급 리스크
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              먼저 지급한 당사자가 약속 이행을 받지 못할 위험
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              환불·분쟁 처리 어려움
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              국경을 넘는 분쟁 해결의 복잡성과 비용
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #ffe0e0",
              borderRadius: 8,
              backgroundColor: "#fff5f5",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#c92a2a" }}>
              중개자 의존
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              신뢰할 수 있는 중개자 없이는 거래가 어려움
            </p>
          </div>
        </div>
      </section>

      {/* true-escrow의 접근 방식 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🧭 true-escrow의 접근 방식
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
            <div style={{ fontWeight: "600", color: "#0070f3" }}>[국가 A 구매자]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#00b894", fontSize: "1.2rem" }}>[Escrow]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#6c5ce7" }}>[국가 B 판매자]</div>
          </div>
        </div>
      </section>

      {/* 보장되는 요소 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔐 보장되는 요소
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginTop: 30,
          }}
        >
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              국적과 무관한 중립 구조
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              어느 국가의 당사자든 동일한 보호 수준과 규칙 적용
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              단계별 지급으로 리스크 분산
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              마일스톤 기반으로 전액 리스크를 단계별로 분산
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              거래 상태 명확화
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              실시간으로 거래 진행 상황을 투명하게 공유
            </p>
          </div>
          <div
            style={{
              padding: 25,
              border: "1px solid #bae6fd",
              borderRadius: 8,
              backgroundColor: "#f0f9ff",
            }}
          >
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10, color: "#0369a1" }}>
              기록 기반 분쟁 대응
            </h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              모든 거래 단계가 기록되어 분쟁 해결에 활용
            </p>
          </div>
        </div>
      </section>

      {/* 사용 사례 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          ✅ 사용 사례
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 20,
          }}
        >
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>글로벌 외주 프로젝트</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              해외 개발자/디자이너와의 단계별 프로젝트 진행
            </p>
          </div>
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>해외 공급 계약</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              제조업체와의 단계별 납품 및 검수 기반 거래
            </p>
          </div>
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>디지털 콘텐츠 거래</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              글로벌 시장에서의 소프트웨어, 미디어 라이선스 거래
            </p>
          </div>
          <div style={{ padding: 25, border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: 10 }}>실물 자산 거래 (단계 납품)</h3>
            <p style={{ fontSize: "1rem", color: "#666", lineHeight: 1.6 }}>
              해외에서의 단계별 납품이 필요한 물품 거래
            </p>
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
