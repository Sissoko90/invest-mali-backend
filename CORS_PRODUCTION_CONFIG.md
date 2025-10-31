# Configuration CORS pour la production

## Problème identifié
L'application agent (`https://investmali-agent.abdatytch.com`) ne peut pas se connecter au backend (`https://investmali.abdatytch.com`) à cause d'une erreur CORS.

## Solution
Modifier le fichier `application.yml` en production pour ajouter le domaine de l'agent :

```yaml
app:
  cors:
    allowed-origins: "https://investmali.abdatytch.com,https://investmali-agent.abdatytch.com"
```

## Configuration complète recommandée

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/api_invest_db
    username: ${DB_USERNAME:your_db_user}
    password: ${DB_PASSWORD:your_db_password}
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect
        format_sql: true
    database-platform: org.hibernate.dialect.MySQLDialect

  jackson:
    time-zone: Africa/Bamako
    date-format: yyyy-MM-dd HH:mm:ss

# Configuration CORS - CRITIQUE
app:
  cors:
    allowed-origins: "https://investmali.abdatytch.com,https://investmali-agent.abdatytch.com"

# JWT Configuration
jwt:
  secret: ${JWT_SECRET:your-super-secret-jwt-key-here}
  expiration: 86400000

# Logging
logging:
  level:
    abdaty_technologie.API_Invest: INFO
    org.springframework.security: WARN
    org.hibernate.SQL: WARN
```

## Actions à effectuer

1. **Connectez-vous à votre serveur de production**
2. **Modifiez le fichier application.yml** pour ajouter les deux domaines
3. **Redémarrez l'application Spring Boot**

## Vérification
Après redémarrage, l'agent devrait pouvoir se connecter sans erreur CORS.

## Alternative temporaire (développement uniquement)
Si vous voulez tester rapidement, vous pouvez temporairement utiliser `*` :
```yaml
app:
  cors:
    allowed-origins: "*"
```
⚠️ **ATTENTION** : N'utilisez jamais `*` en production pour des raisons de sécurité !
