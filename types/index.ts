export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category_id: string;
  type: 'income' | 'expense';
  date: string;
  created_at?: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  type: 'income' | 'expense';
  created_at?: string;
};

export type MarkedDates = {
  [date: string]: {
    marked?: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

export type Profile = {
  id: string;
  full_name: string;
  is_premium: boolean;
  created_at?: string;
};