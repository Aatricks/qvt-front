import type { ReactNode } from 'react';

import type { ChartSpec } from '../lib/types';
import { VegaViewer } from './VegaViewer';

export function ChartCard({
  title,
  subtitle,
  status,
  error,
  spec,
  footer,
}: {
  title: string;
  subtitle?: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string | null;
  spec?: ChartSpec | null;
  footer?: ReactNode;
}) {
  return (
    <section className="card vstack" style={{ gap: 10 }}>
      <div className="vstack" style={{ gap: 2 }}>
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong>{title}</strong>
          {status === 'loading' ? <span className="small">Chargement…</span> : null}
        </div>
        {subtitle ? <span className="small">{subtitle}</span> : null}
      </div>

      {status === 'error' && error ? <div className="error">{error}</div> : null}
      {status === 'success' && spec ? <VegaViewer spec={spec} /> : null}

      {footer ? <div className="small">{footer}</div> : null}
    </section>
  );
}
