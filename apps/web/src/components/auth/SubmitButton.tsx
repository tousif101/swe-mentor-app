'use client'

import { useFormStatus } from 'react-dom'

export interface SubmitButtonProps {
  children: React.ReactNode
  loadingText?: string
}

export function SubmitButton({
  children,
  loadingText = 'Loading...',
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <>
      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="w-full py-3 rounded-xl bg-primary-600 font-medium disabled:bg-primary-600/50"
      >
        {pending ? (
          <>
            <span className="loading loading-spinner loading-sm" aria-hidden="true" />
            <span>{loadingText}</span>
          </>
        ) : (
          children
        )}
      </button>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {pending ? loadingText : ''}
      </span>
    </>
  )
}
