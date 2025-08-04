export interface Category {
  id: number;
  name: string;
  color?: string;
}

export interface Expense {
  id: number;
  date: string;
  description: string;
  amount: number;
  bank: string;
  month: string;
  categoryId?: number;
  category?: Category;
  createdAt: string;
}

export interface MonthlySummary {
  [categoryName: string]: {
    total: number;
    count: number;
    color?: string;
  };
}