export const QUOTE_STATUSES = ["sent", "accepted", "declined"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  sent: "Envoyé",
  accepted: "Accepté",
  declined: "Refusé",
};

export const PAYMENT_METHODS = ["cash", "transfer", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  transfer: "Virement",
  other: "Autre",
};

export type Payment = {
  id: string;
  paidOn: string;
  amountCents: number;
  method: PaymentMethod;
};

export type Quote = {
  id: string;
  projectId: string;
  totalCents: number;
  depositCents: number;
  status: QuoteStatus;
  payments: Payment[];
  paidCents: number;
  remainingCents: number;
};

export function summarize(totalCents: number, payments: { amountCents: number }[]) {
  const paidCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
  return { paidCents, remainingCents: Math.max(totalCents - paidCents, 0) };
}
