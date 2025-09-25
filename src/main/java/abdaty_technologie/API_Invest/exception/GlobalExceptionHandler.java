package abdaty_technologie.API_Invest.exception;

import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import abdaty_technologie.API_Invest.constants.Messages;

import abdaty_technologie.API_Invest.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;


/**
 * Gestionnaire global des exceptions REST.
 *
 * Standardise les réponses d'erreur pour:
 * - BadRequestException (400)
 * - NotFoundException (404)
 * - MethodArgumentNotValidException (400) -> map champ -> message
 * - HttpMessageNotReadableException (400) -> détail enum/format invalide
 * - MethodArgumentTypeMismatchException (400) -> paramètres de requête invalides
 * - Exception générique (500)
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /** 400 pour erreurs fonctionnelles */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        ErrorResponse body = ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);

    }

    /** 404 pour ressources non trouvées */
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex, HttpServletRequest req) {
        ErrorResponse body = ErrorResponse.of(HttpStatus.NOT_FOUND.value(), "Not Found", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);

    }

    /** 400 pour erreurs de validation des DTOs (@Valid) */
    @ExceptionHandler(MethodArgumentNotValidException.class)

    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        String message = fieldErrors.entrySet().stream()
                .map(e -> e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining("; "));
        ErrorResponse body = ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Validation Error", message, req.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);

    }

    /** 400 pour corps JSON illisible: précise les valeurs enum acceptées, sinon format invalide */
    @ExceptionHandler(HttpMessageNotReadableException.class)

    public ResponseEntity<ErrorResponse> handleNotReadable(HttpMessageNotReadableException ex, HttpServletRequest req) {

        Throwable cause = ex.getCause();
        if (cause instanceof InvalidFormatException ife) {
            Class<?> targetType = ife.getTargetType();
            String path = ife.getPath().stream()
                    .map(ref -> ref.getFieldName() != null ? ref.getFieldName() : String.valueOf(ref.getIndex()))
                    .collect(Collectors.joining("."));
            Object invalidValue = ife.getValue();

            String message;

            if (targetType != null && targetType.isEnum()) {
                String allowed = Arrays.stream(targetType.getEnumConstants())
                        .map(e -> ((Enum<?>) e).name())
                        .collect(Collectors.joining(", "));

                message = Messages.invalidEnumValue(path, allowed);
            } else {
                message = Messages.invalidFieldFormat(path);
            }
            ErrorResponse body = ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", message + ", field=" + path + ", invalidValue=" + invalidValue, req.getRequestURI());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
        }
        ErrorResponse body = ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);

    }

    /** 400 pour paramètres de requête (Query/Path) avec type invalide */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)

    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        Class<?> required = ex.getRequiredType();
        String message;

        if (required != null && required.isEnum()) {
            String allowed = Arrays.stream(required.getEnumConstants())
                    .map(e -> ((Enum<?>) e).name())
                    .collect(Collectors.joining(", "));

            message = Messages.invalidParamEnum(ex.getName(), allowed);
        } else {
            message = Messages.invalidParamType(ex.getName());
        }
        ErrorResponse body = ErrorResponse.of(HttpStatus.BAD_REQUEST.value(), "Bad Request", message + ", param=" + ex.getName() + ", invalidValue=" + ex.getValue(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** 500 catch-all: message JSON unifié */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleOther(Exception ex, HttpServletRequest req) {
        ErrorResponse body = ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Internal Server Error", ex.getMessage(), req.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

