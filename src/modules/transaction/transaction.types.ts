export interface ICreateTransaction {
  type: string;
  amount: number;
  category_id: string;
  description?: string;
  date: string;
  time: string;
  payment_method: string;
  mood?: string;
}

export interface IUpdateTransaction {
  type?: string;
  amount?: number;
  category_id?: string;
  description?: string;
  date?: string;
  time?: string;
  payment_method?: string;
  mood?: string | null;
}
