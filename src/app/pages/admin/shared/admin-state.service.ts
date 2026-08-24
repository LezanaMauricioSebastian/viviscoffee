import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { parseVentaDetalle } from '../../../shared/utils/parse-venta-detalle';
import { parsePrecio } from '../../../shared/utils/parse-precio';
import { forkJoin } from 'rxjs';
import * as Papa from 'papaparse';
import {
  ProductosService,
  Producto,
  syncPrecioDisplay,
  formatPrecioLabel,
} from '../../../core/services/productos.service';
import { ComprasService, CompraInsumo } from '../../../core/services/compras.service';
import { VentasService, Venta } from '../../../core/services/ventas.service';
import {
  AdminConfigService,
  AdminConfig,
  DEFAULT_ADMIN_CONFIG,
} from '../../../core/services/admin-config.service';
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

Chart.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

type Periodo = 'mensual' | 'semestral' | 'total';
type DashboardActivity = {
  id: string;
  fecha: string;
  tipo: 'venta' | 'compra';
  titulo: string;
  detalle: string;
  monto: number;
};
type QuickVentaItem = {
  productoId: string;
  cantidad: number;
  query: string;
};
export type ProductoRankingMes = {
  nombre: string;
  categoria: string;
  img: string;
  unidades: number;
  menciones: number;
  montoEstimado: number;
};

@Injectable()
export class AdminStateService implements OnDestroy {
  readonly periodo = signal<Periodo>('total');
  periodoTendencia: '7d' | '30d' | '6m' = '30d';
  readonly periodoTendenciaOptions: { value: '7d' | '30d' | '6m'; label: string }[] = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '6m', label: 'Últimos 6 meses' },
  ];

  private chart: Chart<'bar'> | null = null;
  private recoveryChart: Chart<'line'> | null = null;
  private tendenciaChart: Chart<'line'> | null = null;
  private chartRenderTimeout: ReturnType<typeof setTimeout> | null = null;

  // Productos / compras / ventas / config (signals)
  readonly productos = signal<Producto[]>([]);
  readonly compras = signal<CompraInsumo[]>([]);
  readonly ventas = signal<Venta[]>([]);
  readonly dashboardConfig = signal<AdminConfig>({ ...DEFAULT_ADMIN_CONFIG });

  categorias: string[] = [];
  loading = true;
  loadingConfig = true;
  savingConfig = false;
  importando = false;
  error = '';
  success = '';
  showModal = false;
  editingId: string | null = null;
  form: Partial<Producto> = {
    nombre: '',
    precio: '',
    precio_num: null,
    precio_mayorista: null,
    min_mayorista: 4,
    precio_a_consultar: false,
    descripcion: '',
    img: '',
    categoria: 'cafe',
  };
  readonly formatPrecioLabel = formatPrecioLabel;
  subiendoImg = false;
  readonly filtroProductoBusqueda = signal('');
  readonly filtroProductoCategoria = signal('');
  reordenandoProductoId: string | null = null;
  readonly filtroCompraBusqueda = signal('');
  readonly filtroVentaBusqueda = signal('');
  dashboardConfigForm: Omit<AdminConfig, 'id'> = {
    meta_ventas_mensual: 0,
    gastos_fijos_mensuales: 0,
  };

  // Compras UI
  loadingCompras = true;
  showModalCompra = false;
  editingCompraId: string | null = null;
  formCompra: Partial<CompraInsumo> = {
    fecha: new Date().toISOString().slice(0, 10),
    concepto: '',
    cantidad: '',
    unidad: '',
    monto: 0,
    proveedor: '',
    notas: '',
  };

  /** Escala del eje Y del gráfico de recuperación: 0 = auto, o step en pesos */
  recoveryChartScale = 50_000;
  readonly recoveryScaleOptions: { value: number; label: string }[] = [
    { value: 0, label: 'Auto' },
    { value: 50_000, label: 'Cada $50.000' },
    { value: 100_000, label: 'Cada $100.000' },
    { value: 200_000, label: 'Cada $200.000' },
    { value: 300_000, label: 'Cada $300.000' },
    { value: 500_000, label: 'Cada $500.000' },
    { value: 1_000_000, label: 'Cada $1.000.000' },
  ];

  /** Unidad del eje X del gráfico de recuperación */
  recoveryChartAxisX: 'dias' | 'semanas' | 'meses' = 'meses';
  readonly recoveryAxisXOptions: { value: 'dias' | 'semanas' | 'meses'; label: string }[] = [
    { value: 'dias', label: 'Días' },
    { value: 'semanas', label: 'Semanas' },
    { value: 'meses', label: 'Meses' },
  ];

  // Ventas UI
  loadingVentas = true;
  showModalVenta = false;
  editingVentaId: string | null = null;
  formVenta: Partial<Venta> = {
    fecha: new Date().toISOString().slice(0, 10),
    monto: 0,
    detalle: '',
    notas: '',
  };
  formVentaItems: QuickVentaItem[] = [this.nuevoItemVenta()];
  private montoVentaAutollenado = true;

  /** Carga rápida en Resumen (enfoque mensual / hobby) — UI removida; helpers reutilizados en modal ventas */
  savingRapido = false;
  formRapidoVenta = this.nuevoFormRapido();
  private montoRapidoAutollenado = true;

  readonly comprasFiltradas = computed(() => this.filtrarPorPeriodo(this.compras()));
  readonly ventasFiltradas = computed(() => this.filtrarPorPeriodo(this.ventas()));

  readonly productosVisibles = computed(() => {
    const q = this.normalizarBusqueda(this.filtroProductoBusqueda());
    const categoria = this.filtroProductoCategoria();
    return this.productos()
      .filter((p) => {
        if (categoria && p.categoria !== categoria) return false;
        if (!q) return true;
        const texto = [p.nombre, p.precio, p.descripcion, p.categoria].join(' ').toLowerCase();
        return texto.includes(q);
      })
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  });

  readonly comprasVisibles = computed(() => {
    const q = this.normalizarBusqueda(this.filtroCompraBusqueda());
    return this.comprasFiltradas().filter((c) => {
      if (!q) return true;
      const texto = [c.concepto, c.proveedor, c.notas, c.cantidad, c.unidad].join(' ').toLowerCase();
      return texto.includes(q);
    });
  });

  readonly ventasVisibles = computed(() => {
    const q = this.normalizarBusqueda(this.filtroVentaBusqueda());
    return this.ventasFiltradas().filter((v) => {
      if (!q) return true;
      const texto = [v.detalle, v.notas, String(v.monto)].join(' ').toLowerCase();
      return texto.includes(q);
    });
  });

  readonly productosParaRapido = computed(() =>
    [...this.productos()].sort((a, b) =>
      (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
    )
  );

  readonly ventasEsteMes = computed(() => {
    const { inicio, fin } = this.getRangoMensual();
    return this.ventas()
      .filter((v) => {
        const f = this.normalizarFecha(v.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  });

  readonly inversionInsumosEsteMes = computed(() => {
    const { inicio, fin } = this.getRangoMensual();
    return this.compras()
      .filter((c) => {
        const f = this.normalizarFecha(c.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  });

  readonly ventasMesAnterior = computed(() => {
    const { inicio, fin } = this.getRangoMesAnterior();
    return this.ventas()
      .filter((v) => {
        const f = this.normalizarFecha(v.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  });

  readonly comprasMesAnterior = computed(() => {
    const { inicio, fin } = this.getRangoMesAnterior();
    return this.compras()
      .filter((c) => {
        const f = this.normalizarFecha(c.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  });

  readonly gastosFijosMensuales = computed(
    () => Number(this.dashboardConfig().gastos_fijos_mensuales) || 0
  );

  readonly metaVentasMensual = computed(
    () => Number(this.dashboardConfig().meta_ventas_mensual) || 0
  );

  readonly flujoCajaNetoEsteMes = computed(
    () => this.ventasEsteMes() - this.inversionInsumosEsteMes() - this.gastosFijosMensuales()
  );

  readonly flujoCajaEsteMes = computed(
    () => this.ventasEsteMes() - this.inversionInsumosEsteMes()
  );

  readonly promedioVentaDiaria = computed(
    () => this.ventasEsteMes() / this.diasTranscurridosMes()
  );

  readonly proyeccionVentasFinMes = computed(
    () => this.promedioVentaDiaria() * this.diasDelMesActual()
  );

  readonly progresoMetaVentas = computed(() => {
    const meta = this.metaVentasMensual();
    if (meta <= 0) return 0;
    return Math.min((this.ventasEsteMes() / meta) * 100, 100);
  });

  readonly montoFaltanteMeta = computed(() =>
    Math.max(this.metaVentasMensual() - this.ventasEsteMes(), 0)
  );

  readonly proyeccionCumpleMeta = computed(() => {
    const meta = this.metaVentasMensual();
    return meta > 0 && this.proyeccionVentasFinMes() >= meta;
  });

  readonly variacionPorcentualVentas = computed(() => {
    const actual = this.ventasEsteMes();
    const anterior = this.ventasMesAnterior();
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  });

  readonly variacionPorcentualCompras = computed(() => {
    const actual = this.inversionInsumosEsteMes();
    const anterior = this.comprasMesAnterior();
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  });

  readonly ventasPorDiaEsteMes = computed(() => {
    const { inicio, fin } = this.getRangoMensual();
    const ventasPorDia: Record<string, number> = {};
    this.ventas()
      .filter((v) => {
        const f = this.normalizarFecha(v.fecha);
        return f && f >= inicio && f <= fin;
      })
      .forEach((v) => {
        const f = this.normalizarFecha(v.fecha);
        if (f) ventasPorDia[f] = (ventasPorDia[f] ?? 0) + (Number(v.monto) || 0);
      });
    return ventasPorDia;
  });

  readonly mejorDiaVentas = computed(() => {
    const entries = Object.entries(this.ventasPorDiaEsteMes());
    if (entries.length === 0) return null;
    const [fecha, total] = entries.reduce((best, current) =>
      current[1] > best[1] ? current : best
    );
    return { fecha, total };
  });

  readonly actividadReciente = computed(() => {
    const ventas = this.ventas().map((v, index) => ({
      id: v.id ?? `venta-${index}-${v.fecha}`,
      fecha: this.normalizarFecha(v.fecha),
      tipo: 'venta' as const,
      titulo: 'Venta registrada',
      detalle: v.detalle || v.notas || 'Sin detalle',
      monto: Number(v.monto) || 0,
    }));

    const compras = this.compras().map((c, index) => ({
      id: c.id ?? `compra-${index}-${c.fecha}`,
      fecha: this.normalizarFecha(c.fecha),
      tipo: 'compra' as const,
      titulo: 'Compra de insumo',
      detalle: c.proveedor ? `${c.concepto} - ${c.proveedor}` : c.concepto,
      monto: Number(c.monto) || 0,
    }));

    return [...ventas, ...compras]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 6);
  });

  readonly rankingProductosDelMes = computed(() => {
    const { inicio, fin } = this.getRangoMensual();
    const ventasMes = this.ventas().filter((v) => {
      const f = this.normalizarFecha(v.fecha);
      return f && f >= inicio && f <= fin;
    });
    const catalogo = [...this.productos()]
      .filter((p) => (p.nombre || '').trim().length >= 2)
      .sort((a, b) => (b.nombre?.length || 0) - (a.nombre?.length || 0));

    if (ventasMes.length === 0 || catalogo.length === 0) return [] as ProductoRankingMes[];

    const contadores = new Map<
      string,
      { producto: Producto; unidades: number; menciones: number; montoEstimado: number }
    >();

    for (const venta of ventasMes) {
      const items = parseVentaDetalle(venta.detalle);
      if (items.length === 0) continue;
      const matchedInVenta = new Set<string>();
      const totalUnidades = items.reduce((s, i) => s + i.cantidad, 0) || 1;
      const montoVenta = Number(venta.monto) || 0;

      for (const item of items) {
        const producto = this.matchProductoCatalogo(item.nombre, catalogo);
        if (!producto) continue;
        const key = producto.id || producto.nombre;
        const share = (item.cantidad / totalUnidades) * montoVenta;
        const prev = contadores.get(key);
        if (prev) {
          prev.unidades += item.cantidad;
          prev.montoEstimado += share;
          if (!matchedInVenta.has(key)) {
            prev.menciones += 1;
            matchedInVenta.add(key);
          }
        } else {
          contadores.set(key, {
            producto,
            unidades: item.cantidad,
            menciones: 1,
            montoEstimado: share,
          });
          matchedInVenta.add(key);
        }
      }
    }

    return [...contadores.values()]
      .map(({ producto, unidades, menciones, montoEstimado }) => ({
        nombre: producto.nombre,
        categoria: producto.categoria || '',
        img: producto.img || '',
        unidades,
        menciones,
        montoEstimado: Math.round(montoEstimado),
      }))
      .sort((a, b) => b.unidades - a.unidades || b.montoEstimado - a.montoEstimado);
  });

  readonly topProductosDelMes = computed(() => this.rankingProductosDelMes().slice(0, 5));

  readonly nombreMesActual = computed(() =>
    new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  );

  constructor(
    public prod: ProductosService,
    private comprasSvc: ComprasService,
    private ventasSvc: VentasService,
    private adminConfigSvc: AdminConfigService
  ) {
    this.categorias = prod.getCategorias();
  }

  initialize(): void {
    this.cargarConfig();
    this.cargar();
    this.cargarCompras();
    this.cargarVentas();
  }

  clearAlerts(): void {
    this.error = '';
    this.success = '';
  }

  getRangoMensual(): { inicio: string; fin: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const ultimoDia = new Date(y, now.getMonth() + 1, 0).getDate();
    return {
      inicio: `${y}-${m}-01`,
      fin: `${y}-${m}-${String(ultimoDia).padStart(2, '0')}`,
    };
  }

  getRangoSemestral(): { inicio: string; fin: string } {
    const fin = new Date();
    const inicio = new Date(fin);
    inicio.setMonth(inicio.getMonth() - 6);
    return {
      inicio: inicio.toISOString().slice(0, 10),
      fin: fin.toISOString().slice(0, 10),
    };
  }

  getRangoMesAnterior(): { inicio: string; fin: string } {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    const ultimoDia = new Date(y, prev.getMonth() + 1, 0).getDate();
    return {
      inicio: `${y}-${m}-01`,
      fin: `${y}-${m}-${String(ultimoDia).padStart(2, '0')}`,
    };
  }

  normalizarFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const s = typeof fecha === 'string' ? fecha : String(fecha);
    return s.slice(0, 10);
  }

  filtrarPorPeriodo<T extends { fecha?: string | null }>(items: T[]): T[] {
    const periodo = this.periodo();
    if (periodo === 'total') return items;
    const { inicio, fin } =
      periodo === 'mensual' ? this.getRangoMensual() : this.getRangoSemestral();
    return items.filter((item) => {
      const f = this.normalizarFecha(item.fecha);
      return f && f >= inicio && f <= fin;
    });
  }

  normalizarBusqueda(texto: string): string {
    return texto.trim().toLowerCase();
  }

  productosEnCategoria(categoria: string): Producto[] {
    return this.productos()
      .filter((p) => p.categoria === categoria)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  }

  private normalizarTextoProducto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/×/g, 'x')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private matchProductoCatalogo(nombreItem: string, catalogo: Producto[]): Producto | null {
    const target = this.normalizarTextoProducto(nombreItem);
    if (!target) return null;
    const exact = catalogo.find((p) => this.normalizarTextoProducto(p.nombre || '') === target);
    if (exact) return exact;
    return (
      catalogo.find((p) => {
        const n = this.normalizarTextoProducto(p.nombre || '');
        return n.length >= 2 && (target.includes(n) || n.includes(target));
      }) ?? null
    );
  }

  puedeMoverProducto(p: Producto, dir: -1 | 1): boolean {
    const list = this.productosEnCategoria(p.categoria);
    const idx = list.findIndex((x) => x.id === p.id);
    const swapIdx = idx + dir;
    return idx >= 0 && swapIdx >= 0 && swapIdx < list.length;
  }

  moverProducto(p: Producto, dir: -1 | 1): void {
    if (!p.id || this.reordenandoProductoId) return;
    const list = this.productosEnCategoria(p.categoria);
    const idx = list.findIndex((x) => x.id === p.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const other = list[swapIdx];
    if (!other.id) return;

    const ordenP = p.orden ?? idx;
    const ordenO = other.orden ?? swapIdx;
    this.reordenandoProductoId = p.id;
    this.error = '';
    this.success = '';

    forkJoin([
      this.prod.actualizar(p.id, { orden: ordenO }),
      this.prod.actualizar(other.id, { orden: ordenP }),
    ]).subscribe({
      next: ([r1, r2]) => {
        this.reordenandoProductoId = null;
        if (r1.error || r2.error) {
          this.error = r1.error ?? r2.error ?? 'Error al reordenar';
          return;
        }
        this.success = 'Orden del catálogo actualizado.';
        this.cargar();
      },
      error: () => {
        this.reordenandoProductoId = null;
        this.error = 'Error al reordenar';
      },
    });
  }

  exportarComprasCsv(): void {
    const rows = this.comprasVisibles().map((c) => ({
      fecha: this.normalizarFecha(c.fecha),
      concepto: c.concepto,
      cantidad: c.cantidad ?? '',
      unidad: c.unidad ?? '',
      monto: Number(c.monto) || 0,
      proveedor: c.proveedor ?? '',
      notas: c.notas ?? '',
    }));
    if (rows.length === 0) {
      this.error = 'No hay compras para exportar con los filtros actuales.';
      return;
    }
    this.descargarCsv(Papa.unparse(rows), `compras-${this.periodo()}-${this.fechaExportacion()}.csv`);
    this.success = `Se exportaron ${rows.length} compras.`;
  }

  exportarVentasCsv(): void {
    const rows = this.ventasVisibles().map((v) => ({
      fecha: this.normalizarFecha(v.fecha),
      monto: Number(v.monto) || 0,
      detalle: v.detalle ?? '',
      notas: v.notas ?? '',
    }));
    if (rows.length === 0) {
      this.error = 'No hay ventas para exportar con los filtros actuales.';
      return;
    }
    this.descargarCsv(Papa.unparse(rows), `ventas-${this.periodo()}-${this.fechaExportacion()}.csv`);
    this.success = `Se exportaron ${rows.length} ventas.`;
  }

  private fechaExportacion(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private descargarCsv(contenido: string, nombre: string): void {
    const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
    URL.revokeObjectURL(url);
  }

  cargarConfig(): void {
    this.loadingConfig = true;
    this.adminConfigSvc.getConfig().subscribe((config) => {
      this.dashboardConfig.set(config);
      this.dashboardConfigForm = {
        meta_ventas_mensual: config.meta_ventas_mensual,
        gastos_fijos_mensuales: config.gastos_fijos_mensuales,
      };
      this.loadingConfig = false;
    });
  }

  guardarConfig(): void {
    this.savingConfig = true;
    this.error = '';
    this.success = '';
    const data = {
      meta_ventas_mensual: Number(this.dashboardConfigForm.meta_ventas_mensual) || 0,
      gastos_fijos_mensuales: Number(this.dashboardConfigForm.gastos_fijos_mensuales) || 0,
    };

    this.adminConfigSvc.guardar(data).subscribe((res) => {
      this.savingConfig = false;
      if (res.error) {
        this.error = res.error;
        return;
      }
      const saved = res.config ?? { id: true, ...data };
      this.dashboardConfig.set(saved);
      this.dashboardConfigForm = {
        meta_ventas_mensual: saved.meta_ventas_mensual,
        gastos_fijos_mensuales: saved.gastos_fijos_mensuales,
      };
      this.success = 'Configuración del dashboard guardada.';
    });
  }

  cargar(): void {
    this.loading = true;
    this.prod.getProductos().subscribe((data) => {
      this.productos.set(data);
      this.loading = false;
    });
  }

  cargarCompras(): void {
    this.loadingCompras = true;
    this.comprasSvc.getAll().subscribe((data) => {
      this.compras.set(data);
      this.loadingCompras = false;
    });
  }

  cargarVentas(): void {
    this.loadingVentas = true;
    this.ventasSvc.getAll().subscribe((data) => {
      this.ventas.set(data);
      this.loadingVentas = false;
    });
  }

  renderChartDelayed(getCanvas: () => HTMLCanvasElement | null | undefined, getRecoveryCanvas: () => HTMLCanvasElement | null | undefined): void {
    if (this.chartRenderTimeout) clearTimeout(this.chartRenderTimeout);
    this.chartRenderTimeout = setTimeout(() => {
      this.chartRenderTimeout = null;
      this.renderChart(getCanvas());
      setTimeout(() => this.renderRecoveryChart(getRecoveryCanvas()), 100);
    }, 150);
  }

  setPeriodoTendencia(
    value: string,
    getCanvas: () => HTMLCanvasElement | null | undefined
  ): void {
    if (value === '7d' || value === '30d' || value === '6m') {
      this.periodoTendencia = value;
      this.renderTendenciaDelayed(getCanvas);
    }
  }

  onPeriodoChange(
    getCanvas: () => HTMLCanvasElement | null | undefined,
    getRecoveryCanvas: () => HTMLCanvasElement | null | undefined
  ): void {
    this.renderChartDelayed(getCanvas, getRecoveryCanvas);
  }

  renderChart(canvas?: HTMLCanvasElement | null): void {
    if (!canvas) return;

    const totalV = this.totalVentas();
    const totalC = this.totalCompras();
    const maxVal = Math.max(totalV, totalC, 1);

    this.destroyChart();

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Ventas', 'Compras'],
        datasets: [
          {
            label: 'Monto ($)',
            data: [totalV, totalC],
            backgroundColor: ['rgba(40, 167, 69, 0.7)', 'rgba(220, 53, 69, 0.7)'],
            borderColor: ['rgb(40, 167, 69)', 'rgb(220, 53, 69)'],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: `Ventas vs Compras (${this.periodo()})`,
            color: '#fff',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#adb5bd' },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
          x: {
            ticks: { color: '#adb5bd' },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
        },
      },
    });
  }

  destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  destroyRecoveryChart(): void {
    if (this.recoveryChart) {
      this.recoveryChart.destroy();
      this.recoveryChart = null;
    }
  }

  /** Gráfico: gastos constantes (inversión), ventas acumuladas, proyección punteada de recuperación */
  renderRecoveryChart(canvas?: HTMLCanvasElement | null): void {
    if (!canvas) return;

    const inv = this.inversionInsumosEsteMes();
    const ventasMes = this.ventasEsteMes();
    const { inicio, fin } = this.getRangoMensual();
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();

    this.destroyRecoveryChart();

    if (inv <= 0) return;

    const ventasPorDia: Record<number, number> = {};
    for (let d = 1; d <= ultimoDia; d++) ventasPorDia[d] = 0;
    this.ventas()
      .filter((v) => {
        const f = this.normalizarFecha(v.fecha);
        return f && f >= inicio && f <= fin;
      })
      .forEach((v) => {
        const d = parseInt(String(v.fecha).slice(8, 10), 10) || 1;
        ventasPorDia[d] = (ventasPorDia[d] ?? 0) + (Number(v.monto) || 0);
      });

    let acum = 0;
    const ventasAcumuladas: (number | null)[] = [];
    for (let d = 1; d <= ultimoDia; d++) {
      acum += ventasPorDia[d] ?? 0;
      ventasAcumuladas.push(d <= diaHoy ? acum : null);
    }

    const ritmoDiario = ventasMes > 0 ? ventasMes / 30 : 0;
    const diasParaRecuperar = ritmoDiario > 0 ? Math.ceil(inv / ritmoDiario) : null;
    const diaRecuperacion = diasParaRecuperar != null ? diaHoy + diasParaRecuperar : null;

    const ventasHastaHoy = ventasAcumuladas[Math.min(diaHoy - 1, ventasAcumuladas.length - 1)] ?? 0;
    const maxDia =
      diaRecuperacion != null
        ? Math.ceil(diaRecuperacion) + 3
        : Math.min(Math.max(ultimoDia, diaHoy + 15), diaHoy + 20);

    const unit = this.recoveryChartAxisX;
    const xStep = unit === 'dias' ? 1 : unit === 'semanas' ? 7 : 30;
    const numPoints = Math.ceil(maxDia / xStep);
    const labelPrefix = unit === 'dias' ? 'Día' : unit === 'semanas' ? 'Semana' : 'Mes';

    const labels: string[] = [];
    const datosInversion: number[] = [];
    const datosVentas: (number | null)[] = [];
    const datosProyeccion: (number | null)[] = [];

    for (let i = 0; i < numPoints; i++) {
      const d = (i + 1) * xStep;
      labels.push(`${labelPrefix} ${i + 1}`);
      datosInversion.push(inv);
      const diaEfectivo = Math.min(d, ultimoDia);
      datosVentas.push(diaEfectivo <= diaHoy ? (ventasAcumuladas[diaEfectivo - 1] ?? 0) : null);
      if (d > diaHoy && ritmoDiario > 0) {
        const proy = ventasHastaHoy + ritmoDiario * (d - diaHoy);
        datosProyeccion.push(proy);
      } else {
        datosProyeccion.push(null);
      }
    }

    const maxData = Math.max(inv, ventasMes, 1) * 1.15;
    const stepVal = Number(this.recoveryChartScale) || 0;
    const step = stepVal > 0 ? stepVal : undefined;
    let yMax: number;
    let stepSize: number | undefined;
    if (step && step > 0) {
      yMax = Math.ceil(maxData / step) * step;
      yMax = Math.max(yMax, step);
      stepSize = step;
    } else {
      yMax = Math.min(maxData, 1_000_000);
      stepSize = undefined;
    }

    this.recoveryChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Inversión en insumos (a recuperar)',
            data: datosInversion,
            borderColor: 'rgb(220, 53, 69)',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0,
          },
          {
            label: 'Ventas acumuladas',
            data: datosVentas,
            borderColor: 'rgb(40, 167, 69)',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
          {
            label: 'Proyección (ritmo actual)',
            data: datosProyeccion,
            borderColor: 'rgb(255, 193, 7)',
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            tension: 0,
            pointRadius: datosProyeccion.map((v) => (v != null ? 3 : 0)),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#adb5bd', usePointStyle: true },
          },
          title: {
            display: true,
            text: '¿Cuándo recuperamos la inversión en insumos?',
            color: '#fff',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: yMax,
            ticks: {
              color: '#adb5bd',
              callback: (v) => '$' + Number(v).toLocaleString(),
              ...(stepSize != null && { stepSize }),
            },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
          x: {
            ticks: { color: '#adb5bd', maxRotation: 45 },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    if (this.chartRenderTimeout) clearTimeout(this.chartRenderTimeout);
    this.destroyChart();
    this.destroyRecoveryChart();
    this.destroyTendenciaChart();
  }

  importar(): void {
    this.importando = true;
    this.error = '';
    this.success = '';
    this.prod.importarDesdeSheets().subscribe((res) => {
      this.importando = false;
      if (res.error) this.error = res.error;
      else {
        this.success = `Se importaron ${res.count} productos.`;
        this.cargar();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      this.error = 'Seleccioná una imagen (JPG, PNG, etc.)';
      return;
    }
    this.subiendoImg = true;
    this.error = '';
    this.prod.subirImagen(file).subscribe((res) => {
      this.subiendoImg = false;
      input.value = '';
      if ('error' in res) this.error = res.error;
      else if (this.form) this.form.img = res.url;
    });
  }

  private toNullableNumber(value: unknown): number | null {
    if (value == null || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private emptyProductoForm(): Partial<Producto> {
    return {
      nombre: '',
      precio: '',
      precio_num: null,
      precio_mayorista: null,
      min_mayorista: 4,
      precio_a_consultar: false,
      descripcion: '',
      img: '',
      categoria: 'cafe',
    };
  }

  onPrecioEstructuradoChange(): void {
    if (this.form.precio_a_consultar) {
      this.form.precio = 'Consultar';
      return;
    }
    this.form.precio = syncPrecioDisplay(this.form);
  }

  abrirNuevo(): void {
    this.showModal = true;
    this.editingId = null;
    this.form = this.emptyProductoForm();
    this.error = '';
    this.success = '';
  }

  abrirEditar(p: Producto): void {
    this.showModal = true;
    this.editingId = p.id ?? null;
    this.form = {
      ...p,
      precio_num: p.precio_num ?? this.parsePrecioProducto(p.precio),
      precio_mayorista: p.precio_mayorista ?? null,
      min_mayorista: p.min_mayorista ?? 4,
      precio_a_consultar: !!p.precio_a_consultar,
    };
    this.error = '';
    this.success = '';
  }

  guardar(): void {
    if (!this.form?.nombre?.trim()) {
      this.error = 'El nombre es obligatorio';
      return;
    }
    const categoria = this.form.categoria ?? 'cafe';
    const aConsultar = !!this.form.precio_a_consultar;
    const precioNum = aConsultar ? null : this.toNullableNumber(this.form.precio_num);
    const precioMayorista = this.toNullableNumber(this.form.precio_mayorista);
    const minRaw = this.toNullableNumber(this.form.min_mayorista);
    const minMayorista = minRaw != null && minRaw >= 1 ? Math.round(minRaw) : 4;
    const data: Omit<Producto, 'id'> = {
      nombre: this.form.nombre.trim(),
      precio: syncPrecioDisplay({
        precio_a_consultar: aConsultar,
        precio_num: precioNum,
        precio: this.form.precio,
      }),
      precio_num: precioNum,
      precio_mayorista: precioMayorista,
      min_mayorista: minMayorista,
      precio_a_consultar: aConsultar,
      descripcion: this.form.descripcion ?? '',
      img: this.form.img ?? '',
      categoria,
    };
    if (this.editingId) {
      this.prod.actualizar(this.editingId, data).subscribe((res) => {
        if (res.error) this.error = res.error;
        else {
          this.success = 'Producto actualizado.';
          this.cargar();
          this.cerrarModal();
        }
      });
    } else {
      const maxOrden = this.productosEnCategoria(categoria).reduce(
        (max, p) => Math.max(max, p.orden ?? 0),
        -1
      );
      this.prod.crear({ ...data, orden: maxOrden + 1 }).subscribe((res) => {
        if ('error' in res) this.error = res.error;
        else {
          this.success = 'Producto creado.';
          this.cargar();
          this.cerrarModal();
        }
      });
    }
  }

  eliminar(p: Producto): void {
    if (!p.id || !confirm(`¿Eliminar "${p.nombre}"?`)) return;
    this.prod.eliminar(p.id).subscribe((res) => {
      if (res.error) this.error = res.error;
      else {
        this.success = 'Producto eliminado.';
        this.cargar();
      }
    });
  }

  cerrarModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.form = this.emptyProductoForm();
  }

  // --- Compras ---
  abrirNuevoCompra(): void {
    this.showModalCompra = true;
    this.editingCompraId = null;
    this.formCompra = {
      fecha: new Date().toISOString().slice(0, 10),
      concepto: '',
      cantidad: '',
      unidad: '',
      monto: 0,
      proveedor: '',
      notas: '',
    };
    this.error = '';
    this.success = '';
  }

  abrirEditarCompra(c: CompraInsumo): void {
    this.showModalCompra = true;
    this.editingCompraId = c.id ?? null;
    this.formCompra = { ...c };
    if (c.fecha && typeof c.fecha === 'string' && c.fecha.length > 10) {
      this.formCompra.fecha = (c.fecha as string).slice(0, 10);
    }
    this.error = '';
    this.success = '';
  }

  guardarCompra(): void {
    if (!this.formCompra?.concepto?.trim()) {
      this.error = 'El concepto es obligatorio';
      return;
    }
    const monto = Number(this.formCompra.monto) || 0;
    const data: Omit<CompraInsumo, 'id'> = {
      fecha: this.formCompra.fecha!,
      concepto: this.formCompra.concepto.trim(),
      cantidad: this.formCompra.cantidad ?? '',
      unidad: this.formCompra.unidad ?? '',
      monto,
      proveedor: this.formCompra.proveedor ?? '',
      notas: this.formCompra.notas ?? '',
    };
    if (this.editingCompraId) {
      this.comprasSvc.actualizar(this.editingCompraId, data).subscribe((res) => {
        if (res.error) this.error = res.error;
        else {
          this.success = 'Compra actualizada.';
          this.cargarCompras();
          this.cerrarModalCompra();
        }
      });
    } else {
      this.comprasSvc.crear(data).subscribe((res) => {
        if ('error' in res) this.error = res.error;
        else {
          this.success = 'Compra registrada.';
          this.cargarCompras();
          this.cerrarModalCompra();
        }
      });
    }
  }

  eliminarCompra(c: CompraInsumo): void {
    if (!c.id || !confirm(`¿Eliminar compra "${c.concepto}"?`)) return;
    this.comprasSvc.eliminar(c.id).subscribe((res) => {
      if (res.error) this.error = res.error;
      else {
        this.success = 'Compra eliminada.';
        this.cargarCompras();
      }
    });
  }

  cerrarModalCompra(): void {
    this.showModalCompra = false;
    this.editingCompraId = null;
  }

  // --- Ventas ---
  private nuevoItemVenta(): QuickVentaItem {
    return { productoId: '', cantidad: 1, query: '' };
  }

  abrirNuevoVenta(): void {
    this.showModalVenta = true;
    this.editingVentaId = null;
    this.formVenta = {
      fecha: new Date().toISOString().slice(0, 10),
      monto: 0,
      detalle: '',
      notas: '',
    };
    this.formVentaItems = [this.nuevoItemVenta()];
    this.montoVentaAutollenado = true;
    this.error = '';
    this.success = '';
  }

  abrirEditarVenta(v: Venta): void {
    this.showModalVenta = true;
    this.editingVentaId = v.id ?? null;
    this.formVenta = { ...v };
    if (v.fecha && typeof v.fecha === 'string' && v.fecha.length > 10) {
      this.formVenta.fecha = (v.fecha as string).slice(0, 10);
    }
    this.formVentaItems = this.itemsDesdeDetalle(v.detalle);
    this.montoVentaAutollenado = false;
    this.error = '';
    this.success = '';
  }

  private itemsDesdeDetalle(detalle: string | null | undefined): QuickVentaItem[] {
    const parsed = parseVentaDetalle(detalle);
    if (parsed.length === 0) return [this.nuevoItemVenta()];

    const items = parsed.map((part) => {
      const match = this.productos().find(
        (p) => p.nombre.trim().toLowerCase() === part.nombre.trim().toLowerCase()
      );
      return {
        productoId: match?.id ?? '',
        cantidad: Math.max(1, part.cantidad || 1),
        query: match?.nombre ?? part.nombre,
      };
    });
    return items.length > 0 ? items : [this.nuevoItemVenta()];
  }

  agregarProductoVenta(): void {
    this.formVentaItems = [...this.formVentaItems, this.nuevoItemVenta()];
  }

  quitarProductoVenta(index: number): void {
    if (this.formVentaItems.length <= 1) {
      this.formVentaItems = [this.nuevoItemVenta()];
      this.onVentaItemsChange();
      return;
    }
    this.formVentaItems = this.formVentaItems.filter((_, i) => i !== index);
    this.onVentaItemsChange();
  }

  productosSugeridosVenta(query: string, productoId: string): Producto[] {
    const q = this.normalizarBusqueda(query);
    const list = this.productosParaRapido();
    if (!q) return list.slice(0, 8);
    return list
      .filter((p) => {
        if (p.id === productoId) return true;
        return (p.nombre || '').toLowerCase().includes(q);
      })
      .slice(0, 10);
  }

  seleccionarProductoVenta(index: number, p: Producto): void {
    const items = [...this.formVentaItems];
    const current = items[index];
    if (!current) return;
    items[index] = {
      ...current,
      productoId: p.id ?? '',
      query: p.nombre,
    };
    this.formVentaItems = items;
    this.onVentaItemsChange();
  }

  onVentaItemQueryChange(index: number, query: string): void {
    const items = [...this.formVentaItems];
    const current = items[index];
    if (!current) return;
    const exact = this.productos().find(
      (p) => p.nombre.trim().toLowerCase() === query.trim().toLowerCase()
    );
    items[index] = {
      ...current,
      query,
      productoId: exact?.id ?? '',
    };
    this.formVentaItems = items;
    this.onVentaItemsChange();
  }

  onVentaItemsChange(): void {
    if (!this.montoVentaAutollenado) return;
    const estimado = this.estimadoMontoVenta();
    this.formVenta.monto = estimado;
  }

  onMontoVentaManual(): void {
    this.montoVentaAutollenado = false;
  }

  estimadoMontoVenta(): number {
    return this.formVentaItems.reduce((sum, item) => {
      if (!item.productoId) return sum;
      const p = this.productos().find((x) => x.id === item.productoId);
      const qty = Math.max(1, Number(item.cantidad) || 1);
      const unit = this.unitarioProductoRapido(p, qty);
      if (unit == null) return sum;
      return sum + unit * qty;
    }, 0);
  }

  armarDetalleVenta(): string {
    const parts = this.formVentaItems
      .filter((item) => item.productoId || item.query.trim())
      .map((item) => {
        const p = this.productos().find((x) => x.id === item.productoId);
        const nombre = p?.nombre?.trim() || item.query.trim() || 'Producto';
        const qty = Math.max(1, Number(item.cantidad) || 1);
        return qty > 1 ? `${qty}× ${nombre}` : nombre;
      });
    return parts.join(' · ');
  }

  private nuevoFormRapido(): {
    fecha: string;
    monto: number;
    notas: string;
    items: QuickVentaItem[];
  } {
    return {
      fecha: new Date().toISOString().slice(0, 10),
      monto: 0,
      notas: '',
      items: [this.nuevoItemVenta(), this.nuevoItemVenta()],
    };
  }

  parsePrecioProducto(precio: string | null | undefined): number | null {
    return parsePrecio(precio);
  }

  unitarioProductoRapido(p: Producto | undefined, cantidad: number): number | null {
    if (!p || p.precio_a_consultar) return null;
    const qty = Math.max(1, Number(cantidad) || 1);
    const minMayorista = p.min_mayorista ?? 4;
    if (
      p.precio_mayorista != null &&
      Number.isFinite(Number(p.precio_mayorista)) &&
      qty >= minMayorista
    ) {
      return Number(p.precio_mayorista);
    }
    if (p.precio_num != null && Number.isFinite(Number(p.precio_num))) {
      return Number(p.precio_num);
    }
    return this.parsePrecioProducto(p.precio);
  }

  aplicaMayoristaVenta(item: QuickVentaItem): boolean {
    if (!item.productoId) return false;
    const p = this.productos().find((x) => x.id === item.productoId);
    if (!p || p.precio_mayorista == null || !Number.isFinite(Number(p.precio_mayorista))) {
      return false;
    }
    const qty = Math.max(1, Number(item.cantidad) || 1);
    const min = p.min_mayorista ?? 4;
    return qty >= min;
  }

  hintMayoristaVenta(item: QuickVentaItem): string {
    if (!item.productoId) return '';
    const p = this.productos().find((x) => x.id === item.productoId);
    if (!p || p.precio_mayorista == null) return '';
    const min = p.min_mayorista ?? 4;
    const mayorista = Math.round(Number(p.precio_mayorista));
    if (this.aplicaMayoristaVenta(item)) {
      return `Precio mayorista (${min}+): $${mayorista} c/u`;
    }
    return `Desde ${min} u: $${mayorista} c/u`;
  }

  hayMayoristaEnVenta(): boolean {
    return this.formVentaItems.some((item) => this.aplicaMayoristaVenta(item));
  }

  estimadoMontoRapido(): number {
    return this.formRapidoVenta.items.reduce((sum, item) => {
      if (!item.productoId) return sum;
      const p = this.productos().find((x) => x.id === item.productoId);
      const qty = Math.max(1, Number(item.cantidad) || 1);
      const unit = this.unitarioProductoRapido(p, qty);
      if (unit == null) return sum;
      return sum + unit * qty;
    }, 0);
  }

  onItemRapidoChange(): void {
    if (!this.montoRapidoAutollenado) return;
    const estimado = this.estimadoMontoRapido();
    if (estimado > 0) {
      this.formRapidoVenta.monto = estimado;
    }
  }

  onMontoRapidoManual(): void {
    this.montoRapidoAutollenado = false;
  }

  armarDetalleRapido(): string {
    const parts = this.formRapidoVenta.items
      .filter((item) => item.productoId)
      .map((item) => {
        const p = this.productos().find((x) => x.id === item.productoId);
        const nombre = p?.nombre?.trim() || 'Producto';
        const qty = Math.max(1, Number(item.cantidad) || 1);
        return qty > 1 ? `${qty}× ${nombre}` : nombre;
      });
    return parts.join(' · ');
  }

  guardarVentaRapida(): void {
    const monto = Number(this.formRapidoVenta.monto) || 0;
    if (monto <= 0) {
      this.error = 'Indicá el monto de la venta.';
      this.success = '';
      return;
    }
    if (!this.formRapidoVenta.fecha) {
      this.error = 'Indicá la fecha.';
      this.success = '';
      return;
    }

    const detalle = this.armarDetalleRapido();
    const data: Omit<Venta, 'id'> = {
      fecha: this.formRapidoVenta.fecha,
      monto,
      detalle,
      notas: (this.formRapidoVenta.notas || '').trim(),
    };

    this.savingRapido = true;
    this.error = '';
    this.success = '';
    this.ventasSvc.crear(data).subscribe((res) => {
      this.savingRapido = false;
      if ('error' in res) {
        this.error = res.error;
        return;
      }
      this.success = detalle
        ? `Venta registrada: ${detalle} ($${monto.toLocaleString('es-AR')}).`
        : `Venta de $${monto.toLocaleString('es-AR')} registrada.`;
      this.formRapidoVenta = this.nuevoFormRapido();
      this.montoRapidoAutollenado = true;
      this.cargarVentas();
    });
  }

  guardarVenta(): void {
    const monto = Number(this.formVenta?.monto) || 0;
    if (monto <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return;
    }
    const detalle = this.armarDetalleVenta() || (this.formVenta?.detalle ?? '');
    const data: Omit<Venta, 'id'> = {
      fecha: this.formVenta!.fecha!,
      monto,
      detalle,
      notas: this.formVenta?.notas ?? '',
    };
    if (this.editingVentaId) {
      this.ventasSvc.actualizar(this.editingVentaId, data).subscribe((res) => {
        if (res.error) this.error = res.error;
        else {
          this.success = 'Venta actualizada.';
          this.cargarVentas();
          this.cerrarModalVenta();
        }
      });
    } else {
      this.ventasSvc.crear(data).subscribe((res) => {
        if ('error' in res) this.error = res.error;
        else {
          this.success = 'Venta registrada.';
          this.cargarVentas();
          this.cerrarModalVenta();
        }
      });
    }
  }

  eliminarVenta(v: Venta): void {
    if (!v.id || !confirm(`¿Eliminar venta del ${v.fecha} por $${v.monto}?`)) return;
    this.ventasSvc.eliminar(v.id).subscribe((res) => {
      if (res.error) this.error = res.error;
      else {
        this.success = 'Venta eliminada.';
        this.cargarVentas();
      }
    });
  }

  cerrarModalVenta(): void {
    this.showModalVenta = false;
    this.editingVentaId = null;
    this.formVentaItems = [this.nuevoItemVenta()];
    this.montoVentaAutollenado = true;
  }

  totalCompras(): number {
    return this.comprasFiltradas().reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  }

  totalComprasVisibles(): number {
    return this.comprasVisibles().reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  }

  totalVentas(): number {
    return this.ventasFiltradas().reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  }

  totalVentasVisibles(): number {
    return this.ventasVisibles().reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  }

  diasTranscurridosMes(): number {
    return Math.max(new Date().getDate(), 1);
  }

  diasDelMesActual(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }

  formatearFechaCorta(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    const [year, month, day] = fecha.split('-').map((part) => Number(part));
    if (!year || !month || !day) return fecha;
    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  }

  // --- Bloque recuperación de inversión ---
  hayDatosTendencia(): boolean {
    return this.datosTendenciaVentas().data.some((d) => d > 0);
  }

  datosTendenciaVentas(): { labels: string[]; data: number[] } {
    const hoy = new Date();
    let inicio: string;
    let fin = hoy.toISOString().slice(0, 10);
    const labels: string[] = [];
    const data: number[] = [];

    if (this.periodoTendencia === '7d') {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 6);
      inicio = d.toISOString().slice(0, 10);
      const ventasPorDia: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const dd = new Date(d);
        dd.setDate(dd.getDate() + i);
        const key = dd.toISOString().slice(0, 10);
        ventasPorDia[key] = 0;
      }
      this.ventas()
        .filter((v) => {
          const f = this.normalizarFecha(v.fecha);
          return f && f >= inicio && f <= fin;
        })
        .forEach((v) => {
          const f = this.normalizarFecha(v.fecha);
          if (f) ventasPorDia[f] = (ventasPorDia[f] ?? 0) + (Number(v.monto) || 0);
        });
      const keys = Object.keys(ventasPorDia).sort();
      keys.forEach((k) => {
        labels.push(k.slice(8, 10) + '/' + k.slice(5, 7));
        data.push(ventasPorDia[k] ?? 0);
      });
    } else if (this.periodoTendencia === '30d') {
      const d = new Date(hoy);
      d.setDate(d.getDate() - 29);
      inicio = d.toISOString().slice(0, 10);
      const ventasPorDia: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const dd = new Date(d);
        dd.setDate(dd.getDate() + i);
        const key = dd.toISOString().slice(0, 10);
        ventasPorDia[key] = 0;
      }
      this.ventas()
        .filter((v) => {
          const f = this.normalizarFecha(v.fecha);
          return f && f >= inicio && f <= fin;
        })
        .forEach((v) => {
          const f = this.normalizarFecha(v.fecha);
          if (f) ventasPorDia[f] = (ventasPorDia[f] ?? 0) + (Number(v.monto) || 0);
        });
      const keys = Object.keys(ventasPorDia).sort();
      keys.forEach((k) => {
        labels.push(k.slice(8, 10) + '/' + k.slice(5, 7));
        data.push(ventasPorDia[k] ?? 0);
      });
    } else {
      const { inicio: ini, fin: f } = this.getRangoSemestral();
      inicio = ini;
      fin = f;
      const ventasPorMes: Record<string, number> = {};
      const finDate = new Date(fin);
      for (let i = 5; i >= 0; i--) {
        const m = new Date(finDate.getFullYear(), finDate.getMonth() - i, 1);
        const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        ventasPorMes[key] = 0;
      }
      this.ventas()
        .filter((v) => {
          const f2 = this.normalizarFecha(v.fecha);
          return f2 && f2 >= inicio && f2 <= fin;
        })
        .forEach((v) => {
          const f2 = this.normalizarFecha(v.fecha);
          if (f2) {
            const key = f2.slice(0, 7);
            ventasPorMes[key] = (ventasPorMes[key] ?? 0) + (Number(v.monto) || 0);
          }
        });
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const keys = Object.keys(ventasPorMes).sort();
      keys.forEach((k) => {
        const parts = k.split('-');
        const mNum = parseInt(parts[1], 10);
        labels.push(meses[mNum - 1] + ' ' + parts[0].slice(2));
        data.push(ventasPorMes[k] ?? 0);
      });
    }
    return { labels, data };
  }

  renderTendenciaDelayed(getCanvas: () => HTMLCanvasElement | null | undefined): void {
    setTimeout(() => this.renderTendenciaChart(getCanvas()), 150);
  }

  renderTendenciaChart(canvas?: HTMLCanvasElement | null): void {
    if (!canvas) return;

    const { labels, data } = this.datosTendenciaVentas();
    this.destroyTendenciaChart();

    this.tendenciaChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ventas ($)',
            data,
            borderColor: 'rgb(40, 167, 69)',
            backgroundColor: 'rgba(40, 167, 69, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Tendencia de ventas',
            color: '#fff',
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#adb5bd', callback: (v) => '$' + Number(v).toLocaleString() },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
          x: {
            ticks: { color: '#adb5bd', maxRotation: 45 },
            grid: { color: 'rgba(255,255,255,0.1)' },
          },
        },
      },
    });
  }

  destroyTendenciaChart(): void {
    if (this.tendenciaChart) {
      this.tendenciaChart.destroy();
      this.tendenciaChart = null;
    }
  }

  diasParaRecuperarSemanal(): number | null {
    const inv = this.inversionInsumosEsteMes();
    const ventasMes = this.ventasEsteMes();
    if (inv <= 0 || ventasMes <= 0) return null;
    const ritmoSemanal = ventasMes / 4.33;
    const ritmoDiario = ritmoSemanal / 7;
    return Math.ceil(inv / ritmoDiario);
  }

  diasParaRecuperarMensual(): number | null {
    const inv = this.inversionInsumosEsteMes();
    const ventasMes = this.ventasEsteMes();
    if (inv <= 0 || ventasMes <= 0) return null;
    const ritmoDiario = ventasMes / 30;
    return Math.ceil(inv / ritmoDiario);
  }

  /** Fecha estimada en que se recuperaría la inversión (ej. "22 de marzo de 2025") */
  fechaEstimadaRecuperacion(): string | null {
    const dias = this.diasParaRecuperarMensual();
    if (dias == null) return null;
    const f = new Date();
    f.setDate(f.getDate() + dias);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}`;
  }

  /** Tipo de mensaje para el bloque recuperación (evita operadores en template) */
  tipoMensajeRecuperacion(): 'ok' | 'sin-ventas' | 'sin-inversion' | 'sin-datos' {
    const inv = this.inversionInsumosEsteMes();
    const ventas = this.ventasEsteMes();
    if (this.diasParaRecuperarSemanal() !== null) return 'ok';
    if (inv > 0 && ventas <= 0) return 'sin-ventas';
    if (inv <= 0) return 'sin-inversion';
    return 'sin-datos';
  }
}
