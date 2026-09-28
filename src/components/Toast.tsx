export interface ToastMsg {
  id: number
  kind: 'success' | 'error'
  text: string
}

export default function Toasts({ items }: { items: ToastMsg[] }) {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
