import { useState, useEffect, useCallback } from 'react';
import { useAgentAuth } from '../contexts/AgentAuthContext';

export const useAgentNotifications = (entrepriseId?: string) => {
  const { agent } = useAgentAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);

  const checkForNewMessages = useCallback(async () => {
    if (!agent?.id) return;

    try {
      let url = `http://localhost:8080/api/v1/chat/conversations/active`;
      if (entrepriseId) {
        url += `?entrepriseId=${entrepriseId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'SUCCESS' && data.conversations) {
        let totalUnread = 0;
        let latestMessageTime = lastMessageTime;

        data.conversations.forEach((conv: any) => {
          if (conv.lastMessageTime) {
            const messageTime = new Date(conv.lastMessageTime).getTime();
            
            // Si c'est un message de l'utilisateur (pas de l'agent) et plus récent
            if (conv.lastMessageSender === 'USER' && 
                (!lastMessageTime || messageTime > lastMessageTime)) {
              totalUnread++;
              
              if (!latestMessageTime || messageTime > latestMessageTime) {
                latestMessageTime = messageTime;
              }

              // Notification browser si nouveau message
              if (!lastMessageTime || messageTime > lastMessageTime) {
                showBrowserNotification(conv.lastMessage, conv.userName);
              }
            }
          }
        });

        setUnreadCount(totalUnread);
        if (latestMessageTime && latestMessageTime !== lastMessageTime) {
          setLastMessageTime(latestMessageTime);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des notifications agent:', error);
    }
  }, [agent, entrepriseId, lastMessageTime]);

  const showBrowserNotification = (message: string, userName: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nouveau message de ${userName}`, {
        body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        icon: '/favicon.ico',
        tag: 'agent-chat-message'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  // Polling toutes les 10 secondes
  useEffect(() => {
    // Demander la permission pour les notifications
    requestNotificationPermission();

    // Vérification initiale
    checkForNewMessages();

    // Polling
    const interval = setInterval(checkForNewMessages, 10000);

    return () => clearInterval(interval);
  }, [checkForNewMessages]);

  return {
    unreadCount,
    resetUnreadCount,
    checkForNewMessages
  };
};
