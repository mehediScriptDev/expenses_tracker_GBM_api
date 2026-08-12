export interface ICreateLoan {
  direction: string;
  person: string;
  amount: number;
  amount_repaid?: number;
  started_on: string;
  due_on?: string;
  reason?: string;
  notes?: string;
}

export interface IUpdateLoan {
  direction?: string;
  person?: string;
  amount?: number;
  amount_repaid?: number;
  started_on?: string;
  due_on?: string | null;
  reason?: string | null;
  notes?: string | null;
}

export interface IRepayLoan {
  amount: number;
}
