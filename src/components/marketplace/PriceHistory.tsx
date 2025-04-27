'use client';

import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface PriceHistoryItem {
  id: string;
  product_id: string;
  price: number;
  recorded_at: string;
}

interface PriceHistoryProps {
  priceHistory: PriceHistoryItem[];
  isLoading: boolean;
  currentPrice?: number;
  initialPrice?: number;
}

export function PriceHistory({
  priceHistory,
  isLoading,
  currentPrice,
  initialPrice
}: PriceHistoryProps) {
  const [data, setData] = useState<any[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });

  useEffect(() => {
    if (priceHistory.length > 0) {
      // Sort by date
      const sortedHistory = [...priceHistory].sort(
        (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );
      
      // Format data for the chart
      const formattedData = sortedHistory.map(item => ({
        date: formatDate(item.recorded_at),
        price: item.price,
        timestamp: new Date(item.recorded_at).getTime()
      }));
      
      // Add initial price point if provided and not already in the history
      if (initialPrice && initialPrice !== formattedData[0]?.price) {
        const earliestDate = formattedData[0]?.timestamp || Date.now();
        formattedData.unshift({
          date: 'Initial',
          price: initialPrice,
          timestamp: earliestDate - 86400000 // One day before earliest record
        });
      }
      
      // Add current price if provided and different from the latest record
      if (currentPrice && currentPrice !== formattedData[formattedData.length - 1]?.price) {
        formattedData.push({
          date: 'Current',
          price: currentPrice,
          timestamp: Date.now()
        });
      }
      
      setData(formattedData);
      
      // Calculate price range for the chart
      const prices = formattedData.map(item => item.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const buffer = (maxPrice - minPrice) * 0.1; // 10% buffer
      
      setPriceRange({
        min: Math.max(0, minPrice - buffer),
        max: maxPrice + buffer
      });
    }
  }, [priceHistory, currentPrice, initialPrice]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white border rounded-md shadow-sm dark:bg-black">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">{formatPrice(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const getChartContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-48">
          <LoadingSpinner />
        </div>
      );
    }
    
    if (data.length < 2) {
      return (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Not enough price history data available</p>
        </div>
      );
    }
    
    return (
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickLine={{ stroke: '#888', opacity: 0.5 }} 
            />
            <YAxis 
              domain={[priceRange.min, priceRange.max]} 
              tickFormatter={formatPrice}
              tick={{ fontSize: 12 }} 
              tickLine={{ stroke: '#888', opacity: 0.5 }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const getPriceTrend = () => {
    if (data.length < 2) return null;
    
    const firstPrice = data[0].price;
    const lastPrice = data[data.length - 1].price;
    const difference = lastPrice - firstPrice;
    const percentChange = (difference / firstPrice) * 100;
    
    return {
      difference,
      percentChange,
      isIncreasing: difference > 0
    };
  };

  const trend = getPriceTrend();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Price History</CardTitle>
        {trend && (
          <CardDescription>
            Price has {trend.isIncreasing ? 'increased' : 'decreased'} by{' '}
            {formatPrice(Math.abs(trend.difference))} ({Math.abs(trend.percentChange).toFixed(1)}%)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {getChartContent()}
      </CardContent>
    </Card>
  );
} 