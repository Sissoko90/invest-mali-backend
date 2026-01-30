<<<<<<< HEAD
﻿import React from 'react';

// Composant pour générer le contenu d'email de notification
const EmailNotificationTemplate = () => {
  const generateEmailContent = (userName: string, agentName: string, entrepriseName: string, messagePreview: string) => {
    const chatUrl = `${window.location.origin}/chat?user=075e96d0-651c-40e7-a44a-04341daaac56`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nouveau message de votre agent</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message-preview { background: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 15px 0; }
        .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Nouveau Message</h1>
            <p>Vous avez reçu un message de votre agent</p>
        </div>
        
        <div class="content">
            <h2>Bonjour ${userName},</h2>
            
            <p>Votre agent <strong>${agentName}</strong> vous a envoyé un nouveau message concernant votre entreprise <strong>${entrepriseName}</strong>.</p>
            
            <div class="message-preview">
                <h3>Aperçu du message :</h3>
                <p><em>"${messagePreview}"</em></p>
            </div>
            
            <p>Pour lire le message complet et répondre à votre agent, cliquez sur le bouton ci-dessous :</p>
            
            <a href="${chatUrl}" class="cta-button">📱 Ouvrir mes messages</a>
            
            <p>Vous pouvez également copier ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${chatUrl}</p>
            
            <hr style="margin: 30px 0;">
            
            <h3>🔔 Fonctionnalités disponibles :</h3>
            <ul>
                <li>✅ Voir tous vos messages</li>
                <li>✅ Répondre directement à votre agent</li>
                <li>✅ Suivre l'avancement de vos dossiers</li>
                <li>✅ Historique complet des conversations</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système InvestMali.</p>
            <p>Si vous avez des questions, contactez notre support.</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  // Exemple d'utilisation
  const exampleEmail = generateEmailContent(
    "Abdoul Doukhanse",
    "Agent Test",
    "Dymo",
    "Bonjour, nous avons bien reçu votre demande de création d'entreprise..."
  );

  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">📧 Template Email de Notification</h2>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-2">Aperçu de l'email :</h3>
        <div 
          className="border rounded p-4 max-h-96 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: exampleEmail }}
        />
      </div>
      
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <h3 className="font-semibold text-primary-800 mb-2">💡 Comment implémenter :</h3>
        <ol className="text-sm text-primary-700 space-y-1">
          <li>1. Configurer un service d'email (SendGrid, Mailgun, etc.)</li>
          <li>2. Déclencher l'envoi lors de l'envoi d'un message par l'agent</li>
          <li>3. Inclure le lien direct vers l'interface chat</li>
          <li>4. Personnaliser selon l'utilisateur et le message</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailNotificationTemplate;
























=======
﻿import React from 'react';

// Composant pour générer le contenu d'email de notification
const EmailNotificationTemplate = () => {
  const generateEmailContent = (userName: string, agentName: string, entrepriseName: string, messagePreview: string) => {
    const chatUrl = `${window.location.origin}/chat?user=075e96d0-651c-40e7-a44a-04341daaac56`;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Nouveau message de votre agent</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message-preview { background: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 15px 0; }
        .cta-button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 Nouveau Message</h1>
            <p>Vous avez reçu un message de votre agent</p>
        </div>
        
        <div class="content">
            <h2>Bonjour ${userName},</h2>
            
            <p>Votre agent <strong>${agentName}</strong> vous a envoyé un nouveau message concernant votre entreprise <strong>${entrepriseName}</strong>.</p>
            
            <div class="message-preview">
                <h3>Aperçu du message :</h3>
                <p><em>"${messagePreview}"</em></p>
            </div>
            
            <p>Pour lire le message complet et répondre à votre agent, cliquez sur le bouton ci-dessous :</p>
            
            <a href="${chatUrl}" class="cta-button">📱 Ouvrir mes messages</a>
            
            <p>Vous pouvez également copier ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">${chatUrl}</p>
            
            <hr style="margin: 30px 0;">
            
            <h3>🔔 Fonctionnalités disponibles :</h3>
            <ul>
                <li>✅ Voir tous vos messages</li>
                <li>✅ Répondre directement à votre agent</li>
                <li>✅ Suivre l'avancement de vos dossiers</li>
                <li>✅ Historique complet des conversations</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>Cet email a été envoyé automatiquement par le système InvestMali.</p>
            <p>Si vous avez des questions, contactez notre support.</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  // Exemple d'utilisation
  const exampleEmail = generateEmailContent(
    "Abdoul Doukhanse",
    "Agent Test",
    "Dymo",
    "Bonjour, nous avons bien reçu votre demande de création d'entreprise..."
  );

  return (
    <div className="p-6 bg-gray-50">
      <h2 className="text-2xl font-bold mb-4">📧 Template Email de Notification</h2>
      
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-semibold mb-2">Aperçu de l'email :</h3>
        <div 
          className="border rounded p-4 max-h-96 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: exampleEmail }}
        />
      </div>
      
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h3 className="font-semibold text-primary-800 mb-2">💡 Comment implémenter :</h3>
        <ol className="text-sm text-primary-700 space-y-1">
          <li>1. Configurer un service d'email (SendGrid, Mailgun, etc.)</li>
          <li>2. Déclencher l'envoi lors de l'envoi d'un message par l'agent</li>
          <li>3. Inclure le lien direct vers l'interface chat</li>
          <li>4. Personnaliser selon l'utilisateur et le message</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailNotificationTemplate;
























>>>>>>> 060c2b6fa (WIP: local changes before rebase)
