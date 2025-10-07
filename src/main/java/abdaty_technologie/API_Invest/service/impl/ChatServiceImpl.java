package abdaty_technologie.API_Invest.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import abdaty_technologie.API_Invest.dto.chat.*;
import abdaty_technologie.API_Invest.Entity.*;
import abdaty_technologie.API_Invest.Entity.Enum.*;
import abdaty_technologie.API_Invest.repository.*;
import abdaty_technologie.API_Invest.service.ChatService;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;

import java.time.Instant;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

/**
 * Implémentation du service de chat selon la logique métier :
 * 1. Les agents initient les conversations (pas les utilisateurs)
 * 2. Une conversation = 1 entreprise + 1 agent + 1 utilisateur
 * 3. Messages envoyés par agent OU utilisateur
 */
@Service
@Transactional
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

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

    @Autowired
    private EntrepriseMembreRepository entrepriseMembreRepository;

    /**
     * Crée une nouvelle conversation initiée par un agent
     * Logique métier : Seuls les agents peuvent initier des conversations
     */
    @Override
    public ConversationResponse createConversation(ConversationRequest request, String agentId) {
        logger.info("🚀 [ChatService] Création conversation par agent {} pour entreprise {} et utilisateur {}", 
                   agentId, request.getEntrepriseId(), request.getUserId());

        // Vérifier que l'entreprise existe
        Entreprise entreprise = entrepriseRepository.findById(request.getEntrepriseId())
            .orElseThrow(() -> new NotFoundException("Entreprise non trouvée: " + request.getEntrepriseId()));

        // Vérifier que l'agent existe et a le bon rôle
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new NotFoundException("Agent non trouvé: " + agentId));
        
        // Vérifier que c'est bien un agent (rôle AGENT_*)
        if (agent.getRole() == null || !agent.getRole().name().startsWith("AGENT_")) {
            throw new BadRequestException("Seuls les agents peuvent initier des conversations");
        }

        // Vérifier que l'utilisateur existe
        Persons user = personsRepository.findById(request.getUserId())
            .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé: " + request.getUserId()));

        // Vérifier qu'il n'existe pas déjà une conversation active entre cet agent et cet utilisateur pour cette entreprise
        List<Conversation> existingConversations = conversationRepository.findActiveConversationBetweenParticipants(
            request.getEntrepriseId(), agentId, request.getUserId());
        
        if (!existingConversations.isEmpty()) {
            logger.info("✅ Conversation existante trouvée, retour de la conversation active");
            return mapToConversationResponse(existingConversations.get(0));
        }

        // Créer la nouvelle conversation
        Conversation conversation = new Conversation(entreprise, agent, user, request.getSubject());
        
        if (request.getPriority() != null) {
            try {
                conversation.setPriority(ConversationPriority.valueOf(request.getPriority()));
            } catch (IllegalArgumentException e) {
                conversation.setPriority(ConversationPriority.NORMAL);
            }
        }

        conversation = conversationRepository.save(conversation);
        logger.info("✅ Conversation créée avec ID: {}", conversation.getId());

        // Créer le message initial de l'agent
        Message initialMessage = new Message(conversation, agent, request.getInitialMessage());
        messageRepository.save(initialMessage);
        logger.info("✅ Message initial créé par l'agent");

        return mapToConversationResponse(conversation);
    }

    /**
     * Démarre une conversation depuis une entreprise spécifique
     * Logique métier : L'agent initie la conversation pour une entreprise donnée
     */
    @Override
    public ConversationResponse startConversationFromEntreprise(String entrepriseId, StartConversationRequest request, String agentId) {
        logger.info("🚀 [ChatService] Démarrage conversation depuis entreprise {} par agent {} pour utilisateur {}", 
                   entrepriseId, agentId, request.getUserId());

        // Vérifier que l'entreprise existe
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException("Entreprise non trouvée: " + entrepriseId));

        // Vérifier que l'agent existe et a le bon rôle
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new NotFoundException("Agent non trouvé: " + agentId));
        
        if (agent.getRole() == null || !agent.getRole().name().startsWith("AGENT_")) {
            throw new BadRequestException("Seuls les agents peuvent initier des conversations");
        }

        // Trouver l'utilisateur propriétaire de l'entreprise ou membre
        Persons user;
        if (request.getUserId() != null) {
            // Utilisateur spécifié dans la requête
            user = personsRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundException("Utilisateur non trouvé: " + request.getUserId()));
        } else {
            // Trouver automatiquement l'utilisateur propriétaire de l'entreprise
            user = findEntrepriseOwner(entreprise);
            if (user == null) {
                throw new NotFoundException("Aucun propriétaire trouvé pour l'entreprise: " + entrepriseId);
            }
        }

        // Vérifier s'il existe déjà une conversation active
        List<Conversation> existingConversations = conversationRepository.findActiveConversationBetweenParticipants(
            entrepriseId, agentId, user.getId());

        if (!existingConversations.isEmpty()) {
            Conversation existingConversation = existingConversations.get(0);
            Message newMessage = new Message(existingConversation, agent, request.getMessage());
            messageRepository.save(newMessage);
            
            // Mettre à jour le timestamp de modification
            existingConversation.setModification(Instant.now());
            conversationRepository.save(existingConversation);
            
            logger.info("✅ Message ajouté à la conversation existante: {}", existingConversation.getId());
            return mapToConversationResponse(existingConversation);
        }
        
        // Créer une nouvelle conversation
        String subject = request.getSubject() != null ? request.getSubject() : 
                        "Demande concernant " + entreprise.getNom();
        
        Conversation conversation = new Conversation(entreprise, agent, user, subject);
        if (request.getPriority() != null) {
            try {
                conversation.setPriority(ConversationPriority.valueOf(request.getPriority()));
            } catch (IllegalArgumentException e) {
                conversation.setPriority(ConversationPriority.NORMAL);
            }
        }

        conversation = conversationRepository.save(conversation);
        logger.info("✅ Nouvelle conversation créée: {}", conversation.getId());

        // Créer le message initial de l'agent
        Message initialMessage = new Message(conversation, agent, request.getMessage());
        messageRepository.save(initialMessage);
        logger.info("✅ Message initial créé par l'agent");

        return mapToConversationResponse(conversation);
    }

    /**
     * Trouve le propriétaire d'une entreprise (créateur ou premier membre)
     * CORRIGÉ : Logs détaillés pour debugging
     */
    private Persons findEntrepriseOwner(Entreprise entreprise) {
        logger.info("🔍 [ChatService] Recherche propriétaire pour entreprise: {} ({})", 
                   entreprise.getId(), entreprise.getNom());
        
        // Chercher dans les membres de l'entreprise (lazy loading)
        if (entreprise.getMembres() != null && !entreprise.getMembres().isEmpty()) {
            logger.info("📋 Membres chargés via lazy loading: {} membres", entreprise.getMembres().size());
            EntrepriseMembre premierMembre = entreprise.getMembres().get(0);
            Persons owner = premierMembre.getPersonne();
            logger.info("✅ Propriétaire trouvé via membres: {} ({} {})", 
                       owner.getId(), owner.getPrenom(), owner.getNom());
            return owner;
        }
        
        // Alternative : chercher via repository (plus fiable)
        logger.info("🔍 Recherche via repository EntrepriseMembre...");
        List<EntrepriseMembre> membres = entrepriseMembreRepository.findByEntreprise_Id(entreprise.getId());
        logger.info("📋 {} membres trouvés via repository", membres.size());
        
        if (!membres.isEmpty()) {
            // Prendre le premier membre (généralement le créateur/fondateur)
            EntrepriseMembre premierMembre = membres.get(0);
            Persons owner = premierMembre.getPersonne();
            logger.info("✅ Propriétaire trouvé via repository: {} ({} {})", 
                       owner.getId(), owner.getPrenom(), owner.getNom());
            
            // DEBUG : Afficher tous les membres pour information
            for (int i = 0; i < membres.size(); i++) {
                EntrepriseMembre membre = membres.get(i);
                Persons personne = membre.getPersonne();
                logger.info("🔍 DEBUG Membre {}: {} ({} {})", 
                           i+1, personne.getId(), personne.getPrenom(), personne.getNom());
            }
            
            return owner;
        }
        
        logger.warn("⚠️ AUCUN propriétaire trouvé pour l'entreprise: {} ({})", 
                   entreprise.getId(), entreprise.getNom());
        logger.warn("⚠️ Vérifiez que l'entreprise a bien des membres dans la table entreprise_membre");
        return null;
    }

    /**
     * Démarre une conversation depuis l'interface agent pour une entreprise assignée
     * Logique métier : L'agent contacte l'utilisateur propriétaire de l'entreprise
     */
    public ConversationResponse startConversationFromAssignedEntreprise(String entrepriseId, String agentId, String initialMessage) {
        logger.info("🚀 [ChatService] Agent {} démarre conversation pour entreprise assignée {}", agentId, entrepriseId);

        // Vérifier que l'entreprise existe et est assignée à cet agent
        Entreprise entreprise = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException("Entreprise non trouvée: " + entrepriseId));

        if (entreprise.getAssignedTo() == null || !entreprise.getAssignedTo().getId().equals(agentId)) {
            throw new BadRequestException("Cette entreprise n'est pas assignée à cet agent");
        }

        // Vérifier que l'agent existe
        Persons agent = personsRepository.findById(agentId)
            .orElseThrow(() -> new NotFoundException("Agent non trouvé: " + agentId));

        // Trouver l'utilisateur propriétaire de l'entreprise
        Persons user = findEntrepriseOwner(entreprise);
        if (user == null) {
            throw new NotFoundException("Aucun propriétaire trouvé pour l'entreprise: " + entrepriseId);
        }

        // Vérifier s'il existe déjà une conversation active
        List<Conversation> existingConversations = conversationRepository.findActiveConversationBetweenParticipants(
            entrepriseId, agentId, user.getId());

        if (!existingConversations.isEmpty()) {
            logger.info("✅ Conversation existante trouvée: {}", existingConversations.get(0).getId());
            return mapToConversationResponse(existingConversations.get(0));
        }

        // Créer une nouvelle conversation
        String subject = "Demande concernant " + entreprise.getNom();
        Conversation conversation = new Conversation(entreprise, agent, user, subject);
        conversation.setPriority(ConversationPriority.NORMAL);

        conversation = conversationRepository.save(conversation);
        logger.info("✅ Nouvelle conversation créée: {}", conversation.getId());

        // AUTO-CORRECTION : S'assurer que l'utilisateur est membre de l'entreprise
        ensureUserIsMemberOfEntreprise(user, entreprise);
        
        // Créer le message initial de l'agent
        Message initialMsg = new Message(conversation, agent, initialMessage);
        messageRepository.save(initialMsg);
        logger.info("✅ Message initial créé par l'agent");

        return mapToConversationResponse(conversation);
    }

    /**
     * Récupère les conversations d'un agent pour ses entreprises assignées
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getAgentConversationsForAssignedEntreprises(String agentId) {
        logger.info("🔍 [ChatService] Récupération conversations agent {} pour entreprises assignées", agentId);

        List<Conversation> conversations = conversationRepository.findActiveConversationsByAgent(
            agentId, ConversationStatus.ACTIVE);

        return conversations.stream()
            .map(this::mapToConversationResponse)
            .collect(Collectors.toList());
    }

    /**
     * Récupère les conversations d'un utilisateur pour ses entreprises
     * CORRIGÉ : Vérifie que l'utilisateur est bien propriétaire via EntrepriseMembre
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversationsForOwnedEntreprises(String userId) {
        logger.info("🔍 [ChatService] Récupération conversations utilisateur {} pour ses entreprises", userId);

        // Étape 1 : Trouver toutes les entreprises où cet utilisateur est membre
        List<EntrepriseMembre> memberships = entrepriseMembreRepository.findByPersonne_Id(userId);
        logger.info("📋 Utilisateur {} est membre de {} entreprises", userId, memberships.size());
        
        if (memberships.isEmpty()) {
            logger.warn("⚠️ Aucune entreprise trouvée pour l'utilisateur {}", userId);
            return new ArrayList<>();
        }

        // Étape 2 : Récupérer les IDs des entreprises
        List<String> entrepriseIds = memberships.stream()
            .map(membre -> membre.getEntreprise().getId())
            .collect(Collectors.toList());
        
        logger.info("🏢 Entreprises de l'utilisateur : {}", entrepriseIds);

        // Étape 3 : Trouver toutes les conversations pour ces entreprises où l'utilisateur est participant
        List<Conversation> allConversations = new ArrayList<>();
        
        for (String entrepriseId : entrepriseIds) {
            // Conversations où l'utilisateur est dans user_id pour cette entreprise
            List<Conversation> userConversations = conversationRepository.findByUserIdOrAgentIdAndEntrepriseIdOrderByModificationDesc(
                userId, userId, entrepriseId);
            allConversations.addAll(userConversations);
            
            logger.info("💬 Entreprise {} : {} conversations trouvées", entrepriseId, userConversations.size());
        }
        
        // Étape 4 : Supprimer les doublons et trier par modification
        List<Conversation> uniqueConversations = allConversations.stream()
            .distinct()
            .sorted((c1, c2) -> c2.getModification().compareTo(c1.getModification()))
            .collect(Collectors.toList());
        
        logger.info("✅ Total {} conversations uniques trouvées pour l'utilisateur {}", uniqueConversations.size(), userId);
        
        // DEBUG : Afficher les détails des conversations trouvées
        for (int i = 0; i < uniqueConversations.size(); i++) {
            Conversation conv = uniqueConversations.get(i);
            logger.info("🔍 DEBUG Conversation {}: ID={}, Agent={}, User={}, Entreprise={}, Subject={}", 
                i+1, conv.getId(), 
                conv.getAgent() != null ? conv.getAgent().getId() : "null",
                conv.getUser() != null ? conv.getUser().getId() : "null",
                conv.getEntreprise() != null ? conv.getEntreprise().getNom() : "null",
                conv.getSubject());
        }

        return uniqueConversations.stream()
            .map(this::mapToConversationResponse)
            .collect(Collectors.toList());
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
        logger.info("📤 [ChatService] Envoi message dans conversation {} par {}", conversationId, senderId);

        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new NotFoundException("Conversation non trouvée: " + conversationId));

        Persons sender = personsRepository.findById(senderId)
            .orElseThrow(() -> new NotFoundException("Expéditeur non trouvé: " + senderId));

        // Vérifier que l'expéditeur a accès à cette conversation (agent OU utilisateur)
        boolean isAgent = conversation.getAgent().getId().equals(senderId);
        boolean isUser = conversation.getUser().getId().equals(senderId);
        
        if (!isAgent && !isUser) {
            throw new BadRequestException("Accès non autorisé à cette conversation");
        }

        logger.info("✅ Expéditeur autorisé - Type: {}", isAgent ? "AGENT" : "USER");

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
        logger.info("✅ Message sauvegardé avec ID: {}", message.getId());

        // Mettre à jour le timestamp de modification de la conversation
        conversation.setModification(Instant.now());
        conversationRepository.save(conversation);

        return mapToMessageResponse(message);
    }

    @Override
    @Transactional
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
            
            // Déterminer le rôle selon la logique métier
            response.setSenderRole(determineRole(message.getSender(), message.getConversation()));
        }

        // Données documents
        response.setDocumentName(message.getDocumentName());
        response.setDocumentUrl(message.getDocumentUrl());

        return response;
    }

    private String getFullName(Persons person) {
        if (person == null) return "Inconnu";
        
        String prenom = person.getPrenom() != null ? person.getPrenom() : "";
        String nom = person.getNom() != null ? person.getNom() : "";
        String fullName = (prenom + " " + nom).trim();
        
        if (fullName.isEmpty()) {
            return person.getEmail() != null ? person.getEmail() : "Utilisateur inconnu";
        }
        
        return fullName;
    }

    /**
     * Détermine le rôle d'une personne dans une conversation
     */
    private String determineRole(Persons person, Conversation conversation) {
        if (person == null || conversation == null) return "UNKNOWN";
        
        if (conversation.getAgent() != null && conversation.getAgent().getId().equals(person.getId())) {
            return "AGENT";
        } else if (conversation.getUser() != null && conversation.getUser().getId().equals(person.getId())) {
            return "USER";
        }
        
        return "UNKNOWN";
    }

    /**
     * Méthode de diagnostic pour identifier les problèmes de conversation
     * TEMPORAIRE : Pour debugging du problème utilisateur
     */
    public void diagnosticConversationIssue(String conversationId, String userId) {
        logger.info("🔍 ========== DIAGNOSTIC CONVERSATION ===========");
        logger.info("🔍 Conversation ID: {}", conversationId);
        logger.info("🔍 User ID: {}", userId);
        
        // 1. Vérifier que la conversation existe
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) {
            logger.error("❌ Conversation non trouvée: {}", conversationId);
            return;
        }
        
        logger.info("✅ Conversation trouvée: {}", conversation.getSubject());
        logger.info("🏢 Entreprise: {} ({})", 
                   conversation.getEntreprise().getNom(), conversation.getEntreprise().getId());
        logger.info("👤 Agent: {} ({})", 
                   getFullName(conversation.getAgent()), conversation.getAgent().getId());
        logger.info("👥 User: {} ({})", 
                   getFullName(conversation.getUser()), conversation.getUser().getId());
        
        // 2. Vérifier les messages
        List<Message> messages = messageRepository.findByConversationIdOrderByCreationAsc(conversationId);
        logger.info("💬 {} messages dans la conversation", messages.size());
        
        for (int i = 0; i < messages.size(); i++) {
            Message msg = messages.get(i);
            String senderRole = determineRole(msg.getSender(), conversation);
            logger.info("💬 Message {}: {} - {} ({})", 
                       i+1, senderRole, 
                       msg.getContent().substring(0, Math.min(50, msg.getContent().length())),
                       msg.getSender().getId());
        }
        
        // 3. Vérifier si l'utilisateur est membre de l'entreprise
        List<EntrepriseMembre> memberships = entrepriseMembreRepository.findByPersonne_Id(userId);
        logger.info("📋 Utilisateur {} est membre de {} entreprises", userId, memberships.size());
        
        boolean isMemberOfThisEntreprise = false;
        for (EntrepriseMembre membre : memberships) {
            String entrepriseId = membre.getEntreprise().getId();
            String entrepriseNom = membre.getEntreprise().getNom();
            logger.info("🏢 Membre de: {} ({})", entrepriseNom, entrepriseId);
            
            if (entrepriseId.equals(conversation.getEntreprise().getId())) {
                isMemberOfThisEntreprise = true;
                logger.info("✅ MATCH: Utilisateur est membre de l'entreprise de la conversation");
            }
        }
        
        if (!isMemberOfThisEntreprise) {
            logger.error("❌ PROBLÈME: Utilisateur {} n'est PAS membre de l'entreprise {}", 
                        userId, conversation.getEntreprise().getId());
            logger.error("❌ Ceci explique pourquoi l'utilisateur ne voit pas la conversation");
        }
        
        // 4. Vérifier les conversations que l'utilisateur devrait voir
        List<Conversation> userConversations = conversationRepository.findByUserIdOrderByModificationDesc(
            userId, Pageable.unpaged()).getContent();
        logger.info("💬 Conversations directes de l'utilisateur: {}", userConversations.size());
        
        // 5. Tester la méthode getUserConversationsForOwnedEntreprises
        List<ConversationResponse> foundConversations = getUserConversationsForOwnedEntreprises(userId);
        logger.info("💬 Méthode getUserConversationsForOwnedEntreprises retourne: {} conversations", 
                   foundConversations.size());
        
        boolean conversationFound = false;
        for (ConversationResponse conv : foundConversations) {
            if (conv.getId().equals(conversationId)) {
                conversationFound = true;
                logger.info("✅ TROUVÉ: La conversation est dans les résultats");
                break;
            }
        }
        
        if (!conversationFound) {
            logger.error("❌ PROBLÈME: La conversation n'est PAS dans les résultats de getUserConversationsForOwnedEntreprises");
        }
        
        logger.info("🔍 ========== FIN DIAGNOSTIC ===========");
    }

    /**
     * S'assure que l'utilisateur est membre de l'entreprise
     * AUTO-CORRECTION : Ajoute l'utilisateur comme membre si nécessaire
     */
    private void ensureUserIsMemberOfEntreprise(Persons user, Entreprise entreprise) {
        logger.info("🔍 Vérification membre: utilisateur {} pour entreprise {}", 
                   user.getId(), entreprise.getNom());
        
        // Vérifier si l'utilisateur est déjà membre
        List<EntrepriseMembre> existing = entrepriseMembreRepository.findByPersonne_Id(user.getId()).stream()
            .filter(membre -> membre.getEntreprise().getId().equals(entreprise.getId()))
            .collect(Collectors.toList());
        
        if (existing.isEmpty()) {
            logger.info("🔧 AUTO-CORRECTION: Ajout utilisateur {} comme membre de {}", 
                       user.getId(), entreprise.getNom());
            
            // Créer une nouvelle association membre
            EntrepriseMembre newMember = new EntrepriseMembre();
            newMember.setEntreprise(entreprise);
            newMember.setPersonne(user);
            newMember.setCreation(Instant.now());
            newMember.setModification(Instant.now());
            
            entrepriseMembreRepository.save(newMember);
            logger.info("✅ Utilisateur {} ajouté comme membre de l'entreprise {}", 
                       user.getId(), entreprise.getNom());
        } else {
            logger.info("✅ Utilisateur {} est déjà membre de l'entreprise {}", 
                       user.getId(), entreprise.getNom());
        }
    }
}
