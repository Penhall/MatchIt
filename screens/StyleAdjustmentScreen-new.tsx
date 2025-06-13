import React, { useState } from 'react';
import Button from '../components/common/Button';

const StyleAdjustmentScreenNew = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Exemplo de perguntas - substitua com suas perguntas reais
  const questions = [
    {
      id: '1',
      text: 'Which color palette do you prefer?',
      options: ['Warm tones', 'Cool tones', 'Neutral tones']
    },
    {
      id: '2', 
      text: 'Which style do you identify with most?',
      options: ['Classic', 'Modern', 'Bohemian', 'Minimalist']
    }
  ];

  const handleOptionSelect = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestionIndex].id]: option
    }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Style Quiz</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">{currentQuestion.text}</h2>
        <div className="space-y-2">
          {currentQuestion.options.map(option => (
            <Button
              key={option}
              onClick={() => handleOptionSelect(option)}
              variant={answers[currentQuestion.id] === option ? 'primary' : 'secondary'}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        {currentQuestionIndex > 0 && (
          <Button onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>
            Previous
          </Button>
        )}
        
        {currentQuestionIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="primary">
            Submit Answers
          </Button>
        )}
      </div>
    </div>
  );
};

export default StyleAdjustmentScreenNew;
