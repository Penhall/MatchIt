// screens/AdminTournamentPanel.tsx - Sistema completo de gestão de imagens para torneios
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Switch,
  ScrollView,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

interface TournamentImage {
  id: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[];
  active: boolean;
  approved: boolean;
  createdBy?: number;
  approvedBy?: number;
  uploadDate: string;
  approvedAt?: string;
  fileSize?: number;
  imageWidth?: number;
  imageHeight?: number;
  mimeType?: string;
  totalViews: number;
  totalSelections: number;
  winRate: number;
}

interface TournamentCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  imageCount: number;
  approvedCount: number;
  pendingCount: number;
  color: string;
  icon: string;
}

interface UploadItem {
  id: string;
  uri: string;
  type: string;
  name: string;
  title: string;
  description: string;
  category: string;
  tags: string;
}

interface AdminStats {
  totalImages: number;
  pendingApproval: number;
  activeImages: number;
  totalUploads: number;
  averageWinRate: number;
  totalViews: number;
}

// =====================================================
// CONSTANTS
// =====================================================

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 2;

const TOURNAMENT_CATEGORIES: TournamentCategory[] = [
  { id: 'cores', name: 'cores', displayName: 'Cores', description: 'Paletas e combinações de cores', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#FF6B6B', icon: 'color-palette' },
  { id: 'estilos', name: 'estilos', displayName: 'Estilos', description: 'Diferentes estilos de moda', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#4ECDC4', icon: 'shirt' },
  { id: 'calcados', name: 'calcados', displayName: 'Calçados', description: 'Sapatos, tênis e sandálias', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#45B7D1', icon: 'footsteps' },
  { id: 'acessorios', name: 'acessorios', displayName: 'Acessórios', description: 'Bolsas, joias e acessórios', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#96CEB4', icon: 'diamond' },
  { id: 'texturas', name: 'texturas', displayName: 'Texturas', description: 'Diferentes texturas de tecidos', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#FECA57', icon: 'layers' },
  { id: 'roupas_casuais', name: 'roupas_casuais', displayName: 'Roupas Casuais', description: 'Roupas para o dia a dia', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#FF9FF3', icon: 'cafe' },
  { id: 'roupas_formais', name: 'roupas_formais', displayName: 'Roupas Formais', description: 'Roupas para ocasiões formais', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#54A0FF', icon: 'business' },
  { id: 'roupas_festa', name: 'roupas_festa', displayName: 'Roupas de Festa', description: 'Roupas para festas e eventos', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#5F27CD', icon: 'sparkles' },
  { id: 'joias', name: 'joias', displayName: 'Joias', description: 'Anéis, colares e brincos', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#FFD700', icon: 'diamond-outline' },
  { id: 'bolsas', name: 'bolsas', displayName: 'Bolsas', description: 'Bolsas e carteiras', imageCount: 0, approvedCount: 0, pendingCount: 0, color: '#FF6348', icon: 'bag' }
];

// =====================================================
// MAIN COMPONENT
// =====================================================

export const AdminTournamentPanel: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const api = useApi();

  // Main states
  const [images, setImages] = useState<TournamentImage[]>([]);
  const [categories, setCategories] = useState<TournamentCategory[]>(TOURNAMENT_CATEGORIES);
  const [stats, setStats] = useState<AdminStats>({
    totalImages: 0,
    pendingApproval: 0,
    activeImages: 0,
    totalUploads: 0,
    averageWinRate: 0,
    totalViews: 0
  });

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'active'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'winRate' | 'views'>('date');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [editingImage, setEditingImage] = useState<TournamentImage | null>(null);

  // =====================================================
  // LIFECYCLE
  // =====================================================

  useEffect(() => {
    checkAdminPermissions();
    loadInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedCategory !== 'all') {
        loadImages();
      }
    }, [selectedCategory, filterStatus, sortBy])
  );

  // =====================================================
  // PERMISSIONS AND INITIALIZATION
  // =====================================================

  const checkAdminPermissions = () => {
    if (!user?.isAdmin) {
      Alert.alert(
        'Acesso Negado',
        'Você não tem permissão para acessar o painel administrativo.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCategories(),
        loadStats(),
        loadImages()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Erro', 'Falha ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadCategories = async () => {
    try {
      const response = await api.get('/tournament/admin/categories/stats');
      if (response?.data) {
        const updatedCategories = TOURNAMENT_CATEGORIES.map(cat => {
          const stats = response.data[cat.id] || {};
          return {
            ...cat,
            imageCount: stats.total || 0,
            approvedCount: stats.approved || 0,
            pendingCount: stats.pending || 0
          };
        });
        setCategories(updatedCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/tournament/admin/stats');
      if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadImages = async () => {
    try {
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      params.append('sortBy', sortBy);

      const response = await api.get(`/tournament/admin/images?${params.toString()}`);
      if (response?.data) {
        setImages(response.data);
      }
    } catch (error) {
      console.error('Failed to load images:', error);
      Alert.alert('Erro', 'Falha ao carregar imagens');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, []);

  // =====================================================
  // IMAGE MANAGEMENT
  // =====================================================

  const approveImage = async (imageId: number) => {
    try {
      await api.put(`/tournament/admin/images/${imageId}/approve`);
      await loadImages();
      await loadStats();
      Alert.alert('Sucesso', 'Imagem aprovada com sucesso!');
    } catch (error) {
      console.error('Failed to approve image:', error);
      Alert.alert('Erro', 'Falha ao aprovar imagem');
    }
  };

  const rejectImage = async (imageId: number) => {
    Alert.alert(
      'Rejeitar Imagem',
      'Tem certeza que deseja rejeitar esta imagem? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/tournament/admin/images/${imageId}/reject`);
              await loadImages();
              await loadStats();
              Alert.alert('Sucesso', 'Imagem rejeitada');
            } catch (error) {
              console.error('Failed to reject image:', error);
              Alert.alert('Erro', 'Falha ao rejeitar imagem');
            }
          }
        }
      ]
    );
  };

  const deleteImage = async (imageId: number) => {
    Alert.alert(
      'Deletar Imagem',
      'Tem certeza que deseja deletar esta imagem permanentemente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/tournament/admin/images/${imageId}`);
              await loadImages();
              await loadStats();
              Alert.alert('Sucesso', 'Imagem deletada');
            } catch (error) {
              console.error('Failed to delete image:', error);
              Alert.alert('Erro', 'Falha ao deletar imagem');
            }
          }
        }
      ]
    );
  };

  const toggleImageActive = async (imageId: number, currentStatus: boolean) => {
    try {
      await api.put(`/tournament/admin/images/${imageId}/toggle-active`, {
        active: !currentStatus
      });
      await loadImages();
      Alert.alert('Sucesso', `Imagem ${!currentStatus ? 'ativada' : 'desativada'}`);
    } catch (error) {
      console.error('Failed to toggle image active status:', error);
      Alert.alert('Erro', 'Falha ao alterar status da imagem');
    }
  };

  const editImage = (image: TournamentImage) => {
    setEditingImage(image);
    setEditModalVisible(true);
  };

  const updateImage = async (imageId: number, updates: Partial<TournamentImage>) => {
    try {
      await api.put(`/tournament/admin/images/${imageId}`, updates);
      await loadImages();
      setEditModalVisible(false);
      setEditingImage(null);
      Alert.alert('Sucesso', 'Imagem atualizada');
    } catch (error) {
      console.error('Failed to update image:', error);
      Alert.alert('Erro', 'Falha ao atualizar imagem');
    }
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1]
      });

      if (!result.canceled && result.assets) {
        const newItems: UploadItem[] = result.assets.map((asset, index) => ({
          id: `upload_${Date.now()}_${index}`,
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
          title: '',
          description: '',
          category: selectedCategory !== 'all' ? selectedCategory : 'cores',
          tags: ''
        }));

        setUploadQueue(prev => [...prev, ...newItems]);
        setUploadModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to pick images:', error);
      Alert.alert('Erro', 'Falha ao selecionar imagens');
    }
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const updateQueueItem = (id: string, field: keyof UploadItem, value: string) => {
    setUploadQueue(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const uploadImages = async () => {
    if (uploadQueue.length === 0) return;

    try {
      setUploading(true);

      const uploadPromises = uploadQueue.map(async (item) => {
        const formData = new FormData();
        formData.append('image', {
          uri: item.uri,
          type: 'image/jpeg',
          name: item.name
        } as any);
        formData.append('title', item.title);
        formData.append('description', item.description);
        formData.append('category', item.category);
        formData.append('tags', item.tags);

        return api.post('/tournament/admin/images/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      });

      await Promise.all(uploadPromises);

      Alert.alert('Sucesso', `${uploadQueue.length} imagens enviadas para aprovação`);
      setUploadQueue([]);
      setUploadModalVisible(false);
      await loadImages();
      await loadStats();
    } catch (error) {
      console.error('Failed to upload images:', error);
      Alert.alert('Erro', 'Falha ao enviar algumas imagens');
    } finally {
      setUploading(false);
    }
  };

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  const bulkApprove = async () => {
    const pendingImages = images.filter(img => !img.approved);
    if (pendingImages.length === 0) {
      Alert.alert('Info', 'Não há imagens pendentes para aprovar');
      return;
    }

    Alert.alert(
      'Aprovação em Lote',
      `Aprovar ${pendingImages.length} imagens pendentes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar Todas',
          onPress: async () => {
            try {
              const imageIds = pendingImages.map(img => img.id);
              await api.put('/tournament/admin/images/bulk-approve', { imageIds });
              await loadImages();
              await loadStats();
              Alert.alert('Sucesso', `${pendingImages.length} imagens aprovadas`);
            } catch (error) {
              console.error('Failed to bulk approve:', error);
              Alert.alert('Erro', 'Falha na aprovação em lote');
            }
          }
        }
      ]
    );
  };

  const bulkDelete = async () => {
    const selectedImages = images.filter(img => !img.approved && !img.active);
    if (selectedImages.length === 0) {
      Alert.alert('Info', 'Não há imagens para deletar em lote');
      return;
    }

    Alert.alert(
      'Deleção em Lote',
      `Deletar ${selectedImages.length} imagens rejeitadas/inativas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              const imageIds = selectedImages.map(img => img.id);
              await api.delete('/tournament/admin/images/bulk-delete', { 
                data: { imageIds } 
              });
              await loadImages();
              await loadStats();
              Alert.alert('Sucesso', `${selectedImages.length} imagens deletadas`);
            } catch (error) {
              console.error('Failed to bulk delete:', error);
              Alert.alert('Erro', 'Falha na deleção em lote');
            }
          }
        }
      ]
    );
  };

  // =====================================================
  // RENDER METHODS
  // =====================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Admin - Torneios</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={pickImages}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#4ECDC4' }]}>
            <Ionicons name="images" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.totalImages}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FF6B6B' }]}>
            <Ionicons name="time" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.pendingApproval}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.activeImages}</Text>
            <Text style={styles.statLabel}>Ativas</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FFD700' }]}>
            <Ionicons name="trophy" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.averageWinRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#9C88FF' }]}>
            <Ionicons name="eye" size={24} color="white" />
            <Text style={styles.statNumber}>{stats.totalViews}</Text>
            <Text style={styles.statLabel}>Visualizações</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
        <TouchableOpacity
          style={[
            styles.categoryFilterButton,
            selectedCategory === 'all' && styles.categoryFilterButtonActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryFilterText,
            selectedCategory === 'all' && styles.categoryFilterTextActive
          ]}>
            Todas
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryFilterButton,
              selectedCategory === category.id && styles.categoryFilterButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <View style={styles.categoryFilterContent}>
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? 'white' : '#666'} 
              />
              <Text style={[
                styles.categoryFilterText,
                selectedCategory === category.id && styles.categoryFilterTextActive
              ]}>
                {category.displayName}
              </Text>
              {category.pendingCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{category.pendingCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search and Filters */}
      <View style={styles.searchFiltersRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar imagens..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadImages}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            filterStatus !== 'all' && styles.filterButtonActive
          ]}
          onPress={() => {
            const statuses = ['all', 'pending', 'approved', 'active'];
            const currentIndex = statuses.indexOf(filterStatus);
            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
            setFilterStatus(nextStatus as any);
          }}
        >
          <Ionicons 
            name="filter" 
            size={16} 
            color={filterStatus !== 'all' ? 'white' : '#666'} 
          />
          <Text style={[
            styles.filterButtonText,
            filterStatus !== 'all' && styles.filterButtonTextActive
          ]}>
            {filterStatus === 'all' ? 'Todas' : 
             filterStatus === 'pending' ? 'Pendentes' :
             filterStatus === 'approved' ? 'Aprovadas' : 'Ativas'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
          onPress={bulkApprove}
        >
          <Ionicons name="checkmark-done" size={16} color="white" />
          <Text style={styles.actionButtonText}>Aprovar Lote</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
          onPress={bulkDelete}
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text style={styles.actionButtonText}>Deletar Lote</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImageCard = ({ item }: { item: TournamentImage }) => (
    <View style={styles.imageCard}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.thumbnailUrl || item.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        {/* Status Indicators */}
        {!item.approved && (
          <View style={styles.pendingIndicator}>
            <Text style={styles.pendingText}>PENDENTE</Text>
          </View>
        )}
        
        {!item.active && (
          <View style={styles.inactiveIndicator}>
            <Text style={styles.inactiveText}>INATIVA</Text>
          </View>
        )}
      </View>

      {/* Image Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={12} color="#666" />
            <Text style={styles.statText}>{item.totalViews}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="trophy" size={12} color="#666" />
            <Text style={styles.statText}>{item.winRate.toFixed(0)}%</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="thumbs-up" size={12} color="#666" />
            <Text style={styles.statText}>{item.totalSelections}</Text>
          </View>
        </View>

        <View style={styles.cardTags}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        {!item.approved && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => approveImage(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF6B6B' }]}
              onPress={() => rejectImage(item.id)}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={() => editImage(item)}
        >
          <Ionicons name="create" size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.active ? '#FF9800' : '#4CAF50' }]}
          onPress={() => toggleImageActive(item.id, item.active)}
        >
          <Ionicons name={item.active ? "pause" : "play"} size={16} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
          onPress={() => deleteImage(item.id)}
        >
          <Ionicons name="trash" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUploadModal = () => (
    <Modal
      visible={uploadModalVisible}
      animationType="slide"
      onRequestClose={() => setUploadModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Upload de Imagens</Text>
          
          <TouchableOpacity
            style={[
              styles.uploadButton,
              (uploadQueue.length === 0 || uploading) && styles.uploadButtonDisabled
            ]}
            onPress={uploadImages}
            disabled={uploadQueue.length === 0 || uploading}
          >
            <Text style={[
              styles.uploadButtonText,
              (uploadQueue.length === 0 || uploading) && styles.uploadButtonTextDisabled
            ]}>
              {uploading ? 'Enviando...' : `Upload (${uploadQueue.length})`}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.uploadList}>
          {uploadQueue.map(item => (
            <View key={item.id} style={styles.uploadItem}>
              <Image source={{ uri: item.uri }} style={styles.uploadPreview} />
              
              <View style={styles.uploadForm}>
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Título da imagem *"
                  value={item.title}
                  onChangeText={(text) => updateQueueItem(item.id, 'title', text)}
                />
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Descrição"
                  value={item.description}
                  onChangeText={(text) => updateQueueItem(item.id, 'description', text)}
                  multiline
                />
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Tags (separadas por vírgula)"
                  value={item.tags}
                  onChangeText={(text) => updateQueueItem(item.id, 'tags', text)}
                />
              </View>
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromQueue(item.id)}
              >
                <Ionicons name="trash" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.uploadingText}>Enviando imagens...</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditModalVisible(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Editar Imagem</Text>
          
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => {
              if (editingImage) {
                updateImage(editingImage.id, {
                  title: editingImage.title,
                  description: editingImage.description,
                  tags: editingImage.tags
                });
              }
            }}
          >
            <Text style={styles.uploadButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        {editingImage && (
          <ScrollView style={styles.uploadList}>
            <View style={styles.editImageContainer}>
              <Image 
                source={{ uri: editingImage.thumbnailUrl || editingImage.imageUrl }} 
                style={styles.editImagePreview} 
              />
              
              <View style={styles.editForm}>
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Título da imagem"
                  value={editingImage.title}
                  onChangeText={(text) => setEditingImage(prev => prev ? {...prev, title: text} : null)}
                />
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Descrição"
                  value={editingImage.description || ''}
                  onChangeText={(text) => setEditingImage(prev => prev ? {...prev, description: text} : null)}
                  multiline
                />
                
                <TextInput
                  style={styles.uploadInput}
                  placeholder="Tags (separadas por vírgula)"
                  value={editingImage.tags.join(', ')}
                  onChangeText={(text) => setEditingImage(prev => prev ? {...prev, tags: text.split(',').map(t => t.trim())} : null)}
                />

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Imagem Ativa</Text>
                  <Switch
                    value={editingImage.active}
                    onValueChange={(value) => setEditingImage(prev => prev ? {...prev, active: value} : null)}
                  />
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Aprovada</Text>
                  <Switch
                    value={editingImage.approved}
                    onValueChange={(value) => setEditingImage(prev => prev ? {...prev, approved: value} : null)}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>
        {selectedCategory === 'all' 
          ? 'Nenhuma imagem encontrada'
          : `Nenhuma imagem encontrada para ${categories.find(c => c.id === selectedCategory)?.displayName || selectedCategory}`
        }
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={pickImages}
      >
        <Text style={styles.addFirstButtonText}>Adicionar Primeira Imagem</Text>
      </TouchableOpacity>
    </View>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Carregando painel administrativo...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        {renderStats()}
        {renderFilters()}
        
        <FlatList
          data={images}
          renderItem={renderImageCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.imagesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />

        {renderUploadModal()}
        {renderEditModal()}
      </SafeAreaView>
    </LinearGradient>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  statsContainer: {
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'white',
    marginTop: 2,
    fontWeight: '500',
  },
  filtersContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
  },
  categoryFilters: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoryFilterButton: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryFilterButtonActive: {
    backgroundColor: '#E74C3C',
  },
  categoryFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  categoryFilterTextActive: {
    color: 'white',
  },
  pendingBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
  },
  searchFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F4',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F3F4',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#E74C3C',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  imagesList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imageCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 6,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  pendingIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
  },
  inactiveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#9E9E9E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
    marginBottom: 6,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 8,
    color: '#1976D2',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
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
    color: '#333',
  },
  uploadButton: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadButtonDisabled: {
    backgroundColor: '#CCC',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButtonTextDisabled: {
    color: '#666',
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
    gap: 12,
  },
  uploadPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  editImageContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  editImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  editForm: {
    gap: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});

export default AdminTournamentPanel;