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
  Dimensions,
  Platform
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
  createdByUsername?: string;
  approvedByUsername?: string;
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
  totalSelections: number;
  categoriesCount: number;
  usersCount: number;
  tournamentsCompleted: number;
}

interface ImageFilters {
  category: string;
  status: 'all' | 'pending' | 'approved' | 'active' | 'inactive';
  search: string;
  sortBy: 'upload_date' | 'title' | 'win_rate' | 'total_views' | 'total_selections';
  sortOrder: 'asc' | 'desc';
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
  const { api } = useApi();

  // Main states
  const [images, setImages] = useState<TournamentImage[]>([]);
  const [categories, setCategories] = useState<TournamentCategory[]>(TOURNAMENT_CATEGORIES);
  const [stats, setStats] = useState<AdminStats>({
    totalImages: 0,
    pendingApproval: 0,
    activeImages: 0,
    totalUploads: 0,
    averageWinRate: 0,
    totalViews: 0,
    totalSelections: 0,
    categoriesCount: 0,
    usersCount: 0,
    tournamentsCompleted: 0
  });

  // UI states
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'upload' | 'categories'>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  // Filter states
  const [filters, setFilters] = useState<ImageFilters>({
    category: 'all',
    status: 'all',
    search: '',
    sortBy: 'upload_date',
    sortOrder: 'desc'
  });

  // Modal states
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [imageDetailModalVisible, setImageDetailModalVisible] = useState(false);
  const [editImageModalVisible, setEditImageModalVisible] = useState(false);
  const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);

  // Upload states
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Detail states
  const [selectedImageDetail, setSelectedImageDetail] = useState<TournamentImage | null>(null);
  const [editingImage, setEditingImage] = useState<TournamentImage | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // =====================================================
  // LIFECYCLE EFFECTS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  useEffect(() => {
    loadImages();
  }, [filters, page]);

  // =====================================================
  // DATA LOADING
  // =====================================================

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadCategories(),
        loadImages()
      ]);
    } catch (error) {
      console.error('❌ Erro ao carregar dados iniciais:', error);
      showError('Erro ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats - replace with actual API call
      const mockStats: AdminStats = {
        totalImages: 1247,
        pendingApproval: 23,
        activeImages: 1156,
        totalUploads: 1300,
        averageWinRate: 67.5,
        totalViews: 45678,
        totalSelections: 12456,
        categoriesCount: 10,
        usersCount: 150,
        tournamentsCompleted: 856
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error);
    }
  };

  const loadCategories = async () => {
    try {
      // Mock categories with updated counts - replace with actual API call
      const mockCategories = TOURNAMENT_CATEGORIES.map((cat, index) => ({
        ...cat,
        imageCount: Math.floor(Math.random() * 200) + 50,
        approvedCount: Math.floor(Math.random() * 150) + 40,
        pendingCount: Math.floor(Math.random() * 10) + 1
      }));
      
      setCategories(mockCategories);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
    }
  };

  const loadImages = async (append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Mock images - replace with actual API call
      const mockImages: TournamentImage[] = Array.from({ length: 20 }, (_, index) => ({
        id: (page - 1) * 20 + index + 1,
        category: TOURNAMENT_CATEGORIES[Math.floor(Math.random() * TOURNAMENT_CATEGORIES.length)].name,
        imageUrl: `https://picsum.photos/300/400?random=${(page - 1) * 20 + index + 1}`,
        thumbnailUrl: `https://picsum.photos/150/200?random=${(page - 1) * 20 + index + 1}`,
        title: `Imagem ${(page - 1) * 20 + index + 1}`,
        description: `Descrição da imagem ${(page - 1) * 20 + index + 1}`,
        tags: ['moderno', 'elegante', 'casual'][Math.floor(Math.random() * 3)] ? 
          ['moderno', 'elegante'] : ['casual', 'formal'],
        active: Math.random() > 0.1,
        approved: Math.random() > 0.2,
        createdBy: 1,
        uploadDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalViews: Math.floor(Math.random() * 1000),
        totalSelections: Math.floor(Math.random() * 100),
        winRate: Math.random() * 100,
        createdByUsername: 'admin'
      }));

      if (append) {
        setImages(prev => [...prev, ...mockImages]);
      } else {
        setImages(mockImages);
      }

      setHasMore(page < 5); // Mock pagination

    } catch (error) {
      console.error('❌ Erro ao carregar imagens:', error);
      showError('Erro ao carregar imagens');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      setPage(prev => prev + 1);
    }
  };

  // =====================================================
  // IMAGE UPLOAD
  // =====================================================

  const handleImageUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Precisamos de acesso à galeria para fazer upload de imagens.');
        return;
      }

      // Pick images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [3, 4],
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newItems: UploadItem[] = result.assets.map((asset, index) => ({
          id: `upload_${Date.now()}_${index}`,
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName || `image_${index}.jpg`,
          title: '',
          description: '',
          category: 'estilos',
          tags: ''
        }));

        setUploadQueue(prev => [...prev, ...newItems]);
        setUploadModalVisible(true);
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar imagens:', error);
      showError('Erro ao selecionar imagens');
    }
  };

  const handleBulkUploadFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets) {
        const newItems: UploadItem[] = result.assets.map((asset, index) => ({
          id: `upload_${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'image',
          name: asset.name,
          title: '',
          description: '',
          category: 'estilos',
          tags: ''
        }));

        setUploadQueue(prev => [...prev, ...newItems]);
        setUploadModalVisible(true);
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar arquivos:', error);
      showError('Erro ao selecionar arquivos');
    }
  };

  const processUploadQueue = async () => {
    if (uploadQueue.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i];
        
        // Mock upload - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadProgress(((i + 1) / uploadQueue.length) * 100);
      }

      // Clear queue and refresh data
      setUploadQueue([]);
      setUploadModalVisible(false);
      await loadInitialData();
      
      showSuccess(`${uploadQueue.length} imagem(ns) enviada(s) com sucesso!`);

    } catch (error) {
      console.error('❌ Erro no upload:', error);
      showError('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // =====================================================
  // IMAGE MANAGEMENT
  // =====================================================

  const handleApproveImage = async (imageId: number) => {
    try {
      // Mock approval - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, approved: true, approvedBy: user?.id, approvedAt: new Date().toISOString() }
          : img
      ));
      
      showSuccess('Imagem aprovada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao aprovar imagem:', error);
      showError('Erro ao aprovar imagem');
    }
  };

  const handleRejectImage = async (imageId: number) => {
    Alert.alert(
      'Rejeitar Imagem',
      'Tem certeza que deseja rejeitar esta imagem?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rejeitar', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Mock rejection - replace with actual API call
              await new Promise(resolve => setTimeout(resolve, 500));
              
              setImages(prev => prev.filter(img => img.id !== imageId));
              showSuccess('Imagem rejeitada');
            } catch (error) {
              console.error('❌ Erro ao rejeitar imagem:', error);
              showError('Erro ao rejeitar imagem');
            }
          }
        }
      ]
    );
  };

  const handleToggleImageActive = async (imageId: number) => {
    try {
      // Mock toggle - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, active: !img.active } : img
      ));
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      showError('Erro ao alterar status da imagem');
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    Alert.alert(
      'Deletar Imagem',
      'Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Deletar', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Mock deletion - replace with actual API call
              await new Promise(resolve => setTimeout(resolve, 500));
              
              setImages(prev => prev.filter(img => img.id !== imageId));
              showSuccess('Imagem deletada');
            } catch (error) {
              console.error('❌ Erro ao deletar imagem:', error);
              showError('Erro ao deletar imagem');
            }
          }
        }
      ]
    );
  };

  const handleUpdateImage = async (updatedImage: TournamentImage) => {
    try {
      // Mock update - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setImages(prev => prev.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      ));
      
      setEditImageModalVisible(false);
      setEditingImage(null);
      showSuccess('Imagem atualizada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar imagem:', error);
      showError('Erro ao atualizar imagem');
    }
  };

  // =====================================================
  // BULK ACTIONS
  // =====================================================

  const handleBulkAction = async (action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'delete') => {
    if (selectedImages.length === 0) {
      showError('Selecione pelo menos uma imagem');
      return;
    }

    const actionText = {
      approve: 'aprovar',
      reject: 'rejeitar',
      activate: 'ativar',
      deactivate: 'desativar',
      delete: 'deletar'
    }[action];

    Alert.alert(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Imagens`,
      `Tem certeza que deseja ${actionText} ${selectedImages.length} imagem(ns)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1),
          style: action === 'delete' || action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              // Mock bulk action - replace with actual API call
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              switch (action) {
                case 'approve':
                  setImages(prev => prev.map(img => 
                    selectedImages.includes(img.id) 
                      ? { ...img, approved: true, approvedBy: user?.id, approvedAt: new Date().toISOString() }
                      : img
                  ));
                  break;
                case 'activate':
                  setImages(prev => prev.map(img => 
                    selectedImages.includes(img.id) ? { ...img, active: true } : img
                  ));
                  break;
                case 'deactivate':
                  setImages(prev => prev.map(img => 
                    selectedImages.includes(img.id) ? { ...img, active: false } : img
                  ));
                  break;
                case 'delete':
                case 'reject':
                  setImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
                  break;
              }
              
              setSelectedImages([]);
              setBulkActionModalVisible(false);
              showSuccess(`${selectedImages.length} imagem(ns) ${actionText}(s) com sucesso!`);
            } catch (error) {
              console.error(`❌ Erro na ação em lote:`, error);
              showError(`Erro ao ${actionText} imagens`);
            }
          }
        }
      ]
    );
  };

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const showSuccess = (message: string) => {
    Alert.alert('Sucesso', message);
  };

  const showError = (message: string) => {
    Alert.alert('Erro', message);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderTabButton = (tab: typeof activeTab, title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons 
        name={icon as any} 
        size={20} 
        color={activeTab === tab ? '#fff' : '#666'} 
      />
      <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsCardHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.statsCardTitle}>{title}</Text>
      </View>
      <Text style={styles.statsCardValue}>{value}</Text>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatsCard('Total de Imagens', stats.totalImages, 'images', '#4ECDC4')}
        {renderStatsCard('Pendentes', stats.pendingApproval, 'time', '#FF6B6B')}
        {renderStatsCard('Ativas', stats.activeImages, 'checkmark-circle', '#00D9FF')}
        {renderStatsCard('Taxa de Vitória Média', `${stats.averageWinRate.toFixed(1)}%`, 'trophy', '#FFD700')}
        {renderStatsCard('Total de Visualizações', stats.totalViews.toLocaleString(), 'eye', '#96CEB4')}
        {renderStatsCard('Torneios Concluídos', stats.tournamentsCompleted, 'flag', '#5F27CD')}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#4ECDC4' }]}
            onPress={() => setActiveTab('upload')}
          >
            <Ionicons name="cloud-upload" size={32} color="#fff" />
            <Text style={styles.quickActionText}>Upload</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#FF6B6B' }]}
            onPress={() => {
              setFilters(prev => ({ ...prev, status: 'pending' }));
              setActiveTab('images');
            }}
          >
            <Ionicons name="time" size={32} color="#fff" />
            <Text style={styles.quickActionText}>Pendentes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#FFD700' }]}
            onPress={() => setActiveTab('categories')}
          >
            <Ionicons name="grid" size={32} color="#fff" />
            <Text style={styles.quickActionText}>Categorias</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#96CEB4' }]}
            onPress={() => {
              setSelectedImages([]);
              setBulkActionModalVisible(true);
            }}
          >
            <Ionicons name="checkbox" size={32} color="#fff" />
            <Text style={styles.quickActionText}>Ações em Lote</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visão Geral por Categoria</Text>
        {categories.map(category => (
          <View key={category.id} style={styles.categoryOverviewItem}>
            <View style={styles.categoryOverviewHeader}>
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
              <Text style={styles.categoryOverviewName}>{category.displayName}</Text>
              <Text style={styles.categoryOverviewCount}>{category.imageCount} imagens</Text>
            </View>
            <View style={styles.categoryOverviewProgress}>
              <View 
                style={[
                  styles.categoryOverviewProgressBar,
                  { 
                    width: `${(category.approvedCount / Math.max(category.imageCount, 1)) * 100}%`,
                    backgroundColor: category.color 
                  }
                ]}
              />
            </View>
            <Text style={styles.categoryOverviewStats}>
              {category.approvedCount} aprovadas • {category.pendingCount} pendentes
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderImageCard = (image: TournamentImage) => {
    const isSelected = selectedImages.includes(image.id);
    
    return (
      <TouchableOpacity
        style={[styles.imageCard, isSelected && styles.selectedImageCard]}
        onPress={() => {
          setSelectedImageDetail(image);
          setImageDetailModalVisible(true);
        }}
        onLongPress={() => {
          if (isSelected) {
            setSelectedImages(prev => prev.filter(id => id !== image.id));
          } else {
            setSelectedImages(prev => [...prev, image.id]);
          }
        }}
      >
        {/* Selection indicator */}
        {selectedImages.length > 0 && (
          <TouchableOpacity
            style={styles.selectionIndicator}
            onPress={() => {
              if (isSelected) {
                setSelectedImages(prev => prev.filter(id => id !== image.id));
              } else {
                setSelectedImages(prev => [...prev, image.id]);
              }
            }}
          >
            <Ionicons 
              name={isSelected ? "checkbox" : "square-outline"} 
              size={24} 
              color={isSelected ? "#4ECDC4" : "#999"} 
            />
          </TouchableOpacity>
        )}

        {/* Image */}
        <Image 
          source={{ uri: image.thumbnailUrl || image.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Status badges */}
        <View style={styles.statusBadges}>
          {!image.approved && (
            <View style={[styles.statusBadge, { backgroundColor: '#FF6B6B' }]}>
              <Text style={styles.statusBadgeText}>Pendente</Text>
            </View>
          )}
          {!image.active && (
            <View style={[styles.statusBadge, { backgroundColor: '#999' }]}>
              <Text style={styles.statusBadgeText}>Inativo</Text>
            </View>
          )}
          {image.approved && image.active && (
            <View style={[styles.statusBadge, { backgroundColor: '#4ECDC4' }]}>
              <Text style={styles.statusBadgeText}>Ativo</Text>
            </View>
          )}
        </View>

        {/* Image info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{image.title}</Text>
          <Text style={styles.cardSubtitle}>{image.category}</Text>
          
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Ionicons name="eye" size={12} color="#666" />
              <Text style={styles.cardStatText}>{image.totalViews}</Text>
            </View>
            <View style={styles.cardStat}>
              <Ionicons name="trophy" size={12} color="#666" />
              <Text style={styles.cardStatText}>{image.winRate.toFixed(1)}%</Text>
            </View>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.cardActions}>
          {!image.approved && (
            <TouchableOpacity
              style={[styles.cardAction, { backgroundColor: '#4ECDC4' }]}
              onPress={() => handleApproveImage(image.id)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.cardAction, { backgroundColor: image.active ? '#999' : '#4ECDC4' }]}
            onPress={() => handleToggleImageActive(image.id)}
          >
            <Ionicons name={image.active ? "pause" : "play"} size={16} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cardAction, { backgroundColor: '#667eea' }]}
            onPress={() => {
              setEditingImage(image);
              setEditImageModalVisible(true);
            }}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.cardAction, { backgroundColor: '#FF6B6B' }]}
            onPress={() => handleDeleteImage(image.id)}
          >
            <Ionicons name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderImagesTab = () => (
    <View style={styles.tabContent}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filters.status === 'all' && styles.activeFilterButton]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'all' }))}
          >
            <Text style={[styles.filterButtonText, filters.status === 'all' && styles.activeFilterButtonText]}>
              Todas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filters.status === 'pending' && styles.activeFilterButton]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'pending' }))}
          >
            <Text style={[styles.filterButtonText, filters.status === 'pending' && styles.activeFilterButtonText]}>
              Pendentes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filters.status === 'approved' && styles.activeFilterButton]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'approved' }))}
          >
            <Text style={[styles.filterButtonText, filters.status === 'approved' && styles.activeFilterButtonText]}>
              Aprovadas
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filters.status === 'active' && styles.activeFilterButton]}
            onPress={() => setFilters(prev => ({ ...prev, status: 'active' }))}
          >
            <Text style={[styles.filterButtonText, filters.status === 'active' && styles.activeFilterButtonText]}>
              Ativas
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título, descrição ou tags..."
          value={filters.search}
          onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
        />
        {filters.search.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setFilters(prev => ({ ...prev, search: '' }))}
          >
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Selection header */}
      {selectedImages.length > 0 && (
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionHeaderText}>
            {selectedImages.length} imagem(ns) selecionada(s)
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={[styles.selectionAction, { backgroundColor: '#4ECDC4' }]}
              onPress={() => setBulkActionModalVisible(true)}
            >
              <Ionicons name="options" size={16} color="#fff" />
              <Text style={styles.selectionActionText}>Ações</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.selectionAction, { backgroundColor: '#999' }]}
              onPress={() => setSelectedImages([])}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Images grid */}
      <FlatList
        data={images}
        renderItem={({ item }) => renderImageCard(item)}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.imageRow}
        contentContainerStyle={styles.imagesGrid}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListFooterComponent={() => (
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#4ECDC4" />
              <Text style={styles.loadingMoreText}>Carregando mais imagens...</Text>
            </View>
          ) : null
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="images" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Nenhuma imagem encontrada</Text>
            <Text style={styles.emptyStateMessage}>
              {filters.search ? 'Tente ajustar os filtros de busca' : 'Faça upload de algumas imagens para começar'}
            </Text>
          </View>
        )}
      />
    </View>
  );

  const renderUploadTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload de Imagens</Text>
        
        <View style={styles.uploadButtons}>
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: '#4ECDC4' }]}
            onPress={handleImageUpload}
          >
            <Ionicons name="images" size={32} color="#fff" />
            <Text style={styles.uploadButtonText}>Selecionar da Galeria</Text>
            <Text style={styles.uploadButtonSubtext}>Múltiplas imagens</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.uploadButton, { backgroundColor: '#667eea' }]}
            onPress={handleBulkUploadFromFiles}
          >
            <Ionicons name="folder" size={32} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload em Lote</Text>
            <Text style={styles.uploadButtonSubtext}>Arquivos do dispositivo</Text>
          </TouchableOpacity>
        </View>

        {/* Upload queue preview */}
        {uploadQueue.length > 0 && (
          <View style={styles.uploadQueue}>
            <Text style={styles.uploadQueueTitle}>
              Fila de Upload ({uploadQueue.length} itens)
            </Text>
            
            <FlatList
              data={uploadQueue.slice(0, 3)}
              horizontal
              renderItem={({ item }) => (
                <View style={styles.uploadQueueItem}>
                  <Image source={{ uri: item.uri }} style={styles.uploadQueueImage} />
                  <Text style={styles.uploadQueueItemTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
            />
            
            <TouchableOpacity
              style={styles.processUploadButton}
              onPress={() => setUploadModalVisible(true)}
            >
              <Text style={styles.processUploadButtonText}>
                Configurar e Enviar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Diretrizes para Upload</Text>
          
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.guidelineText}>Imagens em alta qualidade (mínimo 300x400px)</Text>
          </View>
          
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.guidelineText}>Formatos aceitos: JPEG, PNG, WebP</Text>
          </View>
          
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.guidelineText}>Tamanho máximo: 5MB por imagem</Text>
          </View>
          
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.guidelineText}>Conteúdo apropriado e relevante à categoria</Text>
          </View>
          
          <View style={styles.guideline}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={styles.guidelineText}>Adicione tags descritivas para melhor organização</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderCategoriesTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.categoriesGrid}>
        {categories.map(category => (
          <View key={category.id} style={styles.categoryCard}>
            <LinearGradient
              colors={[category.color, `${category.color}DD`]}
              style={styles.categoryCardGradient}
            >
              <View style={styles.categoryCardHeader}>
                <Ionicons name={category.icon as any} size={32} color="#fff" />
                <Text style={styles.categoryCardTitle}>{category.displayName}</Text>
              </View>
              
              <Text style={styles.categoryCardDescription}>
                {category.description}
              </Text>
              
              <View style={styles.categoryCardStats}>
                <View style={styles.categoryCardStat}>
                  <Text style={styles.categoryCardStatValue}>{category.imageCount}</Text>
                  <Text style={styles.categoryCardStatLabel}>Total</Text>
                </View>
                <View style={styles.categoryCardStat}>
                  <Text style={styles.categoryCardStatValue}>{category.approvedCount}</Text>
                  <Text style={styles.categoryCardStatLabel}>Aprovadas</Text>
                </View>
                <View style={styles.categoryCardStat}>
                  <Text style={styles.categoryCardStatValue}>{category.pendingCount}</Text>
                  <Text style={styles.categoryCardStatLabel}>Pendentes</Text>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.categoryCardButton}
                onPress={() => {
                  setFilters(prev => ({ ...prev, category: category.name }));
                  setActiveTab('images');
                }}
              >
                <Text style={styles.categoryCardButtonText}>Ver Imagens</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // =====================================================
  // MODALS
  // =====================================================

  const renderUploadModal = () => (
    <Modal
      visible={uploadModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Configurar Upload</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setUploadModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.uploadingText}>Enviando imagens...</Text>
            <View style={styles.uploadProgressBar}>
              <View 
                style={[
                  styles.uploadProgressFill, 
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</Text>
          </View>
        ) : (
          <ScrollView style={styles.modalContent}>
            {uploadQueue.map((item, index) => (
              <View key={item.id} style={styles.uploadConfigItem}>
                <Image source={{ uri: item.uri }} style={styles.uploadConfigImage} />
                
                <View style={styles.uploadConfigForm}>
                  <TextInput
                    style={styles.uploadConfigInput}
                    placeholder="Título da imagem"
                    value={item.title}
                    onChangeText={(text) => {
                      setUploadQueue(prev => prev.map(i => 
                        i.id === item.id ? { ...i, title: text } : i
                      ));
                    }}
                  />
                  
                  <TextInput
                    style={[styles.uploadConfigInput, { height: 60 }]}
                    placeholder="Descrição (opcional)"
                    value={item.description}
                    onChangeText={(text) => {
                      setUploadQueue(prev => prev.map(i => 
                        i.id === item.id ? { ...i, description: text } : i
                      ));
                    }}
                    multiline
                  />
                  
                  <View style={styles.uploadConfigRow}>
                    <View style={styles.uploadConfigHalf}>
                      <Text style={styles.uploadConfigLabel}>Categoria</Text>
                      <View style={styles.uploadConfigSelect}>
                        {/* Simplified category picker */}
                        <Text style={styles.uploadConfigSelectText}>
                          {TOURNAMENT_CATEGORIES.find(c => c.name === item.category)?.displayName || 'Estilos'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.uploadConfigHalf}>
                      <Text style={styles.uploadConfigLabel}>Tags</Text>
                      <TextInput
                        style={styles.uploadConfigInput}
                        placeholder="moderno, casual"
                        value={item.tags}
                        onChangeText={(text) => {
                          setUploadQueue(prev => prev.map(i => 
                            i.id === item.id ? { ...i, tags: text } : i
                          ));
                        }}
                      />
                    </View>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.removeUploadItem}
                  onPress={() => {
                    setUploadQueue(prev => prev.filter(i => i.id !== item.id));
                  }}
                >
                  <Ionicons name="trash" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.startUploadButton}
              onPress={processUploadQueue}
              disabled={uploadQueue.length === 0}
            >
              <Text style={styles.startUploadButtonText}>
                Enviar {uploadQueue.length} Imagem(ns)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderBulkActionModal = () => (
    <Modal
      visible={bulkActionModalVisible}
      animationType="slide"
      transparent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bulkActionModal}>
          <Text style={styles.bulkActionTitle}>Ações em Lote</Text>
          <Text style={styles.bulkActionSubtitle}>
            {selectedImages.length} imagem(ns) selecionada(s)
          </Text>
          
          <View style={styles.bulkActionButtons}>
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#4ECDC4' }]}
              onPress={() => handleBulkAction('approve')}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.bulkActionButtonText}>Aprovar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#00D9FF' }]}
              onPress={() => handleBulkAction('activate')}
            >
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.bulkActionButtonText}>Ativar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#999' }]}
              onPress={() => handleBulkAction('deactivate')}
            >
              <Ionicons name="pause" size={20} color="#fff" />
              <Text style={styles.bulkActionButtonText}>Desativar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.bulkActionButton, { backgroundColor: '#FF6B6B' }]}
              onPress={() => handleBulkAction('delete')}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.bulkActionButtonText}>Deletar</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.bulkActionCancelButton}
            onPress={() => setBulkActionModalVisible(false)}
          >
            <Text style={styles.bulkActionCancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading && images.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.header}>
          <Text style={styles.headerTitle}>Painel de Administração</Text>
          <Text style={styles.headerSubtitle}>Sistema de Torneios</Text>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E74C3C" />
          <Text style={styles.loadingText}>Carregando painel...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Painel de Administração</Text>
          <Text style={styles.headerSubtitle}>Sistema de Torneios</Text>
        </View>
        
        <TouchableOpacity style={styles.headerNotificationButton}>
          <Ionicons name="notifications" size={24} color="#fff" />
          {stats.pendingApproval > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {stats.pendingApproval > 99 ? '99+' : stats.pendingApproval}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderTabButton('overview', 'Visão Geral', 'analytics')}
          {renderTabButton('images', 'Imagens', 'images')}
          {renderTabButton('upload', 'Upload', 'cloud-upload')}
          {renderTabButton('categories', 'Categorias', 'grid')}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'images' && renderImagesTab()}
      {activeTab === 'upload' && renderUploadTab()}
      {activeTab === 'categories' && renderCategoriesTab()}

      {/* Modals */}
      {renderUploadModal()}
      {renderBulkActionModal()}
    </SafeAreaView>
  );
};

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'ios' ? 15 : 35,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerNotificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E74C3C',
  },

  // Tab navigation styles
  tabNavigation: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
  },
  activeTabButton: {
    backgroundColor: '#E74C3C',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  activeTabButtonText: {
    color: '#fff',
  },

  // Tab content styles
  tabContent: {
    flex: 1,
  },

  // Stats styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 15,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    width: (width - 55) / 2,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },

  // Section styles
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20,
  },

  // Quick actions styles
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 15,
  },
  quickAction: {
    width: (width - 55) / 2,
    aspectRatio: 1.2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },

  // Category overview styles
  categoryOverviewItem: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  categoryOverviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  categoryOverviewCount: {
    fontSize: 14,
    color: '#666',
  },
  categoryOverviewProgress: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryOverviewProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryOverviewStats: {
    fontSize: 12,
    color: '#999',
  },

  // Filters styles
  filtersContainer: {
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activeFilterButton: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeFilterButtonText: {
    color: '#fff',
  },

  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
    color: '#333',
  },
  clearSearchButton: {
    padding: 5,
  },

  // Selection styles
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
  },
  selectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 10,
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  selectionActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Images grid styles
  imagesGrid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  imageRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  imageCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImageCard: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 2,
  },
  cardImage: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
  },
  statusBadges: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 15,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 12,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  cardAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: '#666',
  },

  // Empty state styles
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Upload tab styles
  uploadSection: {
    padding: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  uploadButton: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
    textAlign: 'center',
  },

  // Upload queue styles
  uploadQueue: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  uploadQueueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  uploadQueueItem: {
    width: 80,
    marginRight: 15,
  },
  uploadQueueImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadQueueItemTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  processUploadButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  processUploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Guidelines styles
  guidelines: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },

  // Categories grid styles
  categoriesGrid: {
    padding: 20,
    gap: 15,
  },
  categoryCard: {
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  categoryCardGradient: {
    padding: 20,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 15,
  },
  categoryCardDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  categoryCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCardStat: {
    alignItems: 'center',
  },
  categoryCardStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  categoryCardStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  categoryCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  categoryCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Upload modal styles
  uploadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  uploadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 30,
  },
  uploadProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  uploadProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
  },
  uploadProgressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },

  uploadConfigItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    position: 'relative',
  },
  uploadConfigImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  uploadConfigForm: {
    flex: 1,
  },
  uploadConfigInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  uploadConfigRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadConfigHalf: {
    flex: 1,
  },
  uploadConfigLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  uploadConfigSelect: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  uploadConfigSelectText: {
    fontSize: 14,
    color: '#333',
  },
  removeUploadItem: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  startUploadButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  startUploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Bulk action modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkActionModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    margin: 20,
    minWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  bulkActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  bulkActionSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  bulkActionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  bulkActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  bulkActionCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  bulkActionCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default AdminTournamentPanel;