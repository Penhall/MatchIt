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
    try {
      // Converter selectedOptions para o formato esperado pelo backend
      const preferences = Object.entries(selectedOptions).map(([key, value]) => {
        const [category, questionId] = key.split('_');
        return {
          category,
          questionId,
          selectedOption: value
        };
      });

      // Enviar cada preferência para o backend
      for (const pref of preferences) {
        await fetch('/api/style-adjustment/style-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pref)
        });
      }
      
      alert('Preferências salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      alert('Erro ao salvar preferências');
    }
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
