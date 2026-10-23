import SystemIcon from "./SystemIcon";

export default function RetailCartButton({ count, busy, onClick }: {
  count: number;
  busy: boolean;
  onClick: () => void;
}) {
  return <button type="button" className="retail-system-cart" onClick={onClick}
    aria-busy={busy} aria-label={`Abrir carrito con ${count} ${count === 1 ? "artículo" : "artículos"}`}>
    <SystemIcon name="cart" /><span>{busy ? "Abriendo…" : "Carrito"}</span>
    <span className="shopping-cart-count">{count}</span>
  </button>;
}
