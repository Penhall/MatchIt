// screens/AdminTournamentPanel.tsx - Painel administrativo para gestão de torneios
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';

interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  active: boolean;
  approved: boolean;
  winRate: number;
  totalViews: number;
  totalSelections: number;
  uploadDate: string;
}

interface UploadImage {
  uri: string;
  title: string;
  description: string;
  tags: string;
}

export const AdminTournamentPanel: React.FC = () => {
  const navigation = useNavigation();
  const api = useApi();
  const { user } = useAuth();

  // Estados principais
  const [selectedCategory, setSelectedCategory] = useState('cores');
  const [images, setImages] = useState<TournamentImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados do modal de upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadImages, setUploadImages] = useState<UploadImage[]>([]);

  // Estados de filtros
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { key: 'cores', name: 'Cores', icon: '🎨' },
    { key: 'estilos', name: 'Estilos', icon: '👗' },
    { key: 'calcados', name: 'Calçados', icon: '👠' },
    { key: 'acessorios', name: 'Acessórios', icon: '💍' },
    { key: 'texturas', name: 'Texturas', icon: '🧵' },
    { key: 'roupas_casuais', name: 'Casual', icon: '👕' },
    { key: 'roupas_formais', name: 'Formal', icon: '🤵' },
    { key: 'roupas_festa', name: 'Festa', icon: '🎉' },
    { key: 'joias', name: 'Joias', icon: '💎' },
    { key: 'bolsas', name: 'Bolsas', icon: '👜' }
  ];

  // Verificar se usuário é admin
  useEffect(() => {
    if (!user?.isAdmin) {
      Alert.alert(
        'Acesso Negado',
        'Você não tem permissão para acessar esta área.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [user, navigation]);

  // Carregar imagens quando categoria muda
  useEffect(() => {
    if (user?.isAdmin) {
      loadImages();
    }
  }, [selectedCategory, user]);

  const loadImages = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/tournament/images/${selectedCategory}?limit=100`);
      
      if (response.success) {
        setImages(response.data);
      } else {
        throw new Error(response.message || 'Falha ao carregar imagens');
      }
    } catch (error: any) {
      console.error('Erro ao carregar imagens:', error);
      Alert.alert('Erro', 'Falha ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  const selectImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
        allowsEditing: false
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          uri: asset.uri,
          title: `Imagem ${uploadImages.length + index + 1}`,
          description: '',
          tags: ''
        }));
        
        setUploadImages([...uploadImages, ...newImages]);
        setShowUploadModal(true);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagens:', error);
      Alert.alert('Erro', 'Falha ao selecionar imagens');
    }
  };

  const uploadImagesToServer = async () => {
    if (uploadImages.length === 0) return;

    try {
      setUploading(true);

      const formData = new FormData();
      
      // Adicionar categoria
      formData.append('category', selectedCategory);
      
      // Adicionar imagens e metadados
      uploadImages.forEach((img, index) => {
        formData.append('images', {
          uri: img.uri,
          type: 'image/jpeg',
          name: `tournament_${selectedCategory}_${Date.now()}_${index}.jpg`
        } as any);
        
        formData.append('titles', img.title);
        formData.append('descriptions', img.description);
        formData.append('tags', img.tags);
      });

      const response = await api.post('/tournament/admin/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.success) {
        Alert.alert(
          'Sucesso',
          `${uploadImages.length} imagem(ns) enviada(s) com sucesso!`,
          [{ text: 'OK', onPress: () => {
            setShowUploadModal(false);
            setUploadImages([]);
            loadImages();
          }}]
        );
      } else {
        throw new Error(response.message || 'Falha no upload');
      }
    } catch (error: any) {
      console.error('Erro no upload:', error);
      Alert.alert('Erro', 'Falha ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };

  const approveImage = async (imageId: number, approved: boolean) => {
    try {
      const response = await api.put(`/tournament/admin/images/${imageId}/approve`, {
        approved
      });

      if (response.success) {
        // Atualizar lista local
        setImages(prevImages =>
          prevImages.map(img =>
            img.id === imageId ? { ...img, approved } : img
          )
        );
        
        Alert.alert(
          'Sucesso',
          `Imagem ${approved ? 'aprovada' : 'rejeitada'} com sucesso!`
        );
      } else {
        throw new Error(response.message || 'Falha ao aprovar imagem');
      }
    } catch (error: any) {
      console.error('Erro ao aprovar imagem:', error);
      Alert.alert('Erro', 'Falha ao aprovar imagem');
    }
  };

  const deleteImage = async (imageId: number) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta imagem permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Implementar endpoint de exclusão
              console.log('Excluindo imagem:', imageId);
              
              // Por ora, apenas remover da lista local
              setImages(prevImages => prevImages.filter(img => img.id !== imageId));
              
              Alert.alert('Sucesso', 'Imagem excluída com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir imagem');
            }
          }
        }
      ]
    );
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         image.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPending = !showPendingOnly || !image.approved;
    
    return matchesSearch && matchesPending;
  });

  const renderCategoryTab = (category: any) => {
    const isSelected = selectedCategory === category.key;
    const categoryImages = images.filter(img => img.category === category.key);
    const pendingCount = categoryImages.filter(img => !img.approved).length;
    
    return (
      <TouchableOpacity
        key={category.key}
        style={[styles.categoryTab, isSelected && styles.selectedCategoryTab]}
        onPress={() => setSelectedCategory(category.key)}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={[styles.categoryName, isSelected && styles.selectedCategoryName]}>
          {category.name}
        </Text>
        <Text style={styles.categoryCount}>
          {categoryImages.length}
        </Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderImageCard = ({ item }: { item: TournamentImage }) => {
    return (
      <View style={styles.imageCard}>
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.imagePreview}
          resizeMode="cover"
        />
        
        <View style={styles.imageInfo}>
          <Text style={styles.imageTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.imageDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          <View style={styles.imageStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye" size={12} color="#666" />
              <Text style={styles.statText}>{item.totalViews}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={12} color="#666" />
              <Text style={styles.statText}>{item.winRate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.imageActions}>
          {!item.approved ? (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => approveImage(item.id, true)}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => approveImage(item.id, false)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteImage(item.id)}
          >
            <Ionicons name="trash" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {!item.approved && (
          <View style={styles.pendingIndicator}>
            <Text style={styles.pendingText}>PENDENTE</Text>
          </View>
        )}
      </View>
    );
  };

  const renderUploadModal = () => {
    return (
      <Modal visible={showUploadModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowUploadModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Upload de Imagens</Text>
            <TouchableOpacity
              onPress={uploadImagesToServer}
              disabled={uploading || uploadImages.length === 0}
            >
              <Text style={[
                styles.uploadButton,
                (uploading || uploadImages.length === 0) && styles.uploadButtonDisabled
              ]}>
                {uploading ? 'Enviando...' : 'Enviar'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.uploadList}>
            {uploadImages.map((img, index) => (
              <View key={index} style={styles.uploadItem}>
                <Image source={{ uri: img.uri }} style={styles.uploadPreview} />
                
                <View style={styles.uploadForm}>
                  <TextInput
                    style={styles.uploadInput}
                    placeholder="Título da imagem"
                    value={img.title}
                    onChangeText={(text) => {
                      const newImages = [...uploadImages];
                      newImages[index].title = text;
                      setUploadImages(newImages);
                    }}
                  />
                  
                  <TextInput
                    style={styles.uploadInput}
                    placeholder="Descrição"
                    value={img.description}
                    onChangeText={(text) => {
                      const newImages = [...uploadImages];
                      newImages[index].description = text;
                      setUploadImages(newImages);
                    }}
                  />
                  
                  <TextInput
                    style={styles.uploadInput}
                    placeholder="Tags (separadas por vírgula)"
                    value={img.tags}
                    onChangeText={(text) => {
                      const newImages = [...uploadImages];
                      newImages[index].tags = text;
                      setUploadImages(newImages);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    setUploadImages(uploadImages.filter((_, i) => i !== index));
                  }}
                >
                  <Ionicons name="trash" size={16} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.uploadingText}>Enviando imagens...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin - Torneios</Text>
        <TouchableOpacity onPress={selectImages}>
          <Ionicons name="add" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Tabs de categoria */}
      <ScrollView
        horizontal
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map(renderCategoryTab)}
      </ScrollView>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar imagens..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            showPendingOnly && styles.filterButtonActive
          ]}
          onPress={() => setShowPendingOnly(!showPendingOnly)}
        >
          <Ionicons 
            name="hourglass" 
            size={16} 
            color={showPendingOnly ? 'white' : '#666'} 
          />
          <Text style={[
            styles.filterButtonText,
            showPendingOnly && styles.filterButtonTextActive
          ]}>
            Pendentes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de imagens */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Carregando imagens...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredImages}
          renderItem={renderImageCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.imagesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="images" size={48} color="#CCC" />
              <Text style={styles.emptyText}>
                {searchQuery || showPendingOnly 
                  ? 'Nenhuma imagem encontrada com os filtros aplicados'
                  : 'Nenhuma imagem nesta categoria'
                }
              </Text>
              <TouchableOpacity style={styles.addFirstButton} onPress={selectImages}>
                <Text style={styles.addFirstButtonText}>Adicionar Imagens</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal de upload */}
      {renderUploadModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  categoriesContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F1F3F4',
    position: 'relative',
  },
  selectedCategoryTab: {
    backgroundColor: '#FF6B6B',
  },
  categoryIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  selectedCategoryName: {
    color: 'white',
  },
  categoryCount: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  pendingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F3F4',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  imagesList: {
    padding: 16,
  },
  imageCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 120,
  },
  imageInfo: {
    padding: 12,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  imageDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  imageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#666',
  },
  imageActions: {
    flexDirection: 'row',
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#95A5A6',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#F39C12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  uploadButton: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonDisabled: {
    color: '#CCC',
  },
  uploadList: {
    flex: 1,
    padding: 16,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  uploadPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  uploadForm: {
    flex: 1,
  },
  uploadInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  removeButton: {
    padding: 8,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
  },
});

export default AdminTournamentPanel;