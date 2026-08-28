"use client";

import Image from "next/image";
import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { withBasePath } from "@/lib/base-path";

type PaintTool = "pencil" | "brush" | "eraser";

type PaintProduct = {
  id: string;
  label: string;
  shortLabel: string;
  image: string;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 540;

const paintProducts: PaintProduct[] = [
  {
    id: "apple-banana",
    label: "Manzana con plátano",
    shortLabel: "Manzana + plátano",
    image: "/cuisine/products/happy-bag-flavors-v6/apple-banana.webp",
  },
  {
    id: "chicken-pumpkin",
    label: "Pollo con calabaza",
    shortLabel: "Pollo + calabaza",
    image: "/cuisine/products/happy-bag-flavors-v6/chicken-pumpkin.webp",
  },
  {
    id: "peanut-bacon",
    label: "Cacahuate con tocino",
    shortLabel: "Cacahuate + tocino",
    image: "/cuisine/products/happy-bag-flavors-v6/peanut-bacon.webp",
  },
  {
    id: "chicken-carrot",
    label: "Pollo con zanahoria",
    shortLabel: "Pollo + zanahoria",
    image: "/cuisine/products/happy-bag-flavors-v6/chicken-carrot.webp",
  },
];

const colors = [
  "#263650",
  "#5e96a5",
  "#a66d88",
  "#e07a85",
  "#c96d3c",
  "#d3a136",
  "#5c7f66",
  "#7b68ee",
  "#ff69b4",
  "#ffffff",
  "#111111",
];

const tools: { id: PaintTool; label: string }[] = [
  { id: "pencil", label: "Lápiz" },
  { id: "brush", label: "Pincel" },
  { id: "eraser", label: "Borrador" },
];

const brushSizes = [
  { label: "S", value: 5 },
  { label: "M", value: 12 },
  { label: "L", value: 24 },
];

function drawImageContained(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
) {
  const scale = Math.min(
    CANVAS_WIDTH / image.naturalWidth,
    CANVAS_HEIGHT / image.naturalHeight,
  );
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  context.drawImage(
    image,
    (CANVAS_WIDTH - width) / 2,
    (CANVAS_HEIGHT - height) / 2,
    width,
    height,
  );
}

export default function PaintStudioApp({
  onOpenCuisine,
}: {
  onOpenCuisine: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });

  const [selectedProduct, setSelectedProduct] = useState(paintProducts[0]);
  const [tool, setTool] = useState<PaintTool>("pencil");
  const [brushSize, setBrushSize] = useState(5);
  const [color, setColor] = useState(colors[0]);
  const [coordinates, setCoordinates] = useState("0, 0");
  const [hasDrawing, setHasDrawing] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
    setSavedMessage("");
  };

  const getCanvasPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const beginDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);

    drawingRef.current = true;
    lastPointRef.current = point;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const continueDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    setCoordinates(`${Math.round(point.x)}, ${Math.round(point.y)}`);

    if (!drawingRef.current) return;

    const context = event.currentTarget.getContext("2d");
    if (!context) return;

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    if (tool === "eraser") {
      context.globalCompositeOperation = "destination-out";
      context.lineWidth = brushSize * 2.2;
    } else {
      context.globalCompositeOperation = "source-over";
      context.strokeStyle = color;
      context.globalAlpha = tool === "brush" ? 0.82 : 1;
      context.lineWidth = tool === "brush" ? brushSize * 1.7 : brushSize;
    }

    context.beginPath();
    context.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    context.restore();

    lastPointRef.current = point;
    setHasDrawing(true);
    setSavedMessage("");
    event.preventDefault();
  };

  const endDrawing = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const downloadDesign = () => {
    const drawingCanvas = canvasRef.current;
    if (!drawingCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;

    const context = exportCanvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#f6e9ed";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const productImage = new window.Image();
    productImage.onload = () => {
      drawImageContained(context, productImage);
      context.drawImage(drawingCanvas, 0, 0);

      const link = document.createElement("a");
      link.download = `guaurritas-paint-${selectedProduct.id}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();
      setSavedMessage("Diseño guardado. Puedes usarlo como foto de inspiración en Cuisine.");
    };
    productImage.src = withBasePath(selectedProduct.image);
  };

  return (
    <section className="-m-4 bg-[#f7f2f4] p-3 font-interface text-[#263650] sm:-m-6 sm:p-5">
      <div className="mx-auto max-w-6xl border-2 border-[#425b8c] bg-[#c7c7c7] shadow-[5px_5px_0_rgba(66,91,140,0.28)]">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#263650] to-[#5e96a5] px-3 py-2 text-white">
          <p className="truncate text-[11px] font-bold">
            {selectedProduct.label}.png — Paint Guaurritas
          </p>
          <span className="border border-white/70 bg-[#dce4f2] px-2 py-0.5 text-[10px] font-bold text-[#263650]">
            EDICIÓN
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 border-b border-[#777] px-3 py-1.5 text-[10px] text-[#222]">
          <span>Archivo</span>
          <span>Editar</span>
          <span>Imagen</span>
          <span>Colores</span>
          <span>Ayuda</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#777] px-2 py-2">
          <div className="flex gap-1" aria-label="Herramientas de dibujo">
            {tools.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTool(item.id)}
                aria-pressed={tool === item.id}
                className={`min-h-9 border px-3 text-[10px] font-bold transition active:translate-y-px ${
                  tool === item.id
                    ? "border-[#555] bg-[#aeb9c8] shadow-[inset_2px_2px_0_#66758b]"
                    : "border-[#666] bg-[#e3e3e3] shadow-[inset_1px_1px_0_white,2px_2px_0_#777] hover:bg-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <span className="ml-1 text-[10px] font-bold text-[#333]">Tamaño</span>
          <div className="flex gap-1" aria-label="Tamaño del trazo">
            {brushSizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => setBrushSize(size.value)}
                aria-pressed={brushSize === size.value}
                className={`h-8 min-w-8 border text-[10px] font-bold ${
                  brushSize === size.value
                    ? "border-[#555] bg-[#aeb9c8] shadow-[inset_2px_2px_0_#66758b]"
                    : "border-[#666] bg-[#e3e3e3] shadow-[inset_1px_1px_0_white,2px_2px_0_#777]"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasDrawing}
            className="ml-auto min-h-9 border border-[#666] bg-[#e3e3e3] px-3 text-[10px] font-bold shadow-[inset_1px_1px_0_white,2px_2px_0_#777] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Borrar diseño
          </button>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="p-2 sm:p-3">
            <div className="relative aspect-[5/3] touch-none overflow-hidden border-2 border-[#626262] bg-[#f6e9ed] shadow-[inset_3px_3px_0_rgba(38,54,80,0.16)]">
              <Image
                src={withBasePath(selectedProduct.image)}
                alt={`Happy Bag ${selectedProduct.label}`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 800px"
                className="pointer-events-none select-none object-contain p-3 sm:p-5"
                priority
              />
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onPointerDown={beginDrawing}
                onPointerMove={continueDrawing}
                onPointerUp={endDrawing}
                onPointerCancel={endDrawing}
                onPointerLeave={(event) => {
                  if (drawingRef.current) endDrawing(event);
                }}
                aria-label="Lienzo para dibujar sobre el producto"
                className={`absolute inset-0 h-full w-full touch-none ${
                  tool === "eraser" ? "cursor-cell" : "cursor-crosshair"
                }`}
              />
            </div>
          </div>

          <aside className="border-t border-[#777] bg-[#d4d4d4] p-3 lg:border-l lg:border-t-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#263650]">
              Producto de Cuisine
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {paintProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => {
                    setSelectedProduct(product);
                    clearCanvas();
                  }}
                  aria-pressed={selectedProduct.id === product.id}
                  className={`flex min-h-14 items-center gap-2 border p-1.5 text-left text-[9px] font-bold transition ${
                    selectedProduct.id === product.id
                      ? "border-[#425b8c] bg-[#e8f2f4] shadow-[inset_2px_2px_0_#8aa4b2]"
                      : "border-[#777] bg-[#eeeeee] shadow-[inset_1px_1px_0_white,2px_2px_0_#888] hover:bg-white"
                  }`}
                >
                  <span className="relative h-11 w-9 shrink-0 overflow-hidden bg-white">
                    <Image
                      src={withBasePath(product.image)}
                      alt=""
                      fill
                      unoptimized
                      sizes="36px"
                      className="object-contain"
                    />
                  </span>
                  <span>{product.shortLabel}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[#777] px-2 py-2">
          <span
            className="h-8 w-8 shrink-0 border-2 border-[#444] shadow-[inset_2px_2px_0_rgba(255,255,255,0.55)]"
            style={{ backgroundColor: color }}
            aria-label={`Color actual ${color}`}
          />
          <div className="flex flex-1 flex-wrap gap-1" aria-label="Paleta de colores">
            {colors.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => {
                  setColor(swatch);
                  if (tool === "eraser") setTool("pencil");
                }}
                aria-label={`Usar color ${swatch}`}
                aria-pressed={color === swatch}
                className={`h-7 w-7 border transition hover:-translate-y-0.5 ${
                  color === swatch
                    ? "border-[#263650] ring-2 ring-[#5e96a5] ring-offset-1"
                    : "border-[#555]"
                }`}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.08em]">
            Otro
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-8 w-10 cursor-pointer border border-[#555] bg-white p-0.5"
            />
          </label>
        </div>

        <div className="grid gap-2 border-t border-[#777] bg-[#c7c7c7] p-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <div className="min-h-9 border border-[#888] bg-[#d9d9d9] px-3 py-2 text-[9px] text-[#333] shadow-[inset_1px_1px_0_#777,inset_-1px_-1px_0_white]">
            {savedMessage || `${coordinates} · ${tools.find((item) => item.id === tool)?.label} · ${CANVAS_WIDTH} × ${CANVAS_HEIGHT}px`}
          </div>
          <button
            type="button"
            onClick={downloadDesign}
            className="min-h-10 border-2 border-[#425b8c] bg-white px-4 text-[10px] font-bold uppercase tracking-[0.08em] shadow-[3px_3px_0_#425b8c] transition hover:-translate-y-0.5 hover:bg-[#e8f2f4]"
          >
            Guardar PNG
          </button>
          <button
            type="button"
            onClick={onOpenCuisine}
            className="min-h-10 border-2 border-[#263650] bg-[#263650] px-4 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-[3px_3px_0_#5e96a5] transition hover:-translate-y-0.5 hover:bg-[#425b8c]"
          >
            Ir a Cuisine →
          </button>
        </div>
      </div>

      <p className="mx-auto mt-3 max-w-3xl text-center text-[10px] leading-4 text-[#657287]">
        Paint es un espacio creativo: guardar el dibujo no modifica ni confirma un pedido. En Cuisine puedes adjuntarlo después como fotografía de inspiración.
      </p>
    </section>
  );
}
