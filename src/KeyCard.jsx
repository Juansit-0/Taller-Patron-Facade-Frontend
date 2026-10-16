export default function KeyCard({ room, guest, code }) {
  return (
    <section className="section key-section" aria-labelledby="key-title">
      <div className="key-copy">
        <h2 id="key-title">Tu llave digital</h2>
        <p>Acerca el teléfono a la cerradura de la habitación {room}. La llave deja de funcionar al hacer el check-out.</p>
      </div>
      <div className="key-card" role="img" aria-label={`Llave digital de la habitación ${room} para ${guest}`}>
        <div className="key-top">
          <span className="key-brand">Casa Arrayán</span>
          <svg className="key-wave" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 8a6 6 0 0 1 0 8M12 5a10 10 0 0 1 0 14M16 2a14 14 0 0 1 0 20" />
          </svg>
        </div>
        <span className="key-chip" aria-hidden="true" />
        <span className="key-room">{room}</span>
        <span className="key-guest">{guest}</span>
        <span className="key-code">{code}</span>
      </div>
    </section>
  )
}
