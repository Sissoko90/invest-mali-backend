# Dossier Images

Ce dossier contient toutes les images utilisées sur le site InvestMali.

## Structure recommandée :

### Photos d'équipe
- `director.jpg` - Photo du directeur (Abdoul TRAORE)
- `team/` - Photos des membres de l'équipe

### Images de contenu
- `hero/` - Images pour la section hero
- `services/` - Illustrations pour les services
- `about/` - Images pour la page à propos

### Logos et icônes
- `logo/` - Différentes versions du logo
- `icons/` - Icônes personnalisées

## Instructions pour la photo du directeur :

1. **Nom du fichier** : `director.jpg` ou `director.png`
2. **Dimensions recommandées** : 400x400px minimum
3. **Format** : JPG ou PNG
4. **Qualité** : Haute résolution pour un rendu professionnel
5. **Style** : Photo professionnelle, fond neutre de préférence

## Utilisation :

Pour remplacer le placeholder de la photo du directeur, placez l'image dans ce dossier et mettez à jour le composant AboutPage.tsx :

```tsx
// Remplacer cette ligne dans AboutPage.tsx :
<div className="w-64 h-64 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
  <span className="text-white font-bold text-6xl">AT</span>
</div>

// Par :
<img 
  src="/images/director.jpg" 
  alt="Abdoul TRAORE - Directeur Général"
  className="w-64 h-64 object-cover rounded-2xl shadow-xl"
/>
```
