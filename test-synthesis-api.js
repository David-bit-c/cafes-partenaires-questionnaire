// Script de test pour diagnostiquer le problème de synthèse IA
// À exécuter dans la console du navigateur sur la page résultats

async function testSynthesisAPI() {
  console.log('🧪 Test de l\'API de synthèse...\n');
  
  try {
    const response = await fetch('/api/summary?ai_model=auto');
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
    console.error('❌ Erreur lors de l\'appel:', error);
  }
}

testSynthesisAPI();

