import type { ReactNode } from 'react'

interface ShinyTextProps {
  children: ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  className?: string
  variant?: 'title' | 'body'
}

function processChildren(children: ReactNode, variant: 'title' | 'body'): ReactNode {
  if (variant !== 'title') {
    return children
  }

  // Handle string children
  if (typeof children === 'string') {
    return children.toLowerCase()
  }

  // Handle number children
  if (typeof children === 'number') {
    return children
  }

  // Handle array of children
  if (Array.isArray(children)) {
    return children.map((child) => processChildren(child, variant))
  }

  // For React elements or other types, return as-is
  return children
}

export function ShinyText({ children, as: Component = 'span', className = '', variant = 'body' }: ShinyTextProps) {
  const fontClass = variant === 'title' ? 'font-title' : 'font-body'
  const processedChildren = processChildren(children, variant)

  return <Component className={`shiny-text ${fontClass} ${className}`}>{processedChildren}</Component>
}
