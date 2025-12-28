import { InputHTMLAttributes, forwardRef } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s/g, '-')

    return (
      <label
        htmlFor={inputId}
        className={`flex items-center gap-2 cursor-pointer ${className}`}
      >
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
          {...props}
        />
        <span className="text-gray-700">{label}</span>
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
