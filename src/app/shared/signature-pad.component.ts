import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { LucideCheck, LucideEraser } from '@lucide/angular';

/**
 * Pad de firma simple (canvas). Emite dataURL PNG al confirmar.
 */
@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [LucideEraser, LucideCheck],
  template: `
    <div class="space-y-2">
      <canvas
        #canvas
        class="w-full touch-none rounded-md border border-slate-300 bg-white"
        width="560"
        height="180"
        (mousedown)="start($event)"
        (mousemove)="draw($event)"
        (mouseup)="end()"
        (mouseleave)="end()"
        (touchstart)="startTouch($event)"
        (touchmove)="drawTouch($event)"
        (touchend)="end()"
      ></canvas>
      <div class="flex gap-2">
        <button type="button" class="btn-ghost !text-xs" (click)="clear()">
          <svg lucideEraser [size]="14"></svg>
          Limpiar
        </button>
        <button type="button" class="btn-primary !text-xs" (click)="confirm()" [disabled]="!dirty()">
          <svg lucideCheck [size]="14"></svg>
          Usar firma
        </button>
      </div>
    </div>
  `,
})
export class SignaturePadComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signed = new EventEmitter<string>();

  readonly dirty = signal(false);
  private drawing = false;
  private ctx: CanvasRenderingContext2D | null = null;

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.strokeStyle = '#0f2a44';
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
    }
  }

  start(e: MouseEvent): void {
    this.drawing = true;
    this.ctx?.beginPath();
    this.ctx?.moveTo(e.offsetX, e.offsetY);
  }

  draw(e: MouseEvent): void {
    if (!this.drawing || !this.ctx) return;
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();
    this.dirty.set(true);
  }

  end(): void {
    this.drawing = false;
  }

  startTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.drawing = true;
    this.ctx?.beginPath();
    this.ctx?.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  }

  drawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.drawing || !this.ctx) return;
    const touch = e.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    this.ctx.stroke();
    this.dirty.set(true);
  }

  clear(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx?.clearRect(0, 0, canvas.width, canvas.height);
    this.dirty.set(false);
  }

  confirm(): void {
    if (!this.dirty()) return;
    this.signed.emit(this.canvasRef.nativeElement.toDataURL('image/png'));
  }
}
