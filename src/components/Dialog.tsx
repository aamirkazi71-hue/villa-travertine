import { useEffect, useRef, type ReactNode } from 'react'
import { useT } from '../lib/i18n'

/** Native modal dialog: focus trapping, Escape and inert background come from the platform. */
export function Dialog({ open, onClose, label, children, wide = false }: { open: boolean; onClose: () => void; label: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const t = useT()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto max-h-[90svh] w-[calc(100%-2*var(--gutter))] overflow-auto bg-ivory p-0 text-ink ${wide ? 'max-w-5xl' : 'max-w-xl'}`}
    >
      <div className="relative p-6 md:p-10">
        <button type="button" onClick={onClose} className="t-label link-quiet absolute end-6 top-6 md:end-10 md:top-10">
          {t.ui.close}
        </button>
        {children}
      </div>
    </dialog>
  )
}
