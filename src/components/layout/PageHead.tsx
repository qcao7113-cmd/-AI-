import type { ReactNode } from 'react'

export function PageHead({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </div>
  )
}
