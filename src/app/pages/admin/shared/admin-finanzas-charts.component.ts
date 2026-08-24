import {
  Component,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from './admin-state.service';

@Component({
  selector: 'app-admin-finanzas-charts',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-finanzas-charts.component.html',
  styleUrl: '../admin-shared.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminFinanzasChartsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('recoveryChartCanvas') recoveryChartCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(readonly state: AdminStateService) {}

  ngAfterViewInit(): void {
    this.scheduleCharts();
  }

  ngOnDestroy(): void {
    this.state.destroyChart();
    this.state.destroyRecoveryChart();
  }

  refreshCharts(): void {
    this.state.renderChartDelayed(
      () => this.chartCanvas?.nativeElement,
      () => this.recoveryChartCanvas?.nativeElement
    );
  }

  private scheduleCharts(): void {
    const tryRender = (): void => {
      if (this.state.loadingCompras || this.state.loadingVentas) {
        setTimeout(tryRender, 100);
        return;
      }
      this.refreshCharts();
    };
    tryRender();
  }
}
