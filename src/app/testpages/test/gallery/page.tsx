'use client';

import React, { useState, useEffect, useRef } from 'react';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';

// Sample image data - using unsplash URLs from the provided code
const sampleImages = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1432462770865-65b70566d673?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    title: 'Image 1',
    author: 'Photographer 1'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1629367494173-c78a56567877?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=927&q=80',
    title: 'Image 2',
    author: 'Photographer 2'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2940&q=80',
    title: 'Image 3',
    author: 'Photographer 3'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1552960562-daf630e9278b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    title: 'Image 4',
    author: 'Photographer 4'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80',
    title: 'Image 5',
    author: 'Photographer 5'
  },
  {
    id: 6,
    url: 'https://docs.material-tailwind.com/img/team-3.jpg',
    title: 'Image 6',
    author: 'Photographer 6'
  },
  {
    id: 7,
    url: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2940&q=80',
    title: 'Image 7',
    author: 'Photographer 7'
  },
  {
    id: 8,
    url: 'https://images.unsplash.com/photo-1552960562-daf630e9278b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80',
    title: 'Image 8',
    author: 'Photographer 8'
  },
  {
    id: 9,
    url: 'https://images.unsplash.com/photo-1629367494173-c78a56567877?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=927&q=80',
    title: 'Image 9',
    author: 'Photographer 9'
  }
];

// Define tab data
const tabsData = [
  { id: 'tab1-group', name: 'Gallery' },
  { id: 'tab2-group', name: 'YaY/Nay' },
  { id: 'tab3-group', name: 'Battle' },
  { id: 'tab4-group', name: 'Opinions' }
];

// Image sets for each tab
const tabImages = {
  'tab1-group': [0, 1, 2, 3, 4, 5],
  'tab2-group': [3, 4, 5, 0, 1, 2],
  'tab3-group': [2, 3, 4, 5, 0, 1],
  'tab4-group': [1, 2, 3, 4, 5, 0]
};

export default function GalleryTestPage() {
  const [activeTab, setActiveTab] = useState('tab1-group');
  const tabIndicatorRef = useRef<HTMLDivElement>(null);
  const tabLinkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Update tab indicator position
  useEffect(() => {
    const updateIndicator = () => {
      const activeTabLink = tabLinkRefs.current.find(
        (ref) => ref?.dataset.duiTabTarget === activeTab
      );
      
      if (activeTabLink && tabIndicatorRef.current) {
        const tabIndicator = tabIndicatorRef.current;
        
        // Get position and size of the active tab
        const tabRect = activeTabLink.getBoundingClientRect();
        const tabsContainerRect = activeTabLink.parentElement?.getBoundingClientRect();
        
        if (tabsContainerRect) {
          // Calculate relative position within the tabs container
          const leftOffset = tabRect.left - tabsContainerRect.left;
          
          // Update indicator position and width
          tabIndicator.style.transform = `translateX(${leftOffset}px) scaleX(1)`;
          tabIndicator.style.width = `${tabRect.width}px`;
        }
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

  const handleTabClick = (tabId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tabId);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Custom Tabs with Masonry Grid</h2>
      
      {/* Custom Tabs Navigation */}
      <div className="relative tab-group">
        <div className="flex w-8/12 mx-auto justify-between bg-stone-100 p-0.5 relative rounded-lg" role="tablist">
          <div 
            ref={tabIndicatorRef}
            className="absolute top-1 left-0.5 h-8 bg-white rounded-md shadow-sm transition-all duration-300 transform z-0"
          ></div>

          {tabsData.map((tab, index) => (
            <a
              key={tab.id}
              href="#"
              ref={el => tabLinkRefs.current[index] = el}
              className={`tab-link text-sm ${activeTab === tab.id ? 'active' : ''} inline-block py-2 px-4 text-stone-800 transition-all duration-300 relative z-1 mr-1`}
              data-dui-tab-target={tab.id}
              onClick={(e) => handleTabClick(tab.id, e)}
            >
              {tab.name}
            </a>
          ))}
        </div>
        
        {/* Tab Content with Masonry Layout */}
        <div className="mt-4 tab-content-container">
          {tabsData.map((tab) => (
            <div 
              key={tab.id}
              id={tab.id} 
              className={`tab-content ${activeTab === tab.id ? 'block' : 'hidden'}`}
            >
              <div className="masonry-wrapper">
                <ResponsiveMasonry
                  columnsCountBreakPoints={{ 0: 2, 640: 2, 768: 3, 1024: 4 }}
                >
                  <Masonry gutter="20px" className="masonry-grid">
                    {tabImages[tab.id as keyof typeof tabImages].map((imageIndex) => {
                      const image = sampleImages[imageIndex];
                      return (
                        <div 
                          key={`${tab.id}-${image.id}`} 
                          className="bg-white dark:bg-gray-800 overflow-hidden mb-4 masonry-item masonry-item-container"
                        >
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={image.title}
                              className="w-full h-auto masonry-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-xs text-white">
                              <div className="font-medium truncate">
                                {image.title}
                              </div>
                              <div className="opacity-80">
                                By {image.author}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Masonry>
                </ResponsiveMasonry>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mt-8">
        <h3 className="font-semibold mb-2">Custom Tabs With Animated Indicator:</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>UI Feature:</strong> Animated tab indicator that slides to the active tab</li>
          <li><strong>Implementation:</strong> Uses React useRef and useEffect for DOM manipulation</li>
          <li><strong>Content:</strong> Each tab displays images in a masonry grid layout</li>
          <li><strong>Benefits:</strong> Provides visual feedback for active tab with smooth transition</li>
        </ul>
      </div>
    </div>
  );
} 