import { ReactNode } from 'react'

interface PageLayoutProps {
  children: ReactNode
  noPadding?: boolean
}

export function PageLayout({ children, noPadding = false }: PageLayoutProps) {
  return (
    <main className={`pb-16 min-h-screen ${noPadding ? '' : 'p-4'}`}>
      {children}
    </main>
  )
}
