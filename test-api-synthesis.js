// Script de test pour l'API de synthèse
// À exécuter avec: node test-api-synthesis.js

const testSynthesisAPI = async () => {
  console.log('🧪 Test de l\'API de synthèse...\n');
  
  try {
    const response = await fetch('https://cafes-partenaires-questionnaire.pages.dev/api/summary?ai_model=auto');
    const data = await response.json();
    
    console.log('📊 Résultat de l\'appel API:');
    console.log('Status:', response.status);
    console.log('Summary:', data.summary ? data.summary.substring(0, 100) + '...' : 'Vide');
    console.log('Error:', data.summaryError || 'Aucune erreur');
    console.log('Model:', data.usedModel || 'Non utilisé');
    
    if (data.summaryError) {
      console.error('❌ ERREUR DÉTECTÉE:', data.summaryError);
    } else if (data.summary) {
      console.log('✅ Synthèse générée avec succès');
    } else {
      console.warn('⚠️ Aucune synthèse, aucune erreur...');
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel:', error.message);
  }
};

testSynthesisAPI();

