// src/components/Confirmation.tsx
import React from 'react';

const Confirmation: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-white/70 backdrop-blur-lg p-10 rounded-2xl shadow-lg border border-gray-200/50 transform transition-all duration-500 hover:scale-105">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Merci pour votre participation !
        </h2>
        <p className="text-gray-600 mb-8">
          Votre contribution est précieuse pour nous aider à mieux comprendre les défis et à améliorer l'accompagnement des jeunes.
        </p>
        <button
          onClick={onReset}
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
        >
          Soumettre une autre réponse
        </button>
      </div>
    </div>
  );
};

export default Confirmation;
