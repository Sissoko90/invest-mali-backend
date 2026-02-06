// Service pour gérer les demandes de contact

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  id?: string;
}

class ContactService {
  private baseUrl = process.env.REACT_APP_USER_API_URL || 'https://www.formalisation.ml/api/v1';

  async submitContactForm(data: ContactFormData): Promise<ContactResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        message: 'Votre message a été envoyé avec succès !',
        id: result.id
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du formulaire de contact:', error);
      return {
        success: false,
        message: 'Une erreur s\'est produite lors de l\'envoi de votre message. Veuillez réessayer.'
      };
    }
  }

  async getContactInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/contact/info`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de contact:', error);
      // Retourner des informations par défaut
      return {
        phone: ['+223 20 22 XX XX', '+223 76 XX XX XX'],
        email: ['formalisation@apimali.gov.ml', ''],
        address: {
          street: 'Quartier du Fleuve',
          city: 'Bamako',
          country: 'Mali'
        },
        // hours: {
        //   weekdays: '8h00 - 17h00',
        //   saturday: '8h00 - 12h00',
        //   sunday: 'Fermé'
        // }
      };
    }
  }

  // Validation côté client
  validateContactForm(data: ContactFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Veuillez saisir une adresse email valide');
    }

    if (!data.subject) {
      errors.push('Veuillez sélectionner un sujet');
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.push('Le message doit contenir au moins 10 caractères');
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Le numéro de téléphone n\'est pas valide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Regex pour les numéros maliens (+223 XX XX XX XX)
    const phoneRegex = /^(\+223|00223|223)?[0-9\s\-\.]{8,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }
}

export const contactService = new ContactService();
export default contactService;
