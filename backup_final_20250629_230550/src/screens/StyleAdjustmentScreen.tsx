// screens/StyleAdjustmentScreen.tsx - Versão web compatible
import React, { useState, useEffect } from 'react';
import Button from '../components/common/Button';
import { ProfileService } from '../services/profileService';

interface StyleAdjustmentScreenProps {
  userId?: string;
}

const StyleAdjustmentScreen: React.FC<StyleAdjustmentScreenProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const profileService = new ProfileService();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      const prefs = await profileService.getStylePreferences();
      setPreferences(prefs);
    } catch (err) {
      setError('Erro ao carregar preferências');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      await profileService.updateStylePreferences(preferences);
      alert('Preferências salvas com sucesso!');
    } catch (err) {
      setError('Erro ao salvar preferências');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>
        Ajuste de Estilo
      </h1>

      {error && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#d00',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '15px', color: '#666' }}>
          Preferências de Estilo
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Estilo Preferido:
          </label>
          <select 
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            value={preferences.style || 'casual'}
            onChange={(e) => setPreferences({...preferences, style: e.target.value})}
          >
            <option value="casual">Casual</option>
            <option value="formal">Formal</option>
            <option value="esportivo">Esportivo</option>
            <option value="elegante">Elegante</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cores Preferidas:
          </label>
          <select 
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            value={preferences.colors || 'neutras'}
            onChange={(e) => setPreferences({...preferences, colors: e.target.value})}
          >
            <option value="neutras">Cores Neutras</option>
            <option value="vibrantes">Cores Vibrantes</option>
            <option value="escuras">Cores Escuras</option>
            <option value="claras">Cores Claras</option>
          </select>
        </div>

        <Button
          title={loading ? "Salvando..." : "Salvar Preferências"}
          onPress={savePreferences}
          disabled={loading}
          variant="primary"
        />
      </div>
    </div>
  );
};

export default StyleAdjustmentScreen;
