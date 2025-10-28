// Cloudflare Pages Function pour diagnostiquer le problème de synthèse IA
// Accès via: https://cafes-partenaires-questionnaire.pages.dev/api/test-summary-diagnosis

export async function onRequestGet(context) {
  try {
    const { env } = context;
    
    // Vérification des clés API
    const geminiKey = env.GEMINI_API_KEY;
    const openaiKey = env.OPENAI_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY;
    
    const diagnosis = {
      timestamp: new Date().toISOString(),
      apiKeysStatus: {
        gemini: geminiKey ? `✅ Configurée (longueur: ${geminiKey.length})` : "❌ Manquante",
        openai: openaiKey ? `✅ Configurée (longueur: ${openaiKey.length})` : "❌ Manquante",
        claude: claudeKey ? `✅ Configurée (longueur: ${claudeKey.length})` : "❌ Manquante"
      },
      testResults: []
    };
    
    // Test 1: Gemini
    if (geminiKey) {
      try {
        console.log("🧪 Test Gemini...");
        const geminiTest = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Test" }] }]
            })
          }
        );
        
        if (geminiTest.ok) {
          diagnosis.testResults.push({ model: "Gemini", status: "✅ Fonctionne" });
        } else {
          const errorText = await geminiTest.text();
          diagnosis.testResults.push({ model: "Gemini", status: `❌ Erreur ${geminiTest.status}: ${errorText.substring(0, 100)}` });
        }
      } catch (error) {
        diagnosis.testResults.push({ model: "Gemini", status: `❌ Exception: ${error.message}` });
      }
    }
    
    // Test 2: Claude
    if (claudeKey) {
      try {
        console.log("🧪 Test Claude...");
        const claudeTest = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': claudeKey,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: "claude-3-5-sonnet-20241022",
              max_tokens: 10,
              messages: [{ role: "user", content: "Test" }]
            })
          }
        );
        
        if (claudeTest.ok) {
          diagnosis.testResults.push({ model: "Claude", status: "✅ Fonctionne" });
        } else {
          const errorText = await claudeTest.text();
          diagnosis.testResults.push({ model: "Claude", status: `❌ Erreur ${claudeTest.status}: ${errorText.substring(0, 100)}` });
        }
      } catch (error) {
        diagnosis.testResults.push({ model: "Claude", status: `❌ Exception: ${error.message}` });
      }
    }
    
    // Test 3: OpenAI
    if (openaiKey) {
      try {
        console.log("🧪 Test OpenAI...");
        const openaiTest = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 10
            })
          }
        );
        
        if (openaiTest.ok) {
          diagnosis.testResults.push({ model: "OpenAI", status: "✅ Fonctionne" });
        } else {
          const errorText = await openaiTest.text();
          diagnosis.testResults.push({ model: "OpenAI", status: `❌ Erreur ${openaiTest.status}: ${errorText.substring(0, 100)}` });
        }
      } catch (error) {
        diagnosis.testResults.push({ model: "OpenAI", status: `❌ Exception: ${error.message}` });
      }
    }
    
    return new Response(JSON.stringify(diagnosis, null, 2), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

