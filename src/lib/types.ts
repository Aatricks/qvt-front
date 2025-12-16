export type VisualizeErrorPayload = {
  code: string;
  message: string;
  details?: string[];
  supported_chart_keys?: string[];
  supported_keys?: string[];
};

export class VisualizeError extends Error {
  public readonly payload?: VisualizeErrorPayload;
  public readonly status?: number;

  constructor(message: string, opts?: { payload?: VisualizeErrorPayload; status?: number }) {
    super(message);
    this.name = 'VisualizeError';
    this.payload = opts?.payload;
    this.status = opts?.status;
  }
}

export type ChartSpec = Record<string, unknown>;

export type ChartJob = {
  key: string;
  title: string;
  description?: string;
  config?: Record<string, unknown>;
  filters?: Record<string, unknown>;
};
