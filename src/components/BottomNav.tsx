'use client';
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from 'react';
import {
  Home, Search, Upload, Sparkles, User, PanelTop, Layers, Crown, Bell, Heart, Compass, ShoppingBag, Palette, BookOpen, Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWardrobe } from "@/app/context/WardrobeContext";
import { useAuth } from "@/contexts/AuthContext";

interface BottomNavProps {
  activeTab?: string;
}

export default function BottomNav({ activeTab: propActiveTab }: BottomNavProps = {}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('/gallery');
  const { unreadNotificationsCount } = useWardrobe();
  const { user } = useAuth();

  useEffect(() => {
    // If prop is provided, use that, otherwise use the pathname
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    } else {
      setActiveTab(pathname);
    }
  }, [pathname, propActiveTab]);

  // Navigation items as per new requirements: Gallery, Search, Look, Lookbook, AI, Wardrobe
  const navItems = [
    { name: 'Gallery', path: '/gallery', icon: '🖼️' },
    { name: 'Search', path: '/search', icon: <Search className="h-5 w-5" /> },
    { name: 'Look', path: '/look', icon: <Palette className="h-5 w-5" /> },
    { name: 'Lookbook', path: '/lookbook', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'AI', path: '/ai', icon: <Sparkle className="h-5 w-5" /> },
    { name: 'Wardrobe', path: '/wardrobe', icon: '👕' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-gray-900 shadow-lg border-t border-gray-200 dark:border-gray-800 py-2 z-50">
      <div className="max-w-screen-lg mx-auto px-1">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center px-1 ${
                activeTab.startsWith(item.path) ? 'text-primary' : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
              }`}
              onClick={() => setActiveTab(item.path)}
            >
              <span className="text-lg">
                {typeof item.icon === 'string' ? item.icon : item.icon}
              </span>
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}