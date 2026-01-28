/**
 * Utilitaires pour GSAP - Éviter les erreurs "target not found"
 */

/**
 * Vérifie si l'environnement est prêt pour les animations GSAP
 */
export const isGSAPReady = (): boolean => {
  return typeof window !== 'undefined' && 
         document.body !== null && 
         document.readyState === 'complete';
};

/**
 * Vérifie si un élément existe et peut être animé
 */
export const isElementReady = (element: any): boolean => {
  return element !== null && 
         element !== undefined && 
         element instanceof Element;
};

/**
 * Vérifie si une collection d'éléments existe et n'est pas vide
 */
export const areChildrenReady = (parent: any): boolean => {
  return parent !== null && 
         parent !== undefined && 
         parent.children && 
         parent.children.length > 0;
};

/**
 * Wrapper sécurisé pour les animations GSAP
 */
export const safeGSAPAnimation = (
  animationFn: () => void,
  dependencies: any[] = []
): void => {
  // Vérifier que tous les éléments requis existent
  const allDependenciesReady = dependencies.every(dep => {
    if (dep && dep.current) {
      return isElementReady(dep.current);
    }
    return dep !== null && dep !== undefined;
  });

  if (isGSAPReady() && allDependenciesReady) {
    try {
      animationFn();
    } catch (error) {
      console.warn('⚠️ GSAP Animation Error:', error);
    }
  }
};
