// Cloudflare Pages Function pour analyse par institution
// Données pré-calculées par institution avec pourcentages
// Version améliorée avec classification LLM + cache

import { fetchWebsiteContent, extractMainDomain, isSuspiciousDomain } from './website-analyzer.js';
import { classifyWithLLM, getStaticClassification } from './llm-classifier.js';

export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    
    // Récupération des soumissions
    const submissionsStmt = env.DB.prepare(
      "SELECT * FROM submissions ORDER BY created_at DESC"
    );
    const submissionsResult = await submissionsStmt.all();
    
    if (!submissionsResult.success) {
      throw new Error("Échec de la récupération des soumissions");
    }

    const submissions = submissionsResult.results;
    
    // Classification hybride des institutions (LLM + Cache + Règles statiques)
    async function classifyInstitution(email) {
      if (!email || typeof email !== 'string') return 'Autres';
      
      const domain = extractMainDomain(email);
      if (!domain) return 'Autres';
      
      try {
        // 1. Vérifier le cache
        const cached = await env.DB.prepare(
          "SELECT institution_type FROM institution_classifications WHERE domain = ?"
        ).bind(domain).first();
        
        if (cached) {
          console.log(`📋 Cache hit pour ${domain}: ${cached.institution_type}`);
          return cached.institution_type;
        }
        
        // 2. Règles statiques pour domaines connus
        const staticClassification = getStaticClassification(domain);
        if (staticClassification) {
          console.log(`📝 Règle statique pour ${domain}: ${staticClassification}`);
          await cacheClassification(domain, staticClassification, 1.0, env);
          return staticClassification;
        }
        
        // 3. LLM seulement si domaine suspect OU >1 soumission
        const submissionCount = await getSubmissionCount(domain, env);
        if (submissionCount > 1 || isSuspiciousDomain(domain)) {
          console.log(`🤖 Classification LLM pour ${domain} (${submissionCount} soumissions)`);
          const websiteContent = await fetchWebsiteContent(domain);
          const classification = await classifyWithLLM(domain, websiteContent, env);
          
          await cacheClassification(
            domain, 
            classification.institution_type, 
            classification.confidence, 
            env,
            websiteContent
          );
          
          return classification.institution_type;
        }
        
        // 4. Fallback: Autres
        await cacheClassification(domain, 'Autres', 0.5, env);
        return 'Autres';
        
      } catch (error) {
        console.error(`❌ Erreur classification ${domain}:`, error);
        return 'Autres';
      }
    }
    
    // Fonctions utilitaires pour le cache
    async function cacheClassification(domain, institutionType, confidence, env, websiteContent = '') {
      try {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO institution_classifications 
          (domain, institution_type, confidence_score, classification_date, website_content, submission_count, last_updated)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `).bind(
          domain,
          institutionType,
          confidence,
          new Date().toISOString(),
          websiteContent,
          new Date().toISOString()
        ).run();
      } catch (error) {
        console.error(`Erreur cache classification ${domain}:`, error);
      }
    }
    
    async function getSubmissionCount(domain, env) {
      try {
        const result = await env.DB.prepare(`
          SELECT COUNT(*) as count FROM submissions 
          WHERE data LIKE ?
        `).bind(`%${domain}%`).first();
        return result?.count || 0;
      } catch (error) {
        console.error(`Erreur count soumissions ${domain}:`, error);
        return 0;
      }
    }

    // Traitement des données par institution
    const institutionData = {};
    const totalSubmissions = submissions.length;
    
    // Traitement asynchrone des soumissions
    for (const submission of submissions) {
      try {
        const data = JSON.parse(submission.data);
        const email = data.email;
        const institution = await classifyInstitution(email);
        
        if (!institutionData[institution]) {
          institutionData[institution] = {
            name: institution,
            totalResponses: 0,
            challenges: {},
            ruptureFactors: {
              favorable: {},
              negative: {}
            },
            challengesRanking: {},
            submissions: []
          };
        }
        
        institutionData[institution].totalResponses++;
        institutionData[institution].submissions.push(submission);
        
        // Défis observés
        if (data.observedChallenges && Array.isArray(data.observedChallenges)) {
          data.observedChallenges.forEach(challenge => {
            institutionData[institution].challenges[challenge] = 
              (institutionData[institution].challenges[challenge] || 0) + 1;
          });
        }
        
        // Facteurs de rupture favorables
        if (data.ruptureFactorsFavorable && Array.isArray(data.ruptureFactorsFavorable)) {
          data.ruptureFactorsFavorable.forEach(factor => {
            institutionData[institution].ruptureFactors.favorable[factor] = 
              (institutionData[institution].ruptureFactors.favorable[factor] || 0) + 1;
          });
        }
        
        // Facteurs de rupture négatifs
        if (data.ruptureFactorsNegative && Array.isArray(data.ruptureFactorsNegative)) {
          data.ruptureFactorsNegative.forEach(factor => {
            institutionData[institution].ruptureFactors.negative[factor] = 
              (institutionData[institution].ruptureFactors.negative[factor] || 0) + 1;
          });
        }
        
        // Classement des défis
        if (data.challengesRanking && typeof data.challengesRanking === 'object') {
          Object.entries(data.challengesRanking).forEach(([challenge, ranking]) => {
            if (!institutionData[institution].challengesRanking[challenge]) {
              institutionData[institution].challengesRanking[challenge] = [];
            }
            institutionData[institution].challengesRanking[challenge].push(parseInt(ranking) || 0);
          });
        }
        
      } catch (error) {
        console.error(`Erreur parsing soumission ${submission.id}:`, error);
      }
    }

    // Calcul des pourcentages et moyennes
    const processedData = {};
    
    for (const [institution, data] of Object.entries(institutionData)) {
      const total = data.totalResponses;
      
      // Défis observés avec pourcentages
      const challengesWithPercentages = {};
      Object.entries(data.challenges).forEach(([challenge, count]) => {
        challengesWithPercentages[challenge] = {
          count: count,
          percentage: Math.round((count / total) * 100)
        };
      });
      
      // Facteurs favorables avec pourcentages
      const favorableWithPercentages = {};
      Object.entries(data.ruptureFactors.favorable).forEach(([factor, count]) => {
        favorableWithPercentages[factor] = {
          count: count,
          percentage: Math.round((count / total) * 100)
        };
      });
      
      // Facteurs négatifs avec pourcentages
      const negativeWithPercentages = {};
      Object.entries(data.ruptureFactors.negative).forEach(([factor, count]) => {
        negativeWithPercentages[factor] = {
          count: count,
          percentage: Math.round((count / total) * 100)
        };
      });
      
      // Moyennes des classements
      const rankingAverages = {};
      Object.entries(data.challengesRanking).forEach(([challenge, rankings]) => {
        const average = rankings.reduce((sum, rank) => sum + rank, 0) / rankings.length;
        rankingAverages[challenge] = Math.round(average * 10) / 10; // 1 décimale
      });
      
      processedData[institution] = {
        name: institution,
        totalResponses: total,
        percentageOfTotal: Math.round((total / totalSubmissions) * 100),
        challenges: challengesWithPercentages,
        ruptureFactors: {
          favorable: favorableWithPercentages,
          negative: negativeWithPercentages
        },
        challengesRanking: rankingAverages,
        topChallenges: Object.entries(challengesWithPercentages)
          .sort(([,a], [,b]) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(([challenge, data]) => ({ challenge, ...data })),
        topFavorableFactors: Object.entries(favorableWithPercentages)
          .sort(([,a], [,b]) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(([factor, data]) => ({ factor, ...data })),
        topNegativeFactors: Object.entries(negativeWithPercentages)
          .sort(([,a], [,b]) => b.percentage - a.percentage)
          .slice(0, 3)
          .map(([factor, data]) => ({ factor, ...data }))
      };
    }

    // Tri par nombre de réponses (décroissant)
    const sortedInstitutions = Object.values(processedData)
      .sort((a, b) => b.totalResponses - a.totalResponses);

    console.log(`✅ Analyse par institution: ${sortedInstitutions.length} institutions, ${totalSubmissions} soumissions`);

    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      totalSubmissions: totalSubmissions,
      institutions: sortedInstitutions,
      summary: {
        totalInstitutions: sortedInstitutions.length,
        institutionsWithData: sortedInstitutions.filter(inst => inst.totalResponses > 0).length,
        averageResponsesPerInstitution: Math.round(totalSubmissions / sortedInstitutions.length * 10) / 10
      }
    }, null, 2), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600" // Cache 1 heure
      }
    });

  } catch (error) {
    console.error("Erreur analyse par institution:", error);
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
