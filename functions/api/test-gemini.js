// Test endpoint spécifique pour Gemini
export async function onRequestGet(context) {
  try {
    const { env } = context;
    const geminiKey = env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      return new Response(JSON.stringify({
        error: "Clé Gemini non configurée",
        status: "missing_key"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log("🔑 Clé Gemini trouvée:", geminiKey ? "✅ Oui" : "❌ Non");
    
    // Test simple avec un prompt court
    const testPrompt = "Réponds simplement 'Test réussi' en français.";
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: testPrompt
            }]
          }]
        })
      }
    );
    
    console.log("📡 Réponse Gemini:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Erreur Gemini:", errorText);
      return new Response(JSON.stringify({
        error: `Erreur Gemini: ${response.status}`,
        details: errorText,
        status: "gemini_error"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "Pas de réponse";
    
    console.log("✅ Gemini réussi:", result);
    
    return new Response(JSON.stringify({
      success: true,
      result: result,
      status: "gemini_working",
      model: "gemini-1.5-flash"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("💥 Erreur test Gemini:", error);
    return new Response(JSON.stringify({
      error: error.message,
      status: "test_error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
