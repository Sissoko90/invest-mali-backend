package abdaty_technologie.API_Invest.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import abdaty_technologie.API_Invest.Entity.Utilisateurs;
import abdaty_technologie.API_Invest.repository.UtilisateursRepository;

@RestController
@RequestMapping("/utilisateurs")
public class UtilisateursController {

    @Autowired
    private UtilisateursRepository utilisateursRepository;

    /**
     * Récupérer tous les utilisateurs
     */
    @GetMapping
    public ResponseEntity<List<Utilisateurs>> getAllUtilisateurs() {
        List<Utilisateurs> utilisateurs = utilisateursRepository.findAll();
        return ResponseEntity.ok(utilisateurs);
    }

    /**
     * Récupérer un utilisateur par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Utilisateurs> getUtilisateurById(@PathVariable String id) {
        return utilisateursRepository.findById(id)
                .map(utilisateur -> ResponseEntity.ok(utilisateur))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Récupérer un utilisateur par son nom d'utilisateur
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<Utilisateurs> getUtilisateurByUsername(@PathVariable String username) {
        return utilisateursRepository.findByUtilisateur(username)
                .map(utilisateur -> ResponseEntity.ok(utilisateur))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Compter le nombre total d'utilisateurs
     */
    @GetMapping("/count")
    public ResponseEntity<Long> countUtilisateurs() {
        long count = utilisateursRepository.count();
        return ResponseEntity.ok(count);
    }
}
