package abdaty_technologie.API_Invest.service;

import java.util.Collection;

public interface EmailService {
    void sendTo(String to, String subject, String text);
    void sendToMany(Collection<String> tos, String subject, String text);
}
