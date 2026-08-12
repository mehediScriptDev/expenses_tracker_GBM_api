export interface IUpdateProfile {
  name?: string;
  monthly_salary?: number;
  salary_day?: number;
  currency_code?: string;
  currency_symbol?: string;
}

export interface IChangePassword {
  current_password: string;
  new_password: string;
}
