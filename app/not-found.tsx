export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1f35' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', color: '#fbbf24' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', color: '#e5e7eb' }}>Not Found</h2>
        <p style={{ color: '#9ca3af' }}>The page does not exist</p>
      </div>
    </div>
  );
}
