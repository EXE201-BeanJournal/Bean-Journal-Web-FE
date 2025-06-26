import React from 'react';
import { Info } from 'lucide-react';

interface Feature {
    name: string;
    description: string;
}

interface FeatureDisplayProps {
  data: Feature[];
}

const FeatureDisplay: React.FC<FeatureDisplayProps> = ({ data }) => {
  return (
    <div className="bg-blue-50 rounded-lg p-4 mt-2">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Info className="w-5 h-5 text-blue-600" />
        Bean Journal Features
      </h3>
      <div className="mt-3 space-y-3">
        {data.map((feature, index) => (
          <div key={index} className="bg-white p-3 rounded shadow-sm">
            <p className="font-medium">{feature.name}</p>
            <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureDisplay;