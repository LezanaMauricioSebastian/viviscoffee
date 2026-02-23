import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductosService, Producto } from '../../core/services/productos.service';
import { ComprasService, CompraInsumo } from '../../core/services/compras.service';
import { VentasService, Venta } from '../../core/services/ventas.service';
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

type Tab = 'resumen' | 'productos' | 'compras' | 'ventas';
type Periodo = 'mensual' | 'semestral' | 'total';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit, OnDestroy {
  tab: Tab = 'resumen';
  periodo: Periodo = 'total';
  periodoTendencia: '7d' | '30d' | '6m' = '30d';
  readonly periodoTendenciaOptions: { value: '7d' | '30d' | '6m'; label: string }[] = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '6m', label: 'Últimos 6 meses' },
  ];

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('recoveryChartCanvas') recoveryChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('tendenciaChartCanvas') tendenciaChartCanvas?: ElementRef<HTMLCanvasElement>;
  private chart: Chart<'bar'> | null = null;
  private recoveryChart: Chart<'line'> | null = null;
  private tendenciaChart: Chart<'line'> | null = null;
  private chartRenderTimeout: ReturnType<typeof setTimeout> | null = null;

  // Productos
  productos: Producto[] = [];
  categorias: string[] = [];
  loading = true;
  importando = false;
  error = '';
  success = '';
  showModal = false;
  editingId: string | null = null;
  form: Partial<Producto> = { nombre: '', precio: '', descripcion: '', img: '', categoria: 'cafe' };
  subiendoImg = false;

  // Compras
  compras: CompraInsumo[] = [];
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

  // Ventas
  ventas: Venta[] = [];
  loadingVentas = true;
  showModalVenta = false;
  editingVentaId: string | null = null;
  formVenta: Partial<Venta> = {
    fecha: new Date().toISOString().slice(0, 10),
    monto: 0,
    detalle: '',
    notas: '',
  };

  constructor(
    public prod: ProductosService,
    private comprasSvc: ComprasService,
    private ventasSvc: VentasService
  ) {
    this.categorias = prod.getCategorias();
  }

  ngOnInit(): void {
    this.cargar();
    this.cargarCompras();
    this.cargarVentas();
  }

  setTab(t: Tab): void {
    this.tab = t;
    this.error = '';
    this.success = '';
    if (t === 'resumen') {
      this.cargarCompras();
      this.cargarVentas();
      this.renderTendenciaDelayed();
    }
    if (t === 'compras') {
      this.cargarCompras();
      this.cargarVentas();
      this.renderChartDelayed();
    }
    if (t === 'ventas') {
      this.cargarVentas();
      this.cargarCompras();
      this.renderChartDelayed();
    }
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
    if (this.periodo === 'total') return items;
    const { inicio, fin } =
      this.periodo === 'mensual' ? this.getRangoMensual() : this.getRangoSemestral();
    return items.filter((item) => {
      const f = this.normalizarFecha(item.fecha);
      return f && f >= inicio && f <= fin;
    });
  }

  get comprasFiltradas(): CompraInsumo[] {
    return this.filtrarPorPeriodo(this.compras);
  }

  get ventasFiltradas(): Venta[] {
    return this.filtrarPorPeriodo(this.ventas);
  }

  cargar(): void {
    this.loading = true;
    this.prod.getProductos().subscribe((data) => {
      this.productos = data;
      this.loading = false;
    });
  }

  cargarCompras(): void {
    this.loadingCompras = true;
    this.comprasSvc.getAll().subscribe((data) => {
      this.compras = data;
      this.loadingCompras = false;
      this.renderChartDelayed();
      if (this.tab === 'resumen' && !this.loadingVentas) this.renderTendenciaDelayed();
    });
  }

  cargarVentas(): void {
    this.loadingVentas = true;
    this.ventasSvc.getAll().subscribe((data) => {
      this.ventas = data;
      this.loadingVentas = false;
      this.renderChartDelayed();
      if (this.tab === 'resumen' && !this.loadingCompras) this.renderTendenciaDelayed();
    });
  }

  renderChartDelayed(): void {
    if (this.chartRenderTimeout) clearTimeout(this.chartRenderTimeout);
    this.chartRenderTimeout = setTimeout(() => {
      this.chartRenderTimeout = null;
      this.renderChart();
      // El canvas de recuperación está en @if; dar otro tick para que Angular lo renderice
      setTimeout(() => this.renderRecoveryChart(), 100);
    }, 150);
  }

  onPeriodoChange(): void {
    this.renderChartDelayed();
  }

  renderChart(): void {
    if (this.tab !== 'compras' && this.tab !== 'ventas') return;
    const canvas = this.chartCanvas?.nativeElement;
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
            text: `Ventas vs Compras (${this.periodo})`,
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
  renderRecoveryChart(): void {
    if (this.tab !== 'compras' && this.tab !== 'ventas') return;
    const canvas = this.recoveryChartCanvas?.nativeElement;
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
    this.ventas
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

  abrirNuevo(): void {
    this.showModal = true;
    this.editingId = null;
    this.form = { nombre: '', precio: '', descripcion: '', img: '', categoria: 'cafe' };
    this.error = '';
    this.success = '';
  }

  abrirEditar(p: Producto): void {
    this.showModal = true;
    this.editingId = p.id ?? null;
    this.form = { ...p };
    this.error = '';
    this.success = '';
  }

  guardar(): void {
    if (!this.form?.nombre?.trim()) {
      this.error = 'El nombre es obligatorio';
      return;
    }
    const data = {
      nombre: this.form.nombre.trim(),
      precio: this.form.precio ?? '',
      descripcion: this.form.descripcion ?? '',
      img: this.form.img ?? '',
      categoria: this.form.categoria ?? 'cafe',
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
      this.prod.crear(data).subscribe((res) => {
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
    this.form = { nombre: '', precio: '', descripcion: '', img: '', categoria: 'cafe' };
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
  abrirNuevoVenta(): void {
    this.showModalVenta = true;
    this.editingVentaId = null;
    this.formVenta = {
      fecha: new Date().toISOString().slice(0, 10),
      monto: 0,
      detalle: '',
      notas: '',
    };
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
    this.error = '';
    this.success = '';
  }

  guardarVenta(): void {
    const monto = Number(this.formVenta?.monto) || 0;
    if (monto <= 0) {
      this.error = 'El monto debe ser mayor a 0';
      return;
    }
    const data: Omit<Venta, 'id'> = {
      fecha: this.formVenta!.fecha!,
      monto,
      detalle: this.formVenta?.detalle ?? '',
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
  }

  totalCompras(): number {
    return this.comprasFiltradas.reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  }

  totalVentas(): number {
    return this.ventasFiltradas.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  }

  // --- Bloque recuperación de inversión ---
  inversionInsumosEsteMes(): number {
    const { inicio, fin } = this.getRangoMensual();
    return this.compras
      .filter((c) => {
        const f = this.normalizarFecha(c.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  }

  ventasEsteMes(): number {
    const { inicio, fin } = this.getRangoMensual();
    return this.ventas
      .filter((v) => {
        const f = this.normalizarFecha(v.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  }

  ventasMesAnterior(): number {
    const { inicio, fin } = this.getRangoMesAnterior();
    return this.ventas
      .filter((v) => {
        const f = this.normalizarFecha(v.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  }

  comprasMesAnterior(): number {
    const { inicio, fin } = this.getRangoMesAnterior();
    return this.compras
      .filter((c) => {
        const f = this.normalizarFecha(c.fecha);
        return f && f >= inicio && f <= fin;
      })
      .reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  }

  flujoCajaEsteMes(): number {
    return this.ventasEsteMes() - this.inversionInsumosEsteMes();
  }

  variacionPorcentualVentas(): number | null {
    const actual = this.ventasEsteMes();
    const anterior = this.ventasMesAnterior();
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  }

  variacionPorcentualCompras(): number | null {
    const actual = this.inversionInsumosEsteMes();
    const anterior = this.comprasMesAnterior();
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  }

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
      this.ventas
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
      this.ventas
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
      this.ventas
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

  renderTendenciaDelayed(): void {
    setTimeout(() => this.renderTendenciaChart(), 150);
  }

  renderTendenciaChart(): void {
    if (this.tab !== 'resumen') return;
    const canvas = this.tendenciaChartCanvas?.nativeElement;
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
