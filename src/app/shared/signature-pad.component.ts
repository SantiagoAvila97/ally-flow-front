import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  OnDestroy,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { LucideCheck, LucideEraser } from '@lucide/angular';

/**
 * Pad de firma (canvas). Emite dataURL PNG al confirmar.
 * Escala coordenadas al tamaño real del canvas (evita el desfase cursor vs trazo).
 */
@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [LucideEraser, LucideCheck],
  template: `
    <div class="space-y-2">
      <canvas
        #canvas
        class="block h-[180px] w-full touch-none rounded-md border border-slate-300 bg-white"
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
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() signed = new EventEmitter<string>();

  readonly dirty = signal(false);
  private drawing = false;
  private ctx: CanvasRenderingContext2D | null = null;
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    this.syncCanvasSize();
    this.resizeObserver = new ResizeObserver(() => this.syncCanvasSize(true));
    this.resizeObserver.observe(this.canvasRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncCanvasSize(true);
  }

  start(e: MouseEvent): void {
    e.preventDefault();
    this.drawing = true;
    const { x, y } = this.pointerPos(e.clientX, e.clientY);
    this.ctx?.beginPath();
    this.ctx?.moveTo(x, y);
  }

  draw(e: MouseEvent): void {
    if (!this.drawing || !this.ctx) return;
    const { x, y } = this.pointerPos(e.clientX, e.clientY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.dirty.set(true);
  }

  end(): void {
    this.drawing = false;
  }

  startTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    this.drawing = true;
    const { x, y } = this.pointerPos(touch.clientX, touch.clientY);
    this.ctx?.beginPath();
    this.ctx?.moveTo(x, y);
  }

  drawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.drawing || !this.ctx) return;
    const touch = e.touches[0];
    if (!touch) return;
    const { x, y } = this.pointerPos(touch.clientX, touch.clientY);
    this.ctx.lineTo(x, y);
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

  /** Mapea coordenadas de pantalla → píxeles internos del canvas. */
  private pointerPos(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / Math.max(rect.width, 1);
    const scaleY = canvas.height / Math.max(rect.height, 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private syncCanvasSize(preserve = false): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const nextW = Math.max(1, Math.round(rect.width * dpr));
    const nextH = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width === nextW && canvas.height === nextH && this.ctx) return;

    let snapshot: ImageData | null = null;
    if (preserve && this.ctx && this.dirty() && canvas.width > 0 && canvas.height > 0) {
      try {
        snapshot = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        snapshot = null;
      }
    }

    canvas.width = nextW;
    canvas.height = nextH;
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) return;

    this.ctx.strokeStyle = '#0f2a44';
    this.ctx.lineWidth = Math.max(2, 2 * dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (snapshot) {
      this.ctx.putImageData(snapshot, 0, 0);
    }
  }
}
