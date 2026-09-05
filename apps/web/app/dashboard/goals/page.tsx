// Protected route — redirect to login if no token
// In production this is handled by NextAuth middleware
export default function DashboardGoalsPage() {
  // TODO Sprint 3: implement full goal engine UI
  return (
    <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
      <h1>Your Goals</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>
        Goal engine coming in Sprint 3 🎯
      </p>
    </div>
  );
}
