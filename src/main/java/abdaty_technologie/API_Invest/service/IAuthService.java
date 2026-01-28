package abdaty_technologie.API_Invest.service;

import java.util.List;

import abdaty_technologie.API_Invest.dto.requests.LoginRequest;
import abdaty_technologie.API_Invest.dto.requests.RegisterRequest;
import abdaty_technologie.API_Invest.dto.requests.ForgotPasswordRequest;
import abdaty_technologie.API_Invest.dto.requests.ResetPasswordRequest;
import abdaty_technologie.API_Invest.dto.responses.LoginResponse;
import abdaty_technologie.API_Invest.dto.responses.UserAuthResponse;

/**
 * Interface pour les services d'authentification
 */
public interface IAuthService {
    
    /**
     * Authentifie un utilisateur
     */
    LoginResponse authenticate(LoginRequest loginRequest);
    
    /**
     * Inscription d'une nouvelle personne et création du compte utilisateur
     */
    LoginResponse register(RegisterRequest registerRequest);
    
    /**
     * Demande de réinitialisation de mot de passe
     * @return un token de réinitialisation
     */
    String requestPasswordReset(ForgotPasswordRequest request);

    /**
     * Application de la réinitialisation via le token
     */
    void resetPassword(ResetPasswordRequest request);
    
    /**
     * Récupère les informations d'authentification d'un utilisateur
     */
    UserAuthResponse getUserAuthInfo(String userId);
    
    /**
     * Récupère la liste de tous les utilisateurs
     */
    List<UserAuthResponse> getAllUsersInfo();
}
