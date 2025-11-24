/**
 * Composant ChallengesBarChart
 * Affiche un graphique en barres des défis identifiés
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AggregatedItem } from '../../utils/dashboardAdapter';

interface ChallengesBarChartProps {
  data: AggregatedItem[];
  title?: string;
}

const ChallengesBarChart: React.FC<ChallengesBarChartProps> = ({ 
  data, 
  title = "Défis Identifiés" 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={100}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'count') return [value, 'Mentions'];
              if (name === 'percentage') return [`${value}%`, 'Pourcentage'];
              return value;
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Mentions" />
          <Bar dataKey="percentage" fill="#10b981" name="Pourcentage (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChallengesBarChart;

