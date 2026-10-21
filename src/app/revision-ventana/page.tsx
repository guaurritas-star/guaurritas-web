"use client";

import { useState } from "react";
import RetroWindow from "@/components/windows/RetroWindow";
import StoreApp from "@/components/apps/StoreApp";
import TaskbarCart from "@/components/cart/TaskbarCart";
import SystemIcon from "@/components/ui/SystemIcon";
import styles from "./preview.module.css";

// Isolated review route; the published desktop does not opt into these styles.
export default function WindowReferencePreview() {
  const [open, setOpen] = useState(true);
  return (
    <main className={styles.preview}>
      <p className={styles.notice}>Prueba visual · Ventana basada en tu HTML · Catálogo original</p>
      {open && <RetroWindow title="Tienda" icon={<SystemIcon name="cart" />} variant="wide" fixedContent onClose={() => setOpen(false)} onMinimize={() => setOpen(false)}>
        <StoreApp />
      </RetroWindow>}
      <footer className={styles.taskbar}>
        <button type="button" onClick={() => setOpen(true)}><SystemIcon name="cart" />{open ? "Tienda abierta" : "Restaurar tienda"}</button>
        <TaskbarCart onShop={() => setOpen(true)} />
      </footer>
    </main>
  );
}
