import React, { useState } from 'react';
import Button from '../components/common/Button';

interface StyleAdjustmentScreenProps {
  userId: string;
}

const StyleAdjustmentScreen: React.FC<StyleAdjustmentScreenProps> = ({ userId }) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const handleOptionSelect = async (category: string, questionId: string, option: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [`${category}_${questionId}`]: option
    }));
  };

  const handleSubmit = async () => {
    // Lógica para enviar as preferências de estilo
    console.log('Selected options:', selectedOptions);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Style Preferences</h1>
      
      {/* Exemplo de perguntas - substitua com suas perguntas reais */}
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Color Preferences</h2>
        <div className="space-y-2">
          {['Warm', 'Cool', 'Neutral'].map(option => (
            <Button
              key={option}
              onClick={() => handleOptionSelect('color', 'main', option)}
              variant={selectedOptions['color_main'] === option ? 'primary' : 'secondary'}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <Button onClick={handleSubmit} className="mt-4">
        Save Preferences
      </Button>
    </div>
  );
};

export default StyleAdjustmentScreen;
