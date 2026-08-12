export interface ICreateQuickAdd {
  label: string;
  icon: string;
  amount: number;
  category_id: string;
  payment_method: string;
  sort_order?: number;
}

export interface IUpdateQuickAdd {
  label?: string;
  icon?: string;
  amount?: number;
  category_id?: string;
  payment_method?: string;
  sort_order?: number;
}
