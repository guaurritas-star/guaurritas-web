export const NATIONAL_PRODUCT_NAMES = [
  "Guaurricookies", "Kit GuaurriCookies", "Descubre Guaurritas", "Happy Bag",
  "Sazonadores", "GuaurriSticks", "Happy Box", "B’day gorrito", "Velitas", "Pancarta",
] as const;

export function canRepeatNational(items: { name: string; world: "cuisine" | "couture" }[]) {
  return items.every(item => item.world === "couture" || NATIONAL_PRODUCT_NAMES.some(name =>
    item.name.toLocaleLowerCase().includes(name.toLocaleLowerCase())));
}
