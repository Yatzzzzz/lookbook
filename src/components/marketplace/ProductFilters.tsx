'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { X, SlidersHorizontal } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export interface ProductFilterOptions {
  category?: string;
  priceRange?: [number, number];
  brands?: string[];
  sortBy?: string;
  query?: string;
}

interface ProductFiltersProps {
  categories: string[];
  brands: string[];
  maxPrice: number;
  onFilterChange: (filters: ProductFilterOptions) => void;
  initialFilters?: ProductFilterOptions;
  isMobile?: boolean;
}

export function ProductFilters({
  categories,
  brands,
  maxPrice,
  onFilterChange,
  initialFilters,
  isMobile = false
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilterOptions>(initialFilters || {});
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters?.priceRange || [0, maxPrice]
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialFilters?.brands || []
  );
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handlePriceRangeChange = (values: number[]) => {
    const newRange: [number, number] = [values[0], values[1]];
    setPriceRange(newRange);
  };

  const handleBrandToggle = (brand: string, checked: boolean) => {
    let newSelectedBrands: string[];
    
    if (checked) {
      newSelectedBrands = [...selectedBrands, brand];
    } else {
      newSelectedBrands = selectedBrands.filter(b => b !== brand);
    }
    
    setSelectedBrands(newSelectedBrands);
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category: category === 'all' ? undefined : category }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, query: e.target.value || undefined }));
  };

  const applyFilters = () => {
    onFilterChange({
      ...filters,
      priceRange: priceRange[0] === 0 && priceRange[1] === maxPrice ? undefined : priceRange,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined
    });
    
    if (isMobile) {
      setShowMobileFilters(false);
    }
  };

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    setSelectedBrands([]);
    setFilters({});
    onFilterChange({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const getMobileFilterButton = () => {
    return (
      <Button 
        variant="outline" 
        className="flex items-center gap-2 ml-auto" 
        onClick={() => setShowMobileFilters(true)}
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filters
      </Button>
    );
  };

  const getFilterContent = () => {
    return (
      <>
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="mt-1">
              <Input
                id="search"
                placeholder="Search products..."
                value={filters.query || ''}
                onChange={handleQueryChange}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <div className="mt-1">
              <Select 
                value={filters.category || 'all'} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="sort">Sort By</Label>
            <div className="mt-1">
              <Select 
                value={filters.sortBy || 'newest'} 
                onValueChange={handleSortChange}
              >
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Accordion type="single" collapsible defaultValue="price-range">
            <AccordionItem value="price-range">
              <AccordionTrigger>Price Range</AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 pb-4">
                  <Slider
                    defaultValue={[priceRange[0], priceRange[1]]}
                    max={maxPrice}
                    step={1}
                    onValueChange={handlePriceRangeChange}
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            {brands.length > 0 && (
              <AccordionItem value="brands">
                <AccordionTrigger>Brands</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {brands.map(brand => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`brand-${brand}`} 
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={(checked) => handleBrandToggle(brand, checked as boolean)}
                        />
                        <Label 
                          htmlFor={`brand-${brand}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {brand}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
        
        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
        </div>
      </>
    );
  };

  if (isMobile) {
    return (
      <>
        {getMobileFilterButton()}
        
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 flex items-end bg-black/60">
            <Card className="w-full max-h-[90vh] overflow-auto rounded-t-xl rounded-b-none">
              <CardHeader className="flex flex-row items-center">
                <CardTitle>Filters</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-auto" 
                  onClick={() => setShowMobileFilters(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {getFilterContent()}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="sticky top-24">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          {getFilterContent()}
        </CardContent>
      </Card>
    </div>
  );
} 