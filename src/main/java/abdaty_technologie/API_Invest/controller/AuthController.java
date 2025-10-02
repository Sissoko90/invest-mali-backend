package abdaty_technologie.API_Invest.controller;

import abdaty_technologie.API_Invest.constants.Messages;
import abdaty_technologie.API_Invest.dto.requests.LoginRequest;
import abdaty_technologie.API_Invest.dto.requests.RegisterRequest;
import abdaty_technologie.API_Invest.dto.requests.ForgotPasswordRequest;
import abdaty_technologie.API_Invest.dto.requests.ResetPasswordRequest;
import abdaty_technologie.API_Invest.dto.responses.ErrorResponse;
import abdaty_technologie.API_Invest.dto.responses.LoginResponse;
import abdaty_technologie.API_Invest.dto.responses.UserAuthResponse;
import abdaty_technologie.API_Invest.service.IAuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private IAuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Inscription", description = "Inscription d'une nouvelle personne et création du compte utilisateur")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            LoginResponse response = authService.register(registerRequest);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion", description = "Authentification d'un utilisateur")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            LoginResponse response = authService.authenticate(loginRequest);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.INTERNAL_SERVER_ERROR));
        }
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Demande de réinitialisation", description = "Génère un token de réinitialisation pour l'email fourni")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            String token = authService.requestPasswordReset(request);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            // DEBUG: exposer le message d'erreur réel pour faciliter le diagnostic
            return ResponseEntity.internalServerError().body(new ErrorResponse("Erreur lors de la demande de réinitialisation : " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Réinitialisation du mot de passe", description = "Applique la réinitialisation via le token et le nouveau mot de passe")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request);
            return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            // DEBUG: exposer le message d'erreur réel pour faciliter le diagnostic
            return ResponseEntity.internalServerError().body(new ErrorResponse("Erreur lors de la réinitialisation du mot de passe : " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Authentification d'un utilisateur", description = "Récupère les informations d'authentification d'un utilisateur par son ID")
    public ResponseEntity<?> getUserAuth(@PathVariable String userId) {
        try {
            UserAuthResponse response = authService.getUserAuthInfo(userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(Messages.USER_NOT_FOUND_OR_ERROR + e.getMessage()));
        }
    }

    @GetMapping("/users")
    @Operation(summary = "Liste des utilisateurs", description = "Récupère la liste de tous les utilisateurs avec leurs IDs")
    public ResponseEntity<?> getAllUsers() {
        try {
            var users = authService.getAllUsersInfo();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse(Messages.ERROR_RETRIEVING_USERS + e.getMessage()));
        }
    }
}
