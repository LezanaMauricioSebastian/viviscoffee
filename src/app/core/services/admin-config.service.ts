import { Injectable } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface AdminConfig {
  id?: boolean;
  meta_ventas_mensual: number;
  gastos_fijos_mensuales: number;
}

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  id: true,
  meta_ventas_mensual: 0,
  gastos_fijos_mensuales: 0,
};

@Injectable({ providedIn: 'root' })
export class AdminConfigService {
  constructor(private supabase: SupabaseService) {}

  getConfig(): Observable<AdminConfig> {
    return from(
      this.supabase.client
        .from('admin_config')
        .select('*')
        .eq('id', true)
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (!data) return { ...DEFAULT_ADMIN_CONFIG };
        const row = data as AdminConfig;
        return {
          id: true,
          meta_ventas_mensual: Number(row.meta_ventas_mensual) || 0,
          gastos_fijos_mensuales: Number(row.gastos_fijos_mensuales) || 0,
        };
      }),
      catchError(() => of({ ...DEFAULT_ADMIN_CONFIG }))
    );
  }

  guardar(config: Omit<AdminConfig, 'id'>): Observable<{ config?: AdminConfig; error?: string }> {
    const payload = {
      id: true,
      meta_ventas_mensual: Number(config.meta_ventas_mensual) || 0,
      gastos_fijos_mensuales: Number(config.gastos_fijos_mensuales) || 0,
      updated_at: new Date().toISOString(),
    };

    return from(
      this.supabase.client
        .from('admin_config')
        .upsert(payload)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return { error: error.message };
        const row = data as AdminConfig;
        return {
          config: {
            id: true,
            meta_ventas_mensual: Number(row.meta_ventas_mensual) || 0,
            gastos_fijos_mensuales: Number(row.gastos_fijos_mensuales) || 0,
          },
        };
      }),
      catchError((e) => of({ error: e?.message ?? 'Error al guardar configuración' }))
    );
  }
}
