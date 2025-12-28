import { ButtonHTMLAttributes, ReactNode } from 'react'

interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function FAB({ children, className = '', ...props }: FABProps) {
  return (
    <button
      className={`fixed bottom-20 right-4 bg-primary-500 text-white px-4 py-3 rounded-full shadow-lg hover:bg-primary-600 transition-colors flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
