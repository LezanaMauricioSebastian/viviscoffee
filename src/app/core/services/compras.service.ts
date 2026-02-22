import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface CompraInsumo {
  id?: string;
  fecha: string;
  concepto: string;
  cantidad?: string;
  unidad?: string;
  monto: number;
  proveedor?: string;
  notas?: string;
}

@Injectable({ providedIn: 'root' })
export class ComprasService {
  constructor(private supabase: SupabaseService) {}

  getAll(): Observable<CompraInsumo[]> {
    return from(
      this.supabase.client
        .from('compras_insumos')
        .select('*')
        .order('fecha', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as CompraInsumo[];
      }),
      catchError(() => of([]))
    );
  }

  crear(c: Omit<CompraInsumo, 'id'>): Observable<{ id: string } | { error: string }> {
    return from(
      this.supabase.client.from('compras_insumos').insert(c).select('id').single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return { error: error.message };
        return { id: (data as { id: string }).id };
      }),
      catchError((e) => of({ error: e?.message ?? 'Error al crear' }))
    );
  }

  actualizar(id: string, c: Partial<CompraInsumo>): Observable<{ error?: string }> {
    return from(
      this.supabase.client
        .from('compras_insumos')
        .update({ ...c, updated_at: new Date().toISOString() })
        .eq('id', id)
    ).pipe(
      map(({ error }) => (error ? { error: error.message } : {})),
      catchError((e) => of({ error: e?.message ?? 'Error al actualizar' }))
    );
  }

  eliminar(id: string): Observable<{ error?: string }> {
    return from(this.supabase.client.from('compras_insumos').delete().eq('id', id)).pipe(
      map(({ error }) => (error ? { error: error.message } : {})),
      catchError((e) => of({ error: e?.message ?? 'Error al eliminar' }))
    );
  }
}
