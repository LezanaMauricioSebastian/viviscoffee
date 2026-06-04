import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ProductosService, Producto } from '../../core/services/productos.service';

@Component({
  selector: 'app-productos-generico',
  templateUrl: './productos-generico.component.html',
  styleUrls: ['./productos-generico.component.css'],
})
export class ProductosGenericoComponent {
  @Input() titulo = '';
  @Input() texto = '';
  @Input() productos: Producto[] = [];
  /** Categoría de la sección (para crear productos y contexto admin) */
  @Input() categoria = '';
  @Output() productosChange = new EventEmitter<void>();

  categorias: string[] = [];
  showModal = false;
  editingId: string | null = null;
  form: Partial<Producto> = { nombre: '', precio: '', descripcion: '', img: '', categoria: 'cafe' };
  subiendoImg = false;
  error = '';
  success = '';

  constructor(
    public auth: AuthService,
    private prod: ProductosService
  ) {
    this.categorias = prod.getCategorias();
  }

  abrirNuevo(): void {
    this.showModal = true;
    this.editingId = null;
    this.form = {
      nombre: '',
      precio: '',
      descripcion: '',
      img: '',
      categoria: this.categoria || 'cafe',
    };
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
    const categoria = this.form.categoria ?? this.categoria ?? 'cafe';
    const data = {
      nombre: this.form.nombre.trim(),
      precio: this.form.precio ?? '',
      descripcion: this.form.descripcion ?? '',
      img: this.form.img ?? '',
      categoria,
    };

    if (this.editingId) {
      this.prod.actualizar(this.editingId, data).subscribe((res) => {
        if (res.error) this.error = res.error;
        else {
          this.success = 'Producto actualizado.';
          this.cerrarModal();
          this.productosChange.emit();
        }
      });
    } else {
      const maxOrden = this.productos
        .filter((p) => p.categoria === categoria)
        .reduce((max, p) => Math.max(max, p.orden ?? 0), -1);
      this.prod.crear({ ...data, orden: maxOrden + 1 }).subscribe((res) => {
        if ('error' in res) this.error = res.error;
        else {
          this.success = 'Producto creado.';
          this.cerrarModal();
          this.productosChange.emit();
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
        this.productosChange.emit();
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

  cerrarModal(): void {
    this.showModal = false;
    this.editingId = null;
  }
}
