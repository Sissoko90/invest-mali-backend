package abdaty_technologie.API_Invest.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import abdaty_technologie.API_Invest.dto.chat.*;
import abdaty_technologie.API_Invest.Entity.*;
import abdaty_technologie.API_Invest.Entity.Enum.*;
import abdaty_technologie.API_Invest.repository.*;
import abdaty_technologie.API_Invest.service.ChatService;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implémentation du service de chat
 */
@Service
@Transactional
public class ChatServiceImpl implements ChatService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private EntrepriseRepository entrepriseRepository;

    @Autowired
    private UtilisateursRepository utilisateursRepository;

    @Autowired
    private PersonsRepository personsRepository;

    @Override
    public ConversationResponse createConversation(ConversationRequest request, String agentId) {
        // Vérifier que l'entreprise existe
        Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
            .orElseThrow(() -> new NotFoundException("Entreprise non trouvée"));

        // Vérifier que l'agent existe
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new NotFoundException("Agent non trouvé"));

        // Vérifier que l'utilisateur existe
        Persons user = personsRepository.findById(request.getUserId())
            .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé"));

        // Créer la conversation
        Conversation conversation = new Conversation(entreprise, agent, user, request.getSubject());
        
        if (request.getPriority() != null) {
            try {
                conversation.setPriority(ConversationPriority.valueOf(request.getPriority()));
            } catch (IllegalArgumentException e) {
                conversation.setPriority(ConversationPriority.NORMAL);
            }
        }

        conversation = conversationRepository.save(conversation);

        // Créer le message initial
        Message initialMessage = new Message(conversation, agent, request.getInitialMessage());
        messageRepository.save(initialMessage);

        return mapToConversationResponse(conversation);
    }

    @Override
    public ConversationResponse startConversationFromEntreprise(String entrepriseId, StartConversationRequest request, String agentId) {
        // Vérifier que l'entreprise existe
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException("Entreprise non trouvée"));

        // Vérifier que l'agent existe
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new NotFoundException("Agent non trouvé"));

        // Vérifier que l'utilisateur existe
        Persons user = personsRepository.findById(request.getUserId())
            .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé"));

        // Vérifier s'il existe déjà une conversation active entre cet agent et cet utilisateur pour cette entreprise
        var existingConversation = conversationRepository.findByEntrepriseIdAndAgentIdAndUserId(
            entrepriseId, agentId, request.getUserId());

        if (existingConversation.isPresent() && existingConversation.get().isActive()) {
            // Ajouter un nouveau message à la conversation existante
            Message newMessage = new Message(existingConversation.get(), agent, request.getMessage());
            messageRepository.save(newMessage);
            return mapToConversationResponse(existingConversation.get());
        }

        // Créer une nouvelle conversation
        String subject = request.getSubject() != null ? request.getSubject() : 
                        "Documents - " + entreprise.getNom();
        
        Conversation conversation = new Conversation(entreprise, agent, user, subject);
        
        if (request.getPriority() != null) {
            try {
                conversation.setPriority(ConversationPriority.valueOf(request.getPriority()));
            } catch (IllegalArgumentException e) {
                conversation.setPriority(ConversationPriority.NORMAL);
            }
        }

        conversation = conversationRepository.save(conversation);

        // Créer le message initial
        Message initialMessage = new Message(conversation, agent, request.getMessage());
        messageRepository.save(initialMessage);

        return mapToConversationResponse(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public ConversationResponse getConversation(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NotFoundException("Conversation non trouvée"));

        // Vérifier que l'utilisateur a accès à cette conversation
        if (!conversation.getAgent().getId().equals(userId) && !conversation.getUser().getId().equals(userId)) {
            throw new BadRequestException("Accès non autorisé à cette conversation");
        }

        return mapToConversationResponse(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getAgentConversations(String agentId, Pageable pageable) {
        Page<Conversation> conversations = conversationRepository.findByAgentIdOrderByModificationDesc(agentId, pageable);
        List<ConversationResponse> responses = conversations.getContent().stream()
            .map(this::mapToConversationResponse)
            .collect(Collectors.toList());
        
        return new PageImpl<>(responses, pageable, conversations.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getUserConversations(String userId, Pageable pageable) {
        Page<Conversation> conversations = conversationRepository.findByUserIdOrderByModificationDesc(userId, pageable);
        List<ConversationResponse> responses = conversations.getContent().stream()
            .map(this::mapToConversationResponse)
            .collect(Collectors.toList());
        
        return new PageImpl<>(responses, pageable, conversations.getTotalElements());
    }

    @Override
    public MessageResponse sendMessage(String conversationId, MessageRequest request, String senderId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NotFoundException("Conversation non trouvée"));

        Persons sender = personsRepository.findById(senderId)
            .orElseThrow(() -> new NotFoundException("Expéditeur non trouvé"));

        // Vérifier que l'expéditeur a accès à cette conversation
        if (!conversation.getAgent().getId().equals(senderId) && !conversation.getUser().getId().equals(senderId)) {
            throw new BadRequestException("Accès non autorisé à cette conversation");
        }

        // Créer le message
        Message message;
        MessageType messageType;
        
        try {
            messageType = MessageType.valueOf(request.getMessageType());
        } catch (IllegalArgumentException e) {
            messageType = MessageType.TEXT;
        }

        if (messageType == MessageType.DOCUMENT_REQUEST && request.getDocumentName() != null) {
            message = Message.createDocumentRequest(conversation, sender, request.getContent(), request.getDocumentName());
        } else if (messageType == MessageType.DOCUMENT_UPLOAD && request.getDocumentName() != null) {
            message = Message.createDocumentUpload(conversation, sender, request.getContent(), 
                                                 request.getDocumentName(), request.getDocumentUrl());
        } else {
            message = new Message(conversation, sender, request.getContent(), messageType);
        }

        message = messageRepository.save(message);

        // Mettre à jour le timestamp de modification de la conversation
        conversation.setModification(Instant.now());
        conversationRepository.save(conversation);

        return mapToMessageResponse(message);
    }

    @Override
    public void markConversationAsRead(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NotFoundException("Conversation non trouvée"));

        // Vérifier que l'utilisateur a accès à cette conversation
        if (!conversation.getAgent().getId().equals(userId) && !conversation.getUser().getId().equals(userId)) {
            throw new BadRequestException("Accès non autorisé à cette conversation");
        }

        // Marquer tous les messages non lus comme lus
        messageRepository.markAllMessagesAsReadInConversation(conversationId, userId);
    }

    @Override
    public ConversationResponse closeConversation(String conversationId, String userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NotFoundException("Conversation non trouvée"));

        // Vérifier que l'utilisateur a accès à cette conversation
        if (!conversation.getAgent().getId().equals(userId) && !conversation.getUser().getId().equals(userId)) {
            throw new BadRequestException("Accès non autorisé à cette conversation");
        }

        conversation.close();
        conversation = conversationRepository.save(conversation);

        return mapToConversationResponse(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCountForAgent(String agentId) {
        return conversationRepository.countUnreadMessagesForAgent(agentId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCountForUser(String userId) {
        return conversationRepository.countUnreadMessagesForUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> searchConversations(String keyword, String userId) {
        List<Conversation> conversations = conversationRepository.searchBySubject(keyword);
        
        // Filtrer pour ne retourner que les conversations auxquelles l'utilisateur a accès
        return conversations.stream()
            .filter(c -> c.getAgent().getId().equals(userId) || c.getUser().getId().equals(userId))
            .map(this::mapToConversationResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsWithUnreadMessagesForAgent(String agentId) {
        List<Conversation> conversations = conversationRepository.findConversationsWithUnreadMessagesForAgent(agentId);
        return conversations.stream()
            .map(this::mapToConversationResponse)
            .collect(Collectors.toList());
    }

    // Méthodes de mapping privées
    private ConversationResponse mapToConversationResponse(Conversation conversation) {
        ConversationResponse response = new ConversationResponse();
        
        response.setId(conversation.getId());
        response.setSubject(conversation.getSubject());
        response.setStatus(conversation.getStatus().name());
        response.setPriority(conversation.getPriority().name());
        response.setCreation(conversation.getCreation());
        response.setModification(conversation.getModification());
        response.setClosedAt(conversation.getClosedAt());

        // Informations entreprise
        response.setEntrepriseId(conversation.getEntreprise().getId());
        response.setEntrepriseNom(conversation.getEntreprise().getNom());

        // Informations agent
        response.setAgentId(conversation.getAgent().getId());
        response.setAgentNom(getFullName(conversation.getAgent()));
        response.setAgentEmail(conversation.getAgent().getEmail());

        // Informations utilisateur
        response.setUserId(conversation.getUser().getId());
        response.setUserNom(getFullName(conversation.getUser()));
        response.setUserEmail(conversation.getUser().getEmail());

        // Messages
        List<Message> messages = messageRepository.findByConversationIdOrderByCreationAsc(conversation.getId());
        response.setMessages(messages.stream()
            .map(this::mapToMessageResponse)
            .collect(Collectors.toList()));

        // Statistiques
        response.setTotalMessages(messages.size());
        response.setUnreadMessages((int) messageRepository.countUnreadMessagesInConversationForUser(
            conversation.getId(), conversation.getAgent().getId()));

        return response;
    }

    private MessageResponse mapToMessageResponse(Message message) {
        MessageResponse response = new MessageResponse();
        
        response.setId(message.getId());
        response.setContent(message.getContent());
        response.setMessageType(message.getMessageType().name());
        response.setIsRead(message.getIsRead());
        response.setCreation(message.getCreation());
        response.setReadAt(message.getReadAt());

        // Informations expéditeur
        if (message.getSender() != null) {
            response.setSenderId(message.getSender().getId());
            response.setSenderNom(getFullName(message.getSender()));
            response.setSenderEmail(message.getSender().getEmail());
            
            // Déterminer le rôle (simplifié)
            response.setSenderRole(message.getSender().getId().equals(message.getConversation().getAgent().getId()) ? "AGENT" : "USER");
        }

        // Données documents
        response.setDocumentName(message.getDocumentName());
        response.setDocumentUrl(message.getDocumentUrl());

        return response;
    }

    private String getFullName(Persons person) {
        String prenom = person.getPrenom() != null ? person.getPrenom() : "";
        String nom = person.getNom() != null ? person.getNom() : "";
        String fullName = (prenom + " " + nom).trim();
        return fullName.isEmpty() ? person.getEmail() : fullName; // Fallback sur l'email
    }
}
