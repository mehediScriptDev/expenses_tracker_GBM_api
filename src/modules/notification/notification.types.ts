export type NotificationType =
  | "BUDGET_LIMIT_WARNING"
  | "BUDGET_LIMIT_EXCEEDED"
  | "GOAL_MILESTONE"
  | "DEBT_DUE_SOON";

export interface INotification {
  id: string;
  type: NotificationType;
  message: string;
  href: string;
  created_at: string;
  read: boolean;
}

export interface IMarkRead {
  notification_key?: string;
  mark_all?: boolean;
}
