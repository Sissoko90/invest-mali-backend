package abdaty_technologie.API_Invest.service;

import abdaty_technologie.API_Invest.dto.tresorpay.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests unitaires pour TresorPayService
 */
@ExtendWith(MockitoExtension.class)
class TresorPayServiceTest {

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private TresorPayService tresorPayService;

    @BeforeEach
    void setUp() {
        // Configuration des propriétés via reflection
        ReflectionTestUtils.setField(tresorPayService, "baseUrl", "https://recette.tresorpay.finances.ml/api/public/v1");
        ReflectionTestUtils.setField(tresorPayService, "authUrl", "https://recette.auth.finances.ml/realms/tresorpay/protocol/openid-connect/token");
        ReflectionTestUtils.setField(tresorPayService, "clientId", "api-mali");
        ReflectionTestUtils.setField(tresorPayService, "clientSecret", "SYhpGoLQoojalN56CLyox2Cirqsm1q6k");
        ReflectionTestUtils.setField(tresorPayService, "codeClient", "APP-API-MALI");
        ReflectionTestUtils.setField(tresorPayService, "codeStructure", "API-MALI");
        ReflectionTestUtils.setField(tresorPayService, "callbackUrl", "http://localhost:8080/api/v1/payments/tresorpay/callback");
        ReflectionTestUtils.setField(tresorPayService, "redirectUrl", "http://localhost:3000/payment/success");
    }

    @Test
    void testCreateNotice_Success() {
        // Arrange
        TresorPayOAuthResponse oauthResponse = new TresorPayOAuthResponse();
        oauthResponse.setAccessToken("test-access-token");
        oauthResponse.setExpiresIn(3600);

        TresorPayNoticeResponse expectedResponse = new TresorPayNoticeResponse();
        expectedResponse.setReference("TP20251219.1500.AR1234");
        expectedResponse.setStatus("EMITTED");

        when(restTemplate.postForEntity(
                eq("https://recette.auth.finances.ml/realms/tresorpay/protocol/openid-connect/token"),
                any(HttpEntity.class),
                eq(TresorPayOAuthResponse.class)
        )).thenReturn(new ResponseEntity<>(oauthResponse, HttpStatus.OK));

        when(restTemplate.postForEntity(
                eq("https://recette.tresorpay.finances.ml/api/public/v1/payment/create-notice-recette"),
                any(HttpEntity.class),
                eq(TresorPayNoticeResponse.class)
        )).thenReturn(new ResponseEntity<>(expectedResponse, HttpStatus.OK));

        TresorPayNoticeRequest request = tresorPayService.buildNoticeRequest(
                "ENT123", "ENT-2025-001", "Test Company", 250000L, "Test payment", 
                "John", "Doe", "john@test.com", "XX-XX-XX-XX"
        );

        // Act
        TresorPayNoticeResponse result = tresorPayService.createNotice(request);

        // Assert
        assertNotNull(result);
        assertEquals("TP20251219.1500.AR1234", result.getReference());
        assertEquals("EMITTED", result.getStatus());
        
        verify(restTemplate, times(1)).postForEntity(
                contains("token"), any(HttpEntity.class), eq(TresorPayOAuthResponse.class)
        );
        verify(restTemplate, times(1)).postForEntity(
                contains("create-notice-recette"), any(HttpEntity.class), eq(TresorPayNoticeResponse.class)
        );
    }

    @Test
    void testGetNoticeStatus_Success() {
        // Arrange
        TresorPayOAuthResponse oauthResponse = new TresorPayOAuthResponse();
        oauthResponse.setAccessToken("test-access-token");
        oauthResponse.setExpiresIn(3600);

        TresorPayStatusResponse expectedStatus = new TresorPayStatusResponse();
        expectedStatus.setReference("TP20251219.1500.AR1234");
        expectedStatus.setStatus("PAID");
        expectedStatus.setProvider("ORANGE_MONEY");

        when(restTemplate.postForEntity(
                contains("token"), any(HttpEntity.class), eq(TresorPayOAuthResponse.class)
        )).thenReturn(new ResponseEntity<>(oauthResponse, HttpStatus.OK));

        when(restTemplate.exchange(
                eq("https://recette.tresorpay.finances.ml/api/public/v1/notice-recette/status/TP20251219.1500.AR1234"),
                eq(HttpMethod.GET),
                any(HttpEntity.class),
                eq(TresorPayStatusResponse.class)
        )).thenReturn(new ResponseEntity<>(expectedStatus, HttpStatus.OK));

        // Act
        TresorPayStatusResponse result = tresorPayService.getNoticeStatus("TP20251219.1500.AR1234");

        // Assert
        assertNotNull(result);
        assertEquals("TP20251219.1500.AR1234", result.getReference());
        assertEquals("PAID", result.getStatus());
        assertEquals("ORANGE_MONEY", result.getProvider());
    }

    @Test
    void testBuildNoticeRequest() {
        // Act
        TresorPayNoticeRequest request = tresorPayService.buildNoticeRequest(
                "ENT123", "ENT-2025-001", "Test Company", 250000L, "Test payment", 
                "John", "Doe", "john@test.com", "XX-XX-XX-XX"
        );

        // Assert
        assertNotNull(request);
        assertEquals("ENT-2025-001", request.getReference());
        assertEquals("APP-API-MALI", request.getCodeClient());
        assertEquals("API-MALI", request.getCodeStructure());
        assertEquals(250000L, request.getNetTotal());
        
        assertNotNull(request.getTaxPayer());
        assertEquals("Doe", request.getTaxPayer().getName());
        assertEquals("John", request.getTaxPayer().getFirstName());
        assertEquals("Test Company", request.getTaxPayer().getCompanyName());
        assertEquals("john@test.com", request.getTaxPayer().getEmail());
        assertEquals("XX-XX-XX-XX", request.getTaxPayer().getPhoneNumber());
        
        assertNotNull(request.getItems());
        assertEquals(1, request.getItems().size());
        assertEquals("Création d'entreprise", request.getItems().get(0).getName());
        assertEquals(250000L, request.getItems().get(0).getUnitPrice());
        
        assertNotNull(request.getAuthorizedPaymentModes());
        assertEquals(5, request.getAuthorizedPaymentModes().size());
        
        // Vérifier que tous les providers sont présents
        assertTrue(request.getAuthorizedPaymentModes().stream()
                .anyMatch(mode -> "ORANGE_MONEY".equals(mode.getCodeProvider())));
        assertTrue(request.getAuthorizedPaymentModes().stream()
                .anyMatch(mode -> "MOOV_MONEY".equals(mode.getCodeProvider())));
        assertTrue(request.getAuthorizedPaymentModes().stream()
                .anyMatch(mode -> "SAMA_MONEY".equals(mode.getCodeProvider())));
        assertTrue(request.getAuthorizedPaymentModes().stream()
                .anyMatch(mode -> "WAVE".equals(mode.getCodeProvider())));
        assertTrue(request.getAuthorizedPaymentModes().stream()
                .anyMatch(mode -> "CARD".equals(mode.getCodeProvider())));
    }

    @Test
    void testGeneratePaymentUrl() {
        // Act
        String paymentUrl = tresorPayService.generatePaymentUrl("TP20251219.1500.AR1234");

        // Assert
        assertEquals("https://recette.tresorpay.finances.ml/public/init-paiement?id=TP20251219.1500.AR1234", paymentUrl);
    }

    @Test
    void testCreateNotice_AuthenticationFailure() {
        // Arrange
        when(restTemplate.postForEntity(
                contains("token"), any(HttpEntity.class), eq(TresorPayOAuthResponse.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.UNAUTHORIZED));

        TresorPayNoticeRequest request = tresorPayService.buildNoticeRequest(
                "ENT123", "ENT-2025-001", "Test Company", 250000L, "Test payment", 
                "John", "Doe", "john@test.com", "XX-XX-XX-XX"
        );

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tresorPayService.createNotice(request);
        });

        assertTrue(exception.getMessage().contains("Impossible d'obtenir le token d'accès TresorPay"));
    }

    @Test
    void testCreateNotice_ApiFailure() {
        // Arrange
        TresorPayOAuthResponse oauthResponse = new TresorPayOAuthResponse();
        oauthResponse.setAccessToken("test-access-token");
        oauthResponse.setExpiresIn(3600);

        when(restTemplate.postForEntity(
                contains("token"), any(HttpEntity.class), eq(TresorPayOAuthResponse.class)
        )).thenReturn(new ResponseEntity<>(oauthResponse, HttpStatus.OK));

        when(restTemplate.postForEntity(
                contains("create-notice-recette"), any(HttpEntity.class), eq(TresorPayNoticeResponse.class)
        )).thenReturn(new ResponseEntity<>(HttpStatus.BAD_REQUEST));

        TresorPayNoticeRequest request = tresorPayService.buildNoticeRequest(
                "ENT123", "ENT-2025-001", "Test Company", 250000L, "Test payment", 
                "John", "Doe", "john@test.com", "XX-XX-XX-XX"
        );

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            tresorPayService.createNotice(request);
        });

        assertTrue(exception.getMessage().contains("Impossible de créer l'avis TresorPay"));
    }
}
