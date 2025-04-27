'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWardrobe, Notification } from '@/app/context/WardrobeContext';
import { 
  Loader2, 
  User, 
  Bell, 
  Check, 
  X, 
  Trash2, 
  CheckSquare,
  MessageSquare,
  Heart,
  Clock,
  ShoppingBag
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    notifications, 
    isLoadingNotifications, 
    notificationsError,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
  } = useWardrobe();
  
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true);
    try {
      await markAllNotificationsAsRead();
    } finally {
      setIsMarkingAllRead(false);
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };
  
  // Get the redirect link for a notification
  const getNotificationLink = (notification: Notification) => {
    switch (notification.notification_type) {
      case 'follow':
        return `/profile/${notification.sender_id}`;
      case 'comment':
        if (notification.item_type === 'wardrobe_item') {
          return `/wardrobe?item=${notification.item_id}`;
        } else if (notification.item_type === 'outfit') {
          return `/outfits?outfit=${notification.item_id}`;
        }
        return '#';
      default:
        return '#';
    }
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead || notifications.every(n => n.is_read)}
            className="flex items-center px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span>Mark all as read</span>
          </button>
        )}
      </div>
      
      {isLoadingNotifications ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notificationsError ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">Error loading notifications</p>
          <p className="text-muted-foreground">{notificationsError}</p>
          <button 
            onClick={() => refreshNotifications()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No notifications</h2>
          <p className="text-muted-foreground">
            You don't have any notifications yet. Check back later!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`relative ${notification.is_read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-gray-700/50'}`}
              >
                <div className="flex items-start px-4 py-5">
                  <div className="flex-shrink-0 mr-4">
                    {notification.sender_profile?.avatar_url ? (
                      <img 
                        src={notification.sender_profile.avatar_url} 
                        alt={notification.sender_profile?.username || 'User'} 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={getNotificationLink(notification)}
                      className="block focus:outline-none"
                      onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start mb-1">
                        <div className="mr-2">
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                        <p className="text-sm font-medium truncate">
                          {notification.sender_profile?.username || 'Someone'}{' '}
                          {notification.content || notification.notification_type}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </Link>
                  </div>
                  
                  <div className="flex-shrink-0 ml-2 flex">
                    {!notification.is_read && (
                      <button
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="text-gray-400 hover:text-primary p-1"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 