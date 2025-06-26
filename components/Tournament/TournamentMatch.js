// components/Tournament/TournamentMatch.js - Componente de match 2x2
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';

const { width } = Dimensions.get('window');
const imageSize = (width - 60) / 2; // 20px padding + 20px gap

const TournamentMatch = ({ 
  match, 
  onChoice, 
  roundNumber, 
  totalRounds,
  loading 
}) => {
  const [choiceStartTime, setChoiceStartTime] = useState(null);
  const [imageLoading, setImageLoading] = useState({ image1: true, image2: true });

  useEffect(() => {
    setChoiceStartTime(Date.now());
  }, [match]);

  const handleChoice = (winnerImage, loserImage) => {
    if (loading) return;
    
    const choiceTime = Date.now() - choiceStartTime;
    
    Alert.alert(
      'Confirmar Escolha',
      `Você escolheu: "${winnerImage.image_name}"\n\nTem certeza?`,
      [
        { text: 'Voltar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => onChoice(winnerImage.id, loserImage.id, choiceTime)
        }
      ]
    );
  };

  const handleImageLoad = (imageKey) => {
    setImageLoading(prev => ({
      ...prev,
      [imageKey]: false
    }));
  };

  if (!match || !match.image1 || !match.image2) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar match</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.roundText}>
          Rodada {roundNumber} de {totalRounds}
        </Text>
        <Text style={styles.instructionText}>
          Toque na imagem que você prefere
        </Text>
      </View>

      <View style={styles.vsContainer}>
        <Text style={styles.vsText}>VS</Text>
      </View>

      <View style={styles.matchContainer}>
        {/* Imagem 1 */}
        <TouchableOpacity
          style={[styles.imageContainer, loading && styles.imageDisabled]}
          onPress={() => handleChoice(match.image1, match.image2)}
          disabled={loading}
        >
          {imageLoading.image1 && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}
          <Image
            source={{ uri: match.image1.image_url }}
            style={styles.image}
            onLoad={() => handleImageLoad('image1')}
            onError={() => handleImageLoad('image1')}
          />
          <View style={styles.imageLabel}>
            <Text style={styles.imageName} numberOfLines={2}>
              {match.image1.image_name}
            </Text>
            {match.image1.tags && (
              <Text style={styles.imageTags} numberOfLines={1}>
                {match.image1.tags.join(' • ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separator} />

        {/* Imagem 2 */}
        <TouchableOpacity
          style={[styles.imageContainer, loading && styles.imageDisabled]}
          onPress={() => handleChoice(match.image2, match.image1)}
          disabled={loading}
        >
          {imageLoading.image2 && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3498db" />
            </View>
          )}
          <Image
            source={{ uri: match.image2.image_url }}
            style={styles.image}
            onLoad={() => handleImageLoad('image2')}
            onError={() => handleImageLoad('image2')}
          />
          <View style={styles.imageLabel}>
            <Text style={styles.imageName} numberOfLines={2}>
              {match.image2.image_name}
            </Text>
            {match.image2.tags && (
              <Text style={styles.imageTags} numberOfLines={1}>
                {match.image2.tags.join(' • ')}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Processando escolha...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa'
  },
  header: {
    alignItems: 'center',
    marginBottom: 30
  },
  roundText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5
  },
  instructionText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  vsContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  vsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  matchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  imageContainer: {
    width: imageSize,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden'
  },
  imageDisabled: {
    opacity: 0.6
  },
  image: {
    width: '100%',
    height: imageSize,
    backgroundColor: '#ecf0f1'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  imageLabel: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1'
  },
  imageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5
  },
  imageTags: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center'
  },
  separator: {
    width: 20
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    textAlign: 'center'
  }
});

export default TournamentMatch;
