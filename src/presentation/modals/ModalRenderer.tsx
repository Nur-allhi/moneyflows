import { Suspense } from 'react';
import { useModalStore } from '../stores/useModalStore';
import { modalRegistry } from './registry';
import styles from './ModalRenderer.module.css';

function ModalFallback() {
  return <div className={styles.fallback}>Loading...</div>;
}

export function ModalRenderer() {
  const modals = useModalStore((s) => s.modals);
  const closingIds = useModalStore((s) => s.closingIds);
  const close = useModalStore((s) => s.close);

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((m) => {
        const Component = modalRegistry[m.type];
        if (!Component) return null;
        const isClosing = closingIds.includes(m.id);
        return (
          <div key={m.id} className={`${styles.wrapper} ${isClosing ? styles.closing : ''}`}>
            <Suspense fallback={<ModalFallback />}>
              <Component {...m.props} modalId={m.id} onClose={() => close(m.id)} />
            </Suspense>
          </div>
        );
      })}
    </>
  );
}
