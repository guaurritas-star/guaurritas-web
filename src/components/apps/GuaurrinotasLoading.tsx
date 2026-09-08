import styles from "./Guaurrinotas.module.css";

export default function GuaurrinotasLoading({ label = "Preparando tu Guarriverse…", compact = false }: { label?: string; compact?: boolean }) {
  return <div className={`${styles.loading} ${compact ? styles.loadingCompact : ""}`} role="status" aria-live="polite" aria-busy="true">
    <div className={styles.loadingBrand}><span aria-hidden="true">✦</span><div><strong>Guaurrinotas</strong><p>{label}</p></div></div>
    <div className={styles.skeletonContent} aria-hidden="true">
      {!compact && <div className={styles.skeletonAvatars}>{[0,1,2].map(i => <i key={i} />)}</div>}
      <div className={styles.skeletonCard}><div className={styles.skeletonIdentity}><i /><div><i /><i /></div></div><div className={styles.skeletonPhoto} /><div className={styles.skeletonLine} /></div>
    </div>
  </div>;
}
