'use client';

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from 'react';
import {
  Home,
  Search,
  Upload,
  Sparkles,
  User,
  PanelTop,
  Layers,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavProps {
  activeTab?: string;
}

export default function BottomNav({ activeTab: propActiveTab }: BottomNavProps = {}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('/gallery');

  useEffect(() => {
    // If prop is provided, use that, otherwise use the pathname
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    } else {
      setActiveTab(pathname);
    }
  }, [pathname, propActiveTab]);

  // Navigation items with correct paths
  const navItems = [
    { name: 'Gallery', path: '/gallery', icon: '🖼️' },
    { name: 'Search', path: '/search', icon: '🔍' },
    { name: 'Look', path: '/look', icon: '📸' },
    { name: 'Trends', path: '/trends', icon: '📈' },
    { name: 'AI', path: '/ai-assistant', icon: '🤖' },
    { name: 'Lookbook', path: '/lookbook', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white shadow-lg border-t border-gray-200 py-2 z-50">
      <div className="max-w-screen-lg mx-auto px-1">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center justify-center px-1 ${
                activeTab.startsWith(item.path)
                  ? 'text-blue-600'
                  : 'text-[#222222] hover:text-blue-500'
              }`}
              onClick={() => setActiveTab(item.path)}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px] mt-0.5">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 