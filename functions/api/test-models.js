// Test endpoint pour lister les modèles Gemini disponibles
export async function onRequestGet(context) {
  try {
    const { env } = context;
    const geminiKey = env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      return new Response(JSON.stringify({
        error: "Clé Gemini non configurée"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Appel à l'API pour lister les modèles
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({
        error: `Erreur API: ${response.status}`,
        details: errorText
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const data = await response.json();
    
    // Filtrer les modèles Gemini disponibles
    const geminiModels = data.models?.filter(model => 
      model.name.includes('gemini') && 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    return new Response(JSON.stringify({
      totalModels: data.models?.length || 0,
      geminiModels: geminiModels.map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      }))
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
