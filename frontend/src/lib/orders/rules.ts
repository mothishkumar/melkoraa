export function canCancelUnpaid(status: string, paymentStatus: string): boolean {
  return status === "pending" && paymentStatus === "pending";
}
