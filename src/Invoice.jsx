import { formatDate, formatMoney } from './format.js'

export default function Invoice({ invoice }) {
  return (
    <section className="section invoice-section" aria-labelledby="invoice-title">
      <div className="invoice-actions">
        <h2>Factura de tu estadía</h2>
        <button className="btn btn-gold" onClick={() => window.print()}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6V2h8v4M4 12H2V6h12v6h-2M4 9h8v5H4z" /></svg>
          Imprimir
        </button>
      </div>
      <article className="invoice">
        <header className="invoice-head">
          <div>
            <p className="invoice-brand">Casa Arrayán</p>
            <p>Carrera 1 # 18-40, Taganga, Santa Marta</p>
          </div>
          <div className="invoice-number">
            <h3 id="invoice-title">Factura {invoice.number}</h3>
            <p>Emitida el {formatDate(invoice.issuedAt, true)}</p>
          </div>
        </header>
        <p className="invoice-guest">Huésped: <strong>{invoice.guestName}</strong></p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Descripción</th>
                <th scope="col" className="num">Cantidad</th>
                <th scope="col" className="num">Precio unitario</th>
                <th scope="col" className="num">Importe</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, index) => (
                <tr key={index}>
                  <td>{line.description}</td>
                  <td className="num">{line.quantity}</td>
                  <td className="num">{formatMoney(line.unitPrice)}</td>
                  <td className="num">{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><th scope="row" colSpan="3">Subtotal</th><td className="num">{formatMoney(invoice.subtotal)}</td></tr>
              <tr className="invoice-total"><th scope="row" colSpan="3">Total</th><td className="num">{formatMoney(invoice.total)}</td></tr>
            </tfoot>
          </table>
        </div>
        <p className="invoice-thanks">Gracias por quedarte con nosotros.</p>
      </article>
    </section>
  )
}
