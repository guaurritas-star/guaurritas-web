"use client";

import { useState } from "react";
import RetroWindow from "@/components/windows/RetroWindow";
import StoreApp from "@/components/apps/StoreApp";
import SystemIcon from "@/components/ui/SystemIcon";
import TaskbarCart from "@/components/cart/TaskbarCart";
import styles from "./preview.module.css";

export default function WindowPreview() {
  const [open, setOpen] = useState(true);
  return (
    <main className={styles.preview}>
      <div className={styles.label}>Guaurritas OS <span>Vista de diseño · sin publicar</span></div>
      <button className={styles.shortcut} onClick={() => setOpen(true)}><SystemIcon name="cart" /><span>Tienda</span></button>
      {open && <RetroWindow title="Tienda" icon={<SystemIcon name="cart" />} variant="wide" fixedContent onClose={() => setOpen(false)} onMinimize={() => setOpen(false)}><StoreApp /></RetroWindow>}
      <footer className={styles.taskbar}><button onClick={() => setOpen(true)}>Guaurritas</button><button onClick={() => setOpen(value => !value)} aria-pressed={open}>Tienda.exe</button><TaskbarCart onShop={() => setOpen(true)} /><span>Revisión visual</span></footer>
    </main>
  );
}
