'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Heart, MessageCircle, Share, ShoppingBag, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { useWardrobe } from '@/app/context/WardrobeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type NotificationType = 
  | 'like' 
  | 'comment' 
  | 'follow' 
  | 'mention' 
  | 'product-match' 
  | 'outfit-suggestion'
  | 'discount'
  | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  read: boolean;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    avatar: string;
  };
  content: string;
  targetId?: string;
  targetType?: string;
  additionalData?: any;
}

export default function NotificationsPage() {
  const { markAllNotificationsAsRead } = useWardrobe();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'social' | 'shopping'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'like',
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      user: {
        id: 'user123',
        name: 'Sophie Martin',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      content: 'liked your outfit',
      targetId: 'outfit123',
      targetType: 'outfit'
    },
    {
      id: '2',
      type: 'comment',
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      user: {
        id: 'user456',
        name: 'James Wilson',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      content: 'commented on your look: "Love those shoes! Where are they from?"',
      targetId: 'look456',
      targetType: 'look'
    },
    {
      id: '3',
      type: 'follow',
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      user: {
        id: 'user789',
        name: 'Emma Johnson',
        avatar: 'https://randomuser.me/api/portraits/women/22.jpg'
      },
      content: 'started following you',
      targetId: 'user001',
      targetType: 'user'
    },
    {
      id: '4',
      type: 'product-match',
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36),
      content: 'We found sustainable alternatives for items in your wardrobe',
      targetId: 'wardrobe001',
      targetType: 'recommendation',
      additionalData: {
        count: 3
      }
    },
    {
      id: '5',
      type: 'discount',
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      content: '20% off on sustainable brands this weekend!',
      targetId: 'promo001',
      targetType: 'promotion'
    },
    {
      id: '6',
      type: 'outfit-suggestion',
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
      content: 'New outfit suggestions based on your style preferences',
      targetId: 'outfit-suggest-001',
      targetType: 'suggestion',
      additionalData: {
        count: 5
      }
    }
  ]);
  
  useEffect(() => {
    // Mark all notifications as read when the page is visited
    if (user) {
      markAllNotificationsAsRead();
    }
  }, []);
  
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'social') return ['like', 'comment', 'follow', 'mention'].includes(notification.type);
    if (activeTab === 'shopping') return ['product-match', 'discount'].includes(notification.type);
    return true;
  });
  
  const markAsRead = (id: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'like': return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow': return <Share className="h-4 w-4 text-purple-500" />;
      case 'mention': return <Tag className="h-4 w-4 text-green-500" />;
      case 'product-match': return <ShoppingBag className="h-4 w-4 text-yellow-500" />;
      case 'outfit-suggestion': return <RefreshCw className="h-4 w-4 text-indigo-500" />;
      case 'discount': return <Tag className="h-4 w-4 text-green-500" />;
      case 'system': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };
  
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  return (
    <div className="max-w-screen-lg mx-auto pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </h1>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="all" className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger 
            value="all" 
            onClick={() => setActiveTab('all')}
            className="flex-1"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="unread" 
            onClick={() => setActiveTab('unread')}
            className="flex-1"
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="social" 
            onClick={() => setActiveTab('social')}
            className="flex-1"
          >
            Social
          </TabsTrigger>
          <TabsTrigger 
            value="shopping" 
            onClick={() => setActiveTab('shopping')}
            className="flex-1"
          >
            Shopping
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notification => (
            <div 
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className="cursor-pointer"
            >
              <Card 
                className={`${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
              >
                <CardContent className="p-4 flex gap-3">
                  <div className="flex-shrink-0">
                    {notification.user ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                        <AvatarFallback>{notification.user.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">
                          {notification.user && (
                            <span className="font-semibold">{notification.user.name}</span>
                          )}
                          <span className="ml-1">{notification.content}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDistanceToNow(notification.timestamp)} ago
                        </div>
                      </div>
                      <div>
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    
                    {notification.additionalData && notification.additionalData.count && (
                      <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                        {notification.additionalData.count} {notification.type === 'product-match' ? 'alternatives' : 'suggestions'} available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">No notifications</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              {activeTab === 'all' 
                ? "You don't have any notifications yet"
                : `You don't have any ${activeTab} notifications`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 