import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from '../shared/admin-state.service';
import { AdminFinanzasChartsComponent } from '../shared/admin-finanzas-charts.component';

@Component({
  selector: 'app-admin-ventas',
  imports: [CommonModule, FormsModule, AdminFinanzasChartsComponent],
  templateUrl: './admin-ventas.component.html',
  styleUrl: '../admin-shared.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminVentasComponent {
  @ViewChild(AdminFinanzasChartsComponent) charts?: AdminFinanzasChartsComponent;

  constructor(readonly state: AdminStateService) {}

  onPeriodoChange(): void {
    this.charts?.refreshCharts();
  }
}
