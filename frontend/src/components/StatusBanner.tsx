type Props = {
  type: 'success' | 'error'
  message: string
  onClose: () => void
}

export function StatusBanner({ type, message, onClose }: Props) {
  return (
    <div className={`feedback feedback-${type}`} role="alert">
      <span>{message}</span>
      <button
        type="button"
        className="feedback-close"
        onClick={onClose}
        aria-label="Fechar"
      >
        ×
      </button>
    </div>
  )
}
