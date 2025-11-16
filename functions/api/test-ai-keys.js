// API de diagnostic pour tester les clés IA
export async function onRequestGet(context) {
  const { env } = context;
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };
  
  // Test OpenAI
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-5-2025-08-07",
          messages: [{ role: "user", content: "Bonjour, réponds simplement 'OK'" }],
          max_completion_tokens: 10
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        results.tests.push({
          api: 'OpenAI',
          model: 'gpt-5-2025-08-07',
          status: '✅ Fonctionne',
          response: data.choices?.[0]?.message?.content
        });
      } else {
        results.tests.push({
          api: 'OpenAI',
          model: 'gpt-5-2025-08-07',
          status: '❌ Erreur',
          error: data.error?.message || JSON.stringify(data),
          statusCode: response.status
        });
      }
    } catch (error) {
      results.tests.push({
        api: 'OpenAI',
        status: '❌ Exception',
        error: error.message
      });
    }
  } else {
    results.tests.push({
      api: 'OpenAI',
      status: '⚠️ Clé manquante'
    });
  }
  
  // Test Claude
  const claudeKey = env.CLAUDE_API_KEY;
  if (claudeKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "Bonjour, réponds simplement 'OK'" }]
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        results.tests.push({
          api: 'Claude',
          model: 'claude-3-5-sonnet-20241022',
          status: '✅ Fonctionne',
          response: data.content?.[0]?.text
        });
      } else {
        results.tests.push({
          api: 'Claude',
          model: 'claude-3-5-sonnet-20241022',
          status: '❌ Erreur',
          error: data.error?.message || JSON.stringify(data),
          statusCode: response.status
        });
      }
    } catch (error) {
      results.tests.push({
        api: 'Claude',
        status: '❌ Exception',
        error: error.message
      });
    }
  } else {
    results.tests.push({
      api: 'Claude',
      status: '⚠️ Clé manquante'
    });
  }
  
  // Test Gemini
  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Bonjour, réponds simplement 'OK'" }] }]
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        results.tests.push({
          api: 'Gemini',
          model: 'gemini-2.5-flash',
          status: '✅ Fonctionne',
          response: data.candidates?.[0]?.content?.parts?.[0]?.text
        });
      } else {
        results.tests.push({
          api: 'Gemini',
          model: 'gemini-2.5-flash',
          status: '❌ Erreur',
          error: data.error?.message || JSON.stringify(data),
          statusCode: response.status
        });
      }
    } catch (error) {
      results.tests.push({
        api: 'Gemini',
        status: '❌ Exception',
        error: error.message
      });
    }
  } else {
    results.tests.push({
      api: 'Gemini',
      status: '⚠️ Clé manquante'
    });
  }
  
  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

