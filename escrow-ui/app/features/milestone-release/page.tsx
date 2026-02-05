export default function MilestoneRelease() {
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
          Milestone-Based Fund Release
        </h1>
        <p style={{ fontSize: "1.3rem", color: "#666", fontWeight: "500" }}>
          마일스톤 기반 펀드 릴리스
        </p>
      </section>

      {/* 개요 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔍 개요
        </h2>
        <div style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8 }}>
          <p style={{ marginBottom: 15 }}>
            마일스톤 기반 펀드 릴리스는 프로젝트를 여러 단계로 나누고,
            각 단계가 완료될 때마다 자금을 분할 지급하는 구조입니다.
          </p>
          <p>
            한 번에 전액을 지급하지 않기 때문에 리스크를 최소화하면서
            투명한 거래를 유지할 수 있습니다.
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
            <div style={{ fontWeight: "600", color: "#0070f3" }}>[총 결제 금액]</div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#00b894" }}>
              [Milestone 1 완료] → 부분 지급
            </div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#6c5ce7" }}>
              [Milestone 2 완료] → 부분 지급
            </div>
            <div style={{ fontSize: "1.5rem" }}>↓</div>
            <div style={{ fontWeight: "600", color: "#e74c3c" }}>
              [Milestone 3 완료] → 잔금 지급
            </div>
          </div>
        </div>
      </section>

      {/* 예시 시나리오 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🪜 예시 시나리오 (실제 이해용)
        </h2>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: "1.2rem", fontWeight: "600", marginBottom: 20 }}>
            프로젝트 총 금액: <span style={{ color: "#0070f3" }}>$10,000</span>
          </p>
        </div>
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "1.1rem",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>
                  마일스톤
                </th>
                <th style={{ padding: "15px", textAlign: "left", borderBottom: "2px solid #e0e0e0" }}>
                  조건
                </th>
                <th style={{ padding: "15px", textAlign: "right", borderBottom: "2px solid #e0e0e0" }}>
                  지급 금액
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  <strong>Milestone 1</strong>
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  초기 설계 완료
                </td>
                <td style={{ padding: "15px", textAlign: "right", borderBottom: "1px solid #f0f0f0", fontWeight: "600" }}>
                  $3,000
                </td>
              </tr>
              <tr>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  <strong>Milestone 2</strong>
                </td>
                <td style={{ padding: "15px", borderBottom: "1px solid #f0f0f0" }}>
                  중간 결과물 검수
                </td>
                <td style={{ padding: "15px", textAlign: "right", borderBottom: "1px solid #f0f0f0", fontWeight: "600" }}>
                  $4,000
                </td>
              </tr>
              <tr>
                <td style={{ padding: "15px" }}>
                  <strong>Milestone 3</strong>
                </td>
                <td style={{ padding: "15px" }}>
                  최종 납품 승인
                </td>
                <td style={{ padding: "15px", textAlign: "right", fontWeight: "600" }}>
                  $3,000
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 단계별 상세 설명 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 30, display: "flex", alignItems: "center", gap: 10 }}>
          🪜 단계별 상세 설명
        </h2>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#0070f3" }}>
            ① 마일스톤 설정
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>거래 시작 시 마일스톤 정의</li>
            <li style={{ marginBottom: 10 }}>각 단계마다:</li>
            <ul style={{ paddingLeft: 30, marginTop: 10 }}>
              <li style={{ marginBottom: 8 }}>조건</li>
              <li style={{ marginBottom: 8 }}>지급 금액</li>
              <li>승인 주체 명확화</li>
            </ul>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#00b894" }}>
            ② 단계 달성
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>판매자가 마일스톤 완료 요청</li>
            <li>구매자가 검수 및 승인</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#6c5ce7" }}>
            ③ 부분 지급
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>승인 시 해당 금액만 지급</li>
            <li>남은 금액은 계속 에스크로에 보관</li>
          </ul>
        </div>

        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 15, color: "#e74c3c" }}>
            ④ 다음 단계 진행
          </h3>
          <ul style={{ fontSize: "1.1rem", color: "#555", lineHeight: 1.8, paddingLeft: 25 }}>
            <li style={{ marginBottom: 10 }}>이전 단계 완료 후 다음 마일스톤 진행</li>
            <li>전체 완료 시 거래 종료</li>
          </ul>
        </div>
      </section>

      {/* 투명성이 보장되는 이유 */}
      <section style={{ marginBottom: 60 }}>
        <h2 style={{ fontSize: "2rem", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          🔐 투명성이 보장되는 이유
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
            <li style={{ marginBottom: 10 }}>지급 기준이 사전에 명확</li>
            <li style={{ marginBottom: 10 }}>단계별 승인 기록 유지</li>
            <li style={{ marginBottom: 10 }}>자금 흐름이 실시간으로 추적 가능</li>
            <li>분쟁 발생 시 어느 단계에서 문제 발생했는지 명확</li>
          </ul>
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
