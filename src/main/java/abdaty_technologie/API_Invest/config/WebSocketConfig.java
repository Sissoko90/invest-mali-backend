package abdaty_technologie.API_Invest.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * 🔧 CONFIGURATION WEBSOCKET POUR NOTIFICATIONS TEMPS RÉEL
 * 
 * Configure les endpoints WebSocket et le message broker
 * pour les notifications de chat bidirectionnel
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Activer un simple message broker en mémoire pour les destinations /topic et /queue
        config.enableSimpleBroker("/topic", "/queue");
        
        // Préfixe pour les messages envoyés depuis le client vers le serveur
        config.setApplicationDestinationPrefixes("/app");
        
        // Préfixe pour les messages personnels (utilisateur spécifique)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket principal
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Permettre toutes les origines (à restreindre en production)
                .withSockJS(); // Support SockJS pour les navigateurs qui ne supportent pas WebSocket
        
        // Endpoint alternatif sans SockJS
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns("*");
    }
}
