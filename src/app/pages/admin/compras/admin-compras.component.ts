import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from '../shared/admin-state.service';
import { AdminFinanzasChartsComponent } from '../shared/admin-finanzas-charts.component';

@Component({
  selector: 'app-admin-compras',
  imports: [CommonModule, FormsModule, AdminFinanzasChartsComponent],
  templateUrl: './admin-compras.component.html',
  styleUrl: '../admin-shared.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminComprasComponent {
  @ViewChild(AdminFinanzasChartsComponent) charts?: AdminFinanzasChartsComponent;

  constructor(readonly state: AdminStateService) {}

  onPeriodoChange(): void {
    this.charts?.refreshCharts();
  }
}
