'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ShoppingBag,
  Search,
  Filter,
  Heart,
  ShoppingCart,
  Tag
} from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useWardrobe } from '@/app/context/WardrobeContext';
import BottomNav from '@/components/BottomNav';

export default function Marketplace() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToWishList, wishListItems } = useWardrobe();
  
  const [products, setProducts] = useState([
    {
      id: '1',
      name: 'Eco-friendly Cotton T-shirt',
      brand: 'EcoWear',
      price: 29.99,
      sustainabilityScore: 8.5,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      tags: ['sustainable', 'eco-friendly', 'cotton'],
      category: 'tops'
    },
    {
      id: '2',
      name: 'Recycled Denim Jeans',
      brand: 'Green Denim Co.',
      price: 79.99,
      sustainabilityScore: 9.0,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      tags: ['recycled', 'sustainable', 'denim'],
      category: 'bottoms'
    },
    {
      id: '3',
      name: 'Organic Hemp Sweater',
      brand: 'Pure Nature',
      price: 59.99,
      sustainabilityScore: 9.5,
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      tags: ['organic', 'hemp', 'sustainable'],
      category: 'tops'
    },
    {
      id: '4',
      name: 'Vegan Leather Handbag',
      brand: 'EthicalChoice',
      price: 89.99,
      sustainabilityScore: 7.5,
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      tags: ['vegan', 'cruelty-free', 'accessories'],
      category: 'accessories'
    }
  ]);
  
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filterProducts = () => {
    let result = [...products];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (activeCategory !== 'all') {
      result = result.filter(product => product.category === activeCategory);
    }
    
    setFilteredProducts(result);
  };
  
  useEffect(() => {
    filterProducts();
  }, [searchQuery, activeCategory]);
  
  const handleAddToWishlist = (productId: string) => {
    if (user) {
      addToWishList(productId);
    } else {
      router.push('/login');
    }
  };
  
  const isInWishlist = (productId: string) => {
    return wishListItems.some(item => item.product_id === productId);
  };
  
  return (
    <div className="pb-16">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-4 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Sustainable Fashion Marketplace</h1>
        <p className="text-sm opacity-90">Discover eco-friendly and ethical fashion alternatives</p>
      </div>
      
      <div className="relative mb-4">
        <Input
          type="text"
          placeholder="Search sustainable products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-4 py-2 w-full"
        />
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
      </div>
      
      <Tabs defaultValue="all" className="mb-4">
        <TabsList className="w-full overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="all" onClick={() => setActiveCategory('all')}>All</TabsTrigger>
          <TabsTrigger value="tops" onClick={() => setActiveCategory('tops')}>Tops</TabsTrigger>
          <TabsTrigger value="bottoms" onClick={() => setActiveCategory('bottoms')}>Bottoms</TabsTrigger>
          <TabsTrigger value="accessories" onClick={() => setActiveCategory('accessories')}>Accessories</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <Card key={product.id} className="overflow-hidden">
            <div className="relative h-40">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              <button
                onClick={() => handleAddToWishlist(product.id)}
                className="absolute top-2 right-2 bg-white dark:bg-gray-800 p-1.5 rounded-full"
              >
                <Heart 
                  className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
                />
              </button>
              <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {product.sustainabilityScore}/10
              </div>
            </div>
            <CardContent className="p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{product.brand}</div>
              <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="font-bold">${product.price}</span>
                <Button size="sm" variant="outline" className="h-8 px-2">
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  <span className="text-xs">Add</span>
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.map(tag => (
                  <span key={tag} className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 