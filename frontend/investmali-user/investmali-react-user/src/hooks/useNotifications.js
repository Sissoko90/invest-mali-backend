import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = (entrepriseId) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(null);

  const checkForNewMessages = useCallback(async () => {
    if (!user?.id && !user?.personne_id) return;

    try {
      const userId = user?.id || user?.personne_id;
      let url = `http://localhost:8080/api/v1/chat/conversations/user/${userId}`;
      if (entrepriseId) {
        url += `?entrepriseId=${entrepriseId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'SUCCESS' && data.conversations) {
        console.log('🔍 Vérification notifications - conversations:', data.conversations.length);
        let totalUnread = 0;
        let latestMessageTime = lastMessageTime;

        data.conversations.forEach(conv => {
          console.log('🔍 Conversation:', conv.id, 'lastMessageSender:', conv.lastMessageSender, 'lastMessageTime:', conv.lastMessageTime);
          
          if (conv.lastMessageTime) {
            const messageTime = new Date(conv.lastMessageTime).getTime();
            
            // Si c'est un message de l'agent (pas de l'utilisateur) et plus récent
            if (conv.lastMessageSender === 'AGENT' && 
                (!lastMessageTime || messageTime > lastMessageTime)) {
              console.log('✅ Nouveau message détecté de l\'agent!');
              totalUnread++;
              
              if (!latestMessageTime || messageTime > latestMessageTime) {
                latestMessageTime = messageTime;
              }

              // Notification browser si nouveau message
              if (!lastMessageTime || messageTime > lastMessageTime) {
                showBrowserNotification(conv.lastMessage, conv.agentName);
              }
            }
          }
        });

        console.log('🔔 Total messages non lus:', totalUnread);

        setUnreadCount(totalUnread);
        if (latestMessageTime && latestMessageTime !== lastMessageTime) {
          setLastMessageTime(latestMessageTime);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des notifications:', error);
    }
  }, [user, entrepriseId, lastMessageTime]);

  const showBrowserNotification = (message, agentName) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Nouveau message de ${agentName}`, {
        body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        icon: '/favicon.ico',
        tag: 'chat-message'
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
