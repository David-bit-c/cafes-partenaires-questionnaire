// Script de test pour la classification LLM
// functions/api/test-classification.js

import { fetchWebsiteContent, extractMainDomain } from './website-analyzer.js';
import { classifyWithLLM, getStaticClassification } from './llm-classifier.js';

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');
    
    if (!domain) {
      return new Response(JSON.stringify({
        error: "Paramètre 'domain' requis",
        example: "/api/test-classification?domain=fase.ch"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    console.log(`🧪 Test classification pour: ${domain}`);
    
    const results = {
      domain: domain,
      extractedDomain: extractMainDomain(`test@${domain}`),
      timestamp: new Date().toISOString(),
      tests: {}
    };
    
    // Test 1: Règles statiques
    try {
      const staticResult = getStaticClassification(domain);
      results.tests.static = {
        success: true,
        result: staticResult,
        message: staticResult ? `Classification statique: ${staticResult}` : "Pas de règle statique"
      };
    } catch (error) {
      results.tests.static = {
        success: false,
        error: error.message
      };
    }
    
    // Test 2: Récupération contenu web
    try {
      const websiteContent = await fetchWebsiteContent(domain);
      results.tests.websiteContent = {
        success: true,
        contentLength: websiteContent.length,
        preview: websiteContent.substring(0, 200) + "...",
        message: `Contenu récupéré: ${websiteContent.length} caractères`
      };
    } catch (error) {
      results.tests.websiteContent = {
        success: false,
        error: error.message
      };
    }
    
    // Test 3: Classification LLM
    try {
      const websiteContent = await fetchWebsiteContent(domain);
      const llmResult = await classifyWithLLM(domain, websiteContent, env);
      results.tests.llm = {
        success: true,
        result: llmResult,
        message: `Classification LLM: ${llmResult.institution_type} (confiance: ${llmResult.confidence})`
      };
    } catch (error) {
      results.tests.llm = {
        success: false,
        error: error.message
      };
    }
    
    // Test 4: Cache (si existe)
    try {
      const cached = await env.DB.prepare(
        "SELECT * FROM institution_classifications WHERE domain = ?"
      ).bind(domain).first();
      
      results.tests.cache = {
        success: true,
        exists: !!cached,
        result: cached,
        message: cached ? `Cache existant: ${cached.institution_type}` : "Pas de cache"
      };
    } catch (error) {
      results.tests.cache = {
        success: false,
        error: error.message
      };
    }
    
    console.log(`✅ Test terminé pour ${domain}`);
    
    return new Response(JSON.stringify(results, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    console.error("❌ Erreur test:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
