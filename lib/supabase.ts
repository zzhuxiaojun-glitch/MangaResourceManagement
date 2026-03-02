import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Category = {
  id: string;
  name: string;
  slug?: string;
  sort_order: number;
  created_at: string;
};

export type Title = {
  id: string;
  category_id: string;
  title: string;
  alt_titles: string;
  author: string;
  tags: string;
  language: string;
  status: string;
  summary: string;
  japanese_title?: string;
  resource_link?: string;
  created_at: string;
  updated_at: string;
};

export type Resource = {
  id: string;
  title_id: string;
  provider: string;
  url: string;
  extract_code: string;
  note: string;
  is_active: boolean;
  created_at: string;
};

export type TitleWithCategory = Title & {
  categories: Category;
};

export type TitleWithResources = Title & {
  resources: Resource[];
  categories: Category;
};
