export interface ICreateCategory {
  name: string;
  kind: string;
  icon: string;
  color: string;
}

export interface IUpdateCategory {
  name?: string;
  kind?: string;
  icon?: string;
  color?: string;
}
