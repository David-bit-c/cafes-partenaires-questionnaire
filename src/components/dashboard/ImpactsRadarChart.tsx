/**
 * Composant ImpactsRadarChart
 * Affiche un graphique radar des facteurs favorables et négatifs
 */

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AggregatedItem } from '../../utils/dashboardAdapter';

interface ImpactsRadarChartProps {
  data: AggregatedItem[];
  title?: string;
}

const ImpactsRadarChart: React.FC<ImpactsRadarChartProps> = ({ 
  data, 
  title = "Facteurs de Rupture et de Maintien" 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // Limiter à 8 items max pour la lisibilité du radar
  const limitedData = data.slice(0, 8);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={limitedData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
          <Radar 
            name="Mentions" 
            dataKey="count" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            fillOpacity={0.6} 
          />
          <Tooltip 
            formatter={(value: number) => [`${value} mentions`, 'Count']}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ImpactsRadarChart;

