// Variantes de producto — modelo compartido por el catálogo, el Punto de venta, el
// Autoservicio y la app del cliente.
//
// Un producto puede tener varios GRUPOS de variantes (ej. "Tamaño", "Temperatura",
// "Color"). De cada grupo el cliente/cajero elige UNA opción. Cada opción puede
// sumar un extra al precio base (ej. Grande +$20; Frío +$0). El precio final del
// renglón = precio base del producto + suma de los extras elegidos.

export type VariantOption = { name: string; price_delta?: number }
export type VariantGroup = { name: string; options: VariantOption[] }

// ¿El producto tiene variantes válidas (al menos un grupo con opciones)?
export function hasVariants(v?: VariantGroup[] | null): v is VariantGroup[] {
  return Array.isArray(v) && v.some(g => g.name?.trim() && Array.isArray(g.options) && g.options.length > 0)
}

// Sólo los grupos utilizables (con nombre y al menos una opción con nombre).
export function usableGroups(v?: VariantGroup[] | null): VariantGroup[] {
  if (!Array.isArray(v)) return []
  return v
    .map(g => ({ name: (g.name ?? '').trim(), options: (g.options ?? []).filter(o => (o.name ?? '').trim()).map(o => ({ name: o.name.trim(), price_delta: Number(o.price_delta) || 0 })) }))
    .filter(g => g.name && g.options.length > 0)
}

// Extra total de precio de una selección (una opción por grupo).
export function variantDelta(sel: (VariantOption | null | undefined)[]): number {
  return sel.reduce((s, o) => s + (Number(o?.price_delta) || 0), 0)
}

// Etiqueta legible de la selección: "Grande · Caliente". Vacía si no hay selección.
export function variantLabel(sel: (VariantOption | null | undefined)[]): string {
  return sel.filter(Boolean).map(o => o!.name).join(' · ')
}

// Selección por defecto: la primera opción de cada grupo utilizable.
export function defaultSelection(v?: VariantGroup[] | null): VariantOption[] {
  return usableGroups(v).map(g => g.options[0])
}
