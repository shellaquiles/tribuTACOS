export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>404 - Página no encontrada</h2>
      <p style={{ color: '#64748b' }}>La página que buscas no existe o ha sido movida.</p>
    </div>
  );
}
