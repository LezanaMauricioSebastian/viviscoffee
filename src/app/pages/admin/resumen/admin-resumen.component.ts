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
import { AdminStateService } from '../shared/admin-state.service';

@Component({
  selector: 'app-admin-resumen',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-resumen.component.html',
  styleUrl: '../admin-shared.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AdminResumenComponent implements AfterViewInit, OnDestroy {
  @ViewChild('tendenciaChartCanvas') tendenciaChartCanvas?: ElementRef<HTMLCanvasElement>;

  constructor(readonly state: AdminStateService) {}

  ngAfterViewInit(): void {
    this.scheduleTendenciaChart();
  }

  ngOnDestroy(): void {
    this.state.destroyTendenciaChart();
  }

  onPeriodoTendenciaChange(value: string): void {
    this.state.setPeriodoTendencia(value, () => this.tendenciaChartCanvas?.nativeElement);
  }

  refreshTendenciaChart(): void {
    this.state.renderTendenciaDelayed(() => this.tendenciaChartCanvas?.nativeElement);
  }

  private scheduleTendenciaChart(): void {
    const tryRender = (): void => {
      if (this.state.loadingCompras || this.state.loadingVentas || this.state.loadingConfig) {
        setTimeout(tryRender, 100);
        return;
      }
      this.refreshTendenciaChart();
    };
    tryRender();
  }
}
