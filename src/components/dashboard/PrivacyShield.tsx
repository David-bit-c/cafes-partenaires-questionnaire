/**
 * Composant PrivacyShield
 * Affiche un message lorsque les données sont insuffisantes pour garantir l'anonymat
 */

import React from 'react';
import { Shield } from 'lucide-react';

interface PrivacyShieldProps {
  message?: string;
  threshold?: number;
}

const PrivacyShield: React.FC<PrivacyShieldProps> = ({ 
  message, 
  threshold = 3 
}) => {
  const defaultMessage = `Pour protéger la confidentialité des répondants, les résultats détaillés ne sont affichés qu'à partir de ${threshold} réponses minimum.`;

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Confidentialité protégée
        </h3>
        <p className="text-gray-600">
          {message || defaultMessage}
        </p>
      </div>
    </div>
  );
};

export default PrivacyShield;

