import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

const BUCKET = 'productos';

export interface Producto {
  id?: string;
  nombre: string;
  precio: string;
  descripcion: string;
  img: string;
  categoria: string;
  orden?: number;
}

const CATEGORIAS = ['promo', 'cafe', 'chocolates', 'box', 'cookies', 'salado', 'vegan', 'otros'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

// Mapeo índice CSV -> categoría (según componentes actuales)
const INDEX_TO_CATEGORIA: Record<number, string> = {
  1: 'promo', 2: 'promo', 3: 'promo',
  4: 'cafe', 5: 'cafe',
  6: 'chocolates',
  7: 'box', 8: 'box', 9: 'box', 10: 'box',
  11: 'cookies', 12: 'cookies', 13: 'cookies', 14: 'cookies', 15: 'cookies', 16: 'cookies', 17: 'cookies',
  18: 'chocolates', 19: 'chocolates', 20: 'chocolates', 21: 'chocolates', 22: 'chocolates', 23: 'chocolates', 24: 'chocolates',
  25: 'box', 26: 'salado', 27: 'vegan',
  28: 'cookies', 29: 'cookies', 30: 'cookies', 31: 'cookies',
};

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxYY98Jyk6zGzMfndXIMxpIxwGrTb4zhMmEbx6CZwB9QPhg-7xc8a33zjwkg4CKYhBDSa_cbnLClJB/pub?output=csv';

  constructor(
    private supabase: SupabaseService,
    private http: HttpClient
  ) {}

  getCategorias(): string[] {
    return [...CATEGORIAS];
  }

  getProductos(categoria?: string): Observable<Producto[]> {
    let query = this.supabase.client
      .from('productos')
      .select('*')
      .order('orden', { ascending: true });

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Producto[];
      }),
      catchError(() => of([]))
    );
  }

  crear(producto: Omit<Producto, 'id'>): Observable<{ id: string } | { error: string }> {
    return from(
      this.supabase.client.from('productos').insert(producto).select('id').single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return { error: error.message };
        return { id: (data as { id: string }).id };
      }),
      catchError((e) => of({ error: e?.message ?? 'Error al crear' }))
    );
  }

  actualizar(id: string, producto: Partial<Producto>): Observable<{ error?: string }> {
    return from(
      this.supabase.client
        .from('productos')
        .update({ ...producto, updated_at: new Date().toISOString() })
        .eq('id', id)
    ).pipe(
      map(({ error }) => (error ? { error: error.message } : {})),
      catchError((e) => of({ error: e?.message ?? 'Error al actualizar' }))
    );
  }

  eliminar(id: string): Observable<{ error?: string }> {
    return from(this.supabase.client.from('productos').delete().eq('id', id)).pipe(
      map(({ error }) => (error ? { error: error.message } : {})),
      catchError((e) => of({ error: e?.message ?? 'Error al eliminar' }))
    );
  }

  /** Sube una imagen a Supabase Storage y devuelve la URL pública */
  subirImagen(file: File): Observable<{ url: string } | { error: string }> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    return from(
      this.supabase.client.storage.from(BUCKET).upload(path, file, { upsert: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) return { error: error.message };
        const url = `${environment.supabase.url}/storage/v1/object/public/${BUCKET}/${data.path}`;
        return { url };
      }),
      catchError((e) => of({ error: e?.message ?? 'Error al subir imagen' }))
    );
  }

  importarDesdeSheets(): Observable<{ count: number; error?: string }> {
    return this.http.get(this.csvUrl, { responseType: 'text' }).pipe(
      switchMap((csv) => {
        const parsed = Papa.parse<Record<string, string>>(csv, { header: true });
        const rows = parsed.data ?? [];
        const productos: Omit<Producto, 'id'>[] = [];
        rows.forEach((row, i) => {
          const raw = row as unknown as { '': string; _1?: string; _2?: string; _3?: string; _4?: string };
          const nombre = raw._1 ?? raw[''] ?? '';
          if (!nombre?.trim()) return;
          const categoria = INDEX_TO_CATEGORIA[i + 1] ?? 'cookies';
          productos.push({
            nombre: nombre.trim(),
            precio: (raw._2 ?? '').toString(),
            descripcion: (raw._3 ?? '').toString(),
            img: (raw._4 ?? '').toString(),
            categoria,
            orden: i,
          });
        });
        if (productos.length === 0) return of({ count: 0, error: 'No hay productos en el CSV' });
        return from(this.supabase.client.from('productos').insert(productos)).pipe(
          map(({ error }) => {
            if (error) return { count: 0, error: error.message };
            return { count: productos.length };
          }),
          catchError((e) => of({ count: 0, error: e?.message ?? 'Error al importar' }))
        );
      }),
      catchError((e) => of({ count: 0, error: e?.message ?? 'Error al descargar CSV' }))
    );
  }
}
