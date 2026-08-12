export interface ITopCategorySummary {
  category_id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
}

export interface IMonthlySummary {
  year: number;
  month: number;
  total_income: number;
  total_expenses: number;
  net_saved: number;
  transaction_count: number;
  top_categories: ITopCategorySummary[];
  is_archived: boolean;
}
