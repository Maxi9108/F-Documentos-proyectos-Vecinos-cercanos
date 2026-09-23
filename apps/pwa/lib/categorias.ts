import { Categoria } from '@/types/comercio';

const STORAGE_KEY_CATEGORIAS = 'vecinos_categorias_oficiales';

export const CATEGORIAS_BASE: Categoria[] = [
  { id: 'cat-1', nombre: 'Almacén', icono: 'Store' },
  { id: 'cat-2', nombre: 'Panadería', icono: 'Croissant' },
  { id: 'cat-3', nombre: 'Farmacia', icono: 'Pill' },
  { id: 'cat-4', nombre: 'Verdulería', icono: 'Apple' },
  { id: 'cat-5', nombre: 'Carnicería', icono: 'Beef' },
  { id: 'cat-6', nombre: 'Ferretería', icono: 'Wrench' },
  { id: 'cat-7', nombre: 'Cafetería', icono: 'Coffee' },
  { id: 'cat-8', nombre: 'Kiosco', icono: 'Candy' },
  { id: 'cat-9', nombre: 'Gastronomía', icono: 'Utensils' },
  { id: 'cat-10', nombre: 'Reparto de Agua y Bebidas', icono: 'Bike' },
  { id: 'cat-11', nombre: 'Peluquería & Estética', icono: 'Scissors' },
  { id: 'cat-12', nombre: 'Veterinaria & Pet Shop', icono: 'HeartHandshake' },
  { id: 'cat-13', nombre: 'Indumentaria & Calzado', icono: 'Shirt' },
  { id: 'cat-14', nombre: 'Servicios del Hogar', icono: 'Home' },
];

/**
 * Obtiene todas las categorías oficiales y homologadas
 */
export function getCategorias(): Categoria[] {
  if (typeof window === 'undefined') return CATEGORIAS_BASE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIAS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(CATEGORIAS_BASE));
      return CATEGORIAS_BASE;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[Categorias] Error al leer categorías:', e);
    return CATEGORIAS_BASE;
  }
}

/**
 * Guarda las categorías en almacenamiento persistente
 */
function guardarCategorias(categorias: Categoria[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias));
    } catch (e) {
      console.warn('[Categorias] Error al guardar categorías:', e);
    }
  }
}

/**
 * Agrega una nueva categoría oficial
 */
export function agregarCategoria(
  nombre: string,
  creadaPor: string = 'SuperAdmin'
): { exito: boolean; categoria?: Categoria; error?: string } {
  const cleanNombre = nombre.trim();
  if (!cleanNombre) return { exito: false, error: 'El nombre de la categoría es requerido.' };

  const cats = getCategorias();
  if (cats.some((c) => c.nombre.toLowerCase() === cleanNombre.toLowerCase())) {
    return { exito: false, error: 'Esta categoría ya existe en el sistema.' };
  }

  const nueva: Categoria = {
    id: 'cat-' + Date.now(),
    nombre: cleanNombre,
    creada_por: creadaPor,
    creada_at: new Date().toISOString(),
  };

  cats.push(nueva);
  guardarCategorias(cats);

  return { exito: true, categoria: nueva };
}

/**
 * Homologa una categoría solicitada por un comerciante a la lista oficial
 */
export function homologarCategoriaSolicitada(
  nombreCategoria: string,
  aprobadaPor: string
): { exito: boolean; categoria?: Categoria; error?: string } {
  return agregarCategoria(nombreCategoria, aprobadaPor);
}

/**
 * Elimina una categoría oficial
 */
export function eliminarCategoria(categoriaId: string): { exito: boolean; error?: string } {
  let cats = getCategorias();
  if (cats.length <= 3) {
    return { exito: false, error: 'Debe mantenerse al menos un conjunto básico de categorías.' };
  }

  cats = cats.filter((c) => c.id !== categoriaId);
  guardarCategorias(cats);
  return { exito: true };
}
