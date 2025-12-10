'use client'

import { useId } from 'react'

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function FormInput({
  label,
  error,
  hint,
  className = '',
  id: providedId,
  ...props
}: FormInputProps) {
  const generatedId = useId()
  const id = providedId || generatedId
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(' ')

  return (
    <div>
      <label htmlFor={id} className="text-sm text-gray-400 mb-2 block">
        {label}
        {props.required && (
          <span className="text-error ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-gray-500 mb-1">
          {hint}
        </p>
      )}

      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        className={`w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none ${
          error ? 'border-error' : ''
        } ${className}`}
        {...props}
      />

      {error && (
        <p id={errorId} className="text-error text-sm mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
