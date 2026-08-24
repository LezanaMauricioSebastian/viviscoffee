import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from '../shared/admin-state.service';
import { resolveImageUrl } from '../../../shared/utils/resolve-image-url';

@Component({
  selector: 'app-admin-productos',
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './admin-productos.component.html',
  styleUrl: '../admin-shared.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminProductosComponent {
  readonly resolveImageUrl = resolveImageUrl;

  constructor(readonly state: AdminStateService) {}
}
