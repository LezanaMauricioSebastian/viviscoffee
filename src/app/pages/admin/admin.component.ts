import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductosService, Producto } from '../../core/services/productos.service';
import { ComprasService, CompraInsumo } from '../../core/services/compras.service';
import { VentasService, Venta } from '../../core/services/ventas.service';

type Tab = 'productos' | 'compras' | 'ventas';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  tab: Tab = 'productos';

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
  }

  setTab(t: Tab): void {
    this.tab = t;
    this.error = '';
    this.success = '';
    if (t === 'compras') this.cargarCompras();
    if (t === 'ventas') this.cargarVentas();
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
    });
  }

  cargarVentas(): void {
    this.loadingVentas = true;
    this.ventasSvc.getAll().subscribe((data) => {
      this.ventas = data;
      this.loadingVentas = false;
    });
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
    return this.compras.reduce((sum, c) => sum + (Number(c.monto) || 0), 0);
  }

  totalVentas(): number {
    return this.ventas.reduce((sum, v) => sum + (Number(v.monto) || 0), 0);
  }
}
