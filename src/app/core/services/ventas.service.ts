import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface Venta {
  id?: string;
  fecha: string;
  monto: number;
  detalle?: string;
  notas?: string;
}

@Injectable({ providedIn: 'root' })
export class VentasService {
  constructor(private supabase: SupabaseService) {}

  getAll(): Observable<Venta[]> {
    return from(
      this.supabase.client
        .from('ventas')
        .select('*')
        .order('fecha', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []) as Venta[];
      }),
      catchError(() => of([]))
    );
  }

  crear(v: Omit<Venta, 'id'>): Observable<{ id: string } | { error: string }> {
    return from(
      this.supabase.client.from('ventas').insert(v).select('id').single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return { error: error.message };
        return { id: (data as { id: string }).id };
      }),
      catchError((e) => of({ error: e?.message ?? 'Error al crear' }))
    );
  }

  actualizar(id: string, v: Partial<Venta>): Observable<{ error?: string }> {
    return from(
      this.supabase.client
        .from('ventas')
        .update({ ...v, updated_at: new Date().toISOString() })
        .eq('id', id)
    ).pipe(
      map(({ error }) => (error ? { error: error.message } : {})),
      catchError((e) => of({ error: e?.message ?? 'Error al actualizar' }))
    );
  }

  eliminar(id: string): Observable<{ error?: string }> {
    return from(this.supabase.client.from('ventas').delete().eq('id', id)).pipe(
      map(({ error }) => (error ? { error: error.message } : {})),
      catchError((e) => of({ error: e?.message ?? 'Error al eliminar' }))
    );
  }
}
