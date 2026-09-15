export type UserRole = "customer" | "staff" | "manager" | "admin";

export type ProductStatus = "draft" | "active" | "archived";

export type DropStatus = "draft" | "scheduled" | "active" | "ended" | "archived";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";
