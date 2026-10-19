const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(value);
export default function ProductPrice({ price, original, from = false }: { price: number; original?: number; from?: boolean }) {
  const discounted = original !== undefined && original > price;
  return <span className="product-price-pair">
    {discounted && <del><span className="sr-only">Precio normal: </span>{money(original)}</del>}
    <span>{discounted && <span className="sr-only">Precio con descuento: </span>}{from ? "Desde " : ""}{money(price)}</span>
  </span>;
}
