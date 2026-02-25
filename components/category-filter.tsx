'use client';

import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  label: string;
  categories: string[];
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
  multiSelect?: boolean;
}

export function CategoryFilter({
  label,
  categories,
  selectedCategories,
  onCategoryChange,
  multiSelect = false,
}: CategoryFilterProps) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{label}：</div>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategories.includes(category) ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Badge>
        ))}
      </div>
    </div>
  );
}
