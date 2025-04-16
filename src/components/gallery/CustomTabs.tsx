'use client';

import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tab: string) => void;
}

const CustomTabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={onChange}
      className="w-full"
    >
      <TabsPrimitive.List
        className="flex w-full border-b border-border overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex-1 px-3 py-2.5 text-sm font-medium text-center transition-all relative",
              "whitespace-nowrap min-w-[100px]",
              "hover:text-foreground data-[state=active]:text-foreground data-[state=active]:font-semibold",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:translate-y-px",
              "data-[state=active]:after:bg-primary data-[state=active]:after:h-[2px]",
              activeTab === tab.id ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
};

export default CustomTabs; 