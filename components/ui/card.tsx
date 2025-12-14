import React from 'react'

export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-white text-foreground shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>
}