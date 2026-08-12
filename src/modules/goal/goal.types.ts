export interface ICreateGoal {
  title: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  icon?: string;
  color?: string;
}

export interface IUpdateGoal {
  title?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string | null;
  icon?: string;
  color?: string;
}

export interface IDepositGoal {
  amount: number;
}
