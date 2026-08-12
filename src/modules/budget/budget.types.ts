export interface ICreateBudget {
  category_id: string;
  monthly_limit: number;
}

export interface IUpdateBudget {
  monthly_limit: number;
}
