export default function PaymentInfo() {
  return (
    <main style={{ padding: 40, maxWidth: 800 }}>
      <h1>Payment Information</h1>

      <p>
        This platform uses a milestone-based escrow system.
        Payments are not released immediately to the seller.
      </p>

      <ul>
        <li>Funds are securely held in escrow</li>
        <li>Each milestone must be completed and confirmed</li>
        <li>Funds are released only after milestone approval</li>
        <li>In case of disputes, funds remain locked until resolution</li>
      </ul>

      <p>
        This demo transaction is for testing and verification purposes.
      </p>
    </main>
  );
}
