package abdaty_technologie.API_Invest.service.impl;

import java.sql.Blob;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Objects;
import java.util.List;
import javax.sql.rowset.serial.SerialBlob;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import abdaty_technologie.API_Invest.Entity.Documents;
import abdaty_technologie.API_Invest.Entity.Entreprise;
import abdaty_technologie.API_Invest.Entity.EntrepriseMembre;
import abdaty_technologie.API_Invest.Entity.Persons;
import abdaty_technologie.API_Invest.Entity.Enum.EntrepriseRole;
import abdaty_technologie.API_Invest.Entity.Enum.SituationMatrimoniales;
import abdaty_technologie.API_Invest.Entity.Enum.TypeDocuments;
import abdaty_technologie.API_Invest.Entity.Enum.TypePieces;
import abdaty_technologie.API_Invest.exception.BadRequestException;
import abdaty_technologie.API_Invest.exception.NotFoundException;
import abdaty_technologie.API_Invest.repository.DocumentsRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseMembreRepository;
import abdaty_technologie.API_Invest.repository.EntrepriseRepository;
import abdaty_technologie.API_Invest.repository.PersonsRepository;
import abdaty_technologie.API_Invest.service.DocumentsService;
import abdaty_technologie.API_Invest.constants.Messages;

@Service
@Transactional
public class DocumentsServiceImpl implements DocumentsService {

    @Autowired private DocumentsRepository documentsRepository;
    @Autowired private PersonsRepository personsRepository;
    @Autowired private EntrepriseRepository entrepriseRepository;
    @Autowired private EntrepriseMembreRepository entrepriseMembreRepository;

    @Override
    public Documents uploadPiece(String personneId, String entrepriseId, TypePieces typePiece, String numero, java.time.LocalDate dateExpiration, MultipartFile file) {
        if (personneId == null || personneId.isBlank()) throw new BadRequestException(Messages.PERSONNE_ID_OBLIGATOIRE);
        if (entrepriseId == null || entrepriseId.isBlank()) throw new BadRequestException(Messages.ENTREPRISE_ID_OBLIGATOIRE);
        if (typePiece == null) throw new BadRequestException(Messages.TYPE_PIECE_OBLIGATOIRE);
        if (numero == null || numero.isBlank()) throw new BadRequestException(Messages.NUMERO_OBLIGATOIRE_PIECE);
        if (numero.trim().length() < 6) throw new BadRequestException(Messages.NUMERO_PIECE_TROP_COURT);
        if (dateExpiration == null) throw new BadRequestException(Messages.DATE_EXPIRATION_OBLIGATOIRE);
        if (dateExpiration.isBefore(LocalDate.now(ZoneId.of("Africa/Bamako")))) {
            throw new BadRequestException(Messages.DATE_EXPIRATION_INVALIDE);
        }
        if (file == null || file.isEmpty()) throw new BadRequestException(Messages.PHOTO_PIECE_OBLIGATOIRE);

        Persons person = personsRepository.findById(personneId)
            .orElseThrow(() -> new NotFoundException(Messages.personneIntrouvable(personneId)));
        Entreprise ent = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));

        // Unicité du numéro et du type de pièce pour la personne
        if (documentsRepository.existsByNumero(numero.trim())) {
            throw new BadRequestException(Messages.NUMERO_PIECE_DEJA_UTILISE);
        }
        // DÉSACTIVÉ: Contrôle d'unicité par typePiece pour une personne
        // Une personne peut avoir plusieurs documents du même type (renouvellement, validité, etc.)
        // if (!documentsRepository.findByTypePieceAndPersonneId(typePiece, personneId).isEmpty()) {
        //     throw new BadRequestException(Messages.PIECE_DEJA_EXISTANTE_POUR_PERSONNE);
        // }

        Documents d = new Documents();
        d.setPersonne(person);
        d.setEntreprise(ent);
        d.setTypePiece(typePiece);
        d.setTypeDocument(null);
        d.setNumero(numero);
        d.setPhotoPiece(toBlob(file));
        d.setDateExpiration(dateExpiration);
        return documentsRepository.save(d);
    }

    @Override
    public Documents uploadDocument(String personneId, String entrepriseId, TypeDocuments typeDocument, String numero, MultipartFile file) {
        if (personneId == null || personneId.isBlank()) throw new BadRequestException(Messages.PERSONNE_ID_OBLIGATOIRE);
        if (entrepriseId == null || entrepriseId.isBlank()) throw new BadRequestException(Messages.ENTREPRISE_ID_OBLIGATOIRE);
        if (typeDocument == null) throw new BadRequestException(Messages.TYPE_DOCUMENT_OBLIGATOIRE);
        if (file == null || file.isEmpty()) throw new BadRequestException(Messages.PHOTO_DOCUMENT_OBLIGATOIRE);

        Persons person = personsRepository.findById(personneId)
            .orElseThrow(() -> new NotFoundException(Messages.personneIntrouvable(personneId)));
        Entreprise ent = entrepriseRepository.findById(entrepriseId)
            .orElseThrow(() -> new NotFoundException(Messages.ENTREPRISE_INTROUVABLE));

        // Business rules
        switch (typeDocument) {
            case CASIER_JUDICIAIRE -> {
                if (!Boolean.TRUE.equals(ent.getExtraitJudiciaire())) {
                    throw new BadRequestException(Messages.EXTRAIT_JUDICIAIRE_REQUIS);
                }
                ensureIsGerant(person, ent);
            }
            case CERTIFICAT_RESIDENCE, EXTRAIT_NAISSANCE -> {
                ensureIsGerant(person, ent);
            }
            case ACTE_MARIAGE -> {
                if (!Objects.equals(person.getSituationMatrimoniale(), SituationMatrimoniales.MARIE)) {
                    throw new BadRequestException(Messages.ACTE_MARIAGE_REQUIS_SI_MARIE);
                }
                // Doit appartenir au gérant
                ensureIsGerant(person, ent);
            }
            case STATUS_SOCIETE -> {
                if (!Boolean.TRUE.equals(ent.getStatutSociete())) {
                    throw new BadRequestException(Messages.STATUT_SOCIETE_REQUIS);
                }
                // Ce document appartient aux dirigeants uniquement
                ensureIsDirigeant(person, ent);
            }
            case REGISTRE_COMMERCE -> {
                // Appartient aux dirigeants uniquement
                ensureIsDirigeant(person, ent);
            }
            case DECLARATION_HONNEUR -> {
                // Appartient au gérant uniquement (alternative au casier judiciaire)
                ensureIsGerant(person, ent);
            }
            default -> {}
        }

        Documents d = new Documents();
        d.setPersonne(person);
        d.setEntreprise(ent);
        d.setTypePiece(null);
        d.setTypeDocument(typeDocument);
        String safeNumero = (numero != null && !numero.isBlank()) ? numero.trim() : generateNumeroFallback(typeDocument);
        d.setNumero(safeNumero);
        d.setPhotoPiece(toBlob(file));
        return documentsRepository.save(d);
    }

    private void ensureIsGerant(Persons person, Entreprise ent) {
        List<EntrepriseMembre> gerants = entrepriseMembreRepository.findByEntreprise_IdAndRole(ent.getId(), EntrepriseRole.GERANT);
        boolean ok = gerants.stream().anyMatch(em -> em.getPersonne() != null && em.getPersonne().getId().equals(person.getId()) && isActive(em));
        if (!ok) {
            throw new BadRequestException(Messages.DOCUMENT_POUR_GERANT_SEULEMENT);
        }
    }

    private void ensureIsDirigeant(Persons person, Entreprise ent) {
        List<EntrepriseMembre> fnds = entrepriseMembreRepository.findByEntreprise_IdAndRole(ent.getId(), EntrepriseRole.DIRIGEANT);
        boolean ok = fnds.stream().anyMatch(em -> em.getPersonne() != null && em.getPersonne().getId().equals(person.getId()) && isActive(em));
        if (!ok) {
            throw new BadRequestException("Ce document est réservé aux dirigeants de l'entreprise");
        }
    }


    private boolean isActive(EntrepriseMembre em) {
        try {
            LocalDate now = LocalDate.now(ZoneId.of("Africa/Bamako"));
            return (em.getDateDebut() == null || !now.isBefore(em.getDateDebut())) &&
                   (em.getDateFin() == null || !now.isAfter(em.getDateFin()));
        } catch (Exception e) {
            return true;
        }
    }

    private Blob toBlob(MultipartFile file) {
        try {
            return new SerialBlob(file.getBytes());
        } catch (Exception e) {
            throw new BadRequestException(Messages.LECTURE_FICHIER_IMPOSSIBLE);
        }
    }

    private String generateNumeroFallback(TypeDocuments typeDocument) {
        // Génère un identifiant court basé sur le type de document et un UUID tronqué
        String prefix = typeDocument != null ? typeDocument.name() : "DOC";
        String rand = UUID.randomUUID().toString().replace("-", "");
        return (prefix + "-" + rand).substring(0, Math.min(prefix.length() + 1 + rand.length(), 20));
    }

    @Override
    public boolean isPieceNumeroAlreadyUsed(String numero, String typePiece) {
        if (numero == null || numero.isBlank()) {
            return false;
        }
        
        try {
            // Convertir le string en enum si possible
            TypePieces pieceType = TypePieces.valueOf(typePiece.toUpperCase());
            
            // Vérifier dans la base de données
            return documentsRepository.existsByNumeroAndTypePiece(numero.trim(), pieceType);
            
        } catch (IllegalArgumentException e) {
            // Type de pièce invalide
            return false;
        } catch (Exception e) {
            // En cas d'erreur, on considère que la pièce n'existe pas
            return false;
        }
    }
}
