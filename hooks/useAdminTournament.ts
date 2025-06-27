// hooks/useAdminTournament.ts - Hook personalizado para administração de torneios
import { useState, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuth } from './useAuth';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface AdminTournamentImage {
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

export interface AdminCategoryStats {
  id: string;
  name: string;
  displayName: string;
  total: number;
  approved: number;
  pending: number;
  active: number;
  inactive: number;
  averageWinRate: number;
  totalViews: number;
  recentUploads: number;
}

export interface AdminStats {
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
  averageSessionTime: number;
  topCategories: string[];
}

export interface UploadImageData {
  image: File | any;
  title: string;
  description?: string;
  category: string;
  tags: string[];
}

export interface BulkOperation {
  imageIds: number[];
  operation: 'approve' | 'reject' | 'activate' | 'deactivate' | 'delete';
}

export interface ImageFilters {
  category?: string;
  status?: 'all' | 'pending' | 'approved' | 'active' | 'inactive';
  search?: string;
  sortBy?: 'date' | 'title' | 'winRate' | 'views' | 'selections';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================================
// CUSTOM HOOK
// =====================================================

export const useAdminTournament = () => {
  const api = useApi();
  const { user } = useAuth();

  // Core states
  const [images, setImages] = useState<AdminTournamentImage[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, AdminCategoryStats>>({});
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // =====================================================
  // PERMISSION CHECKING
  // =====================================================

  const checkAdminPermissions = useCallback((): boolean => {
    if (!user?.isAdmin) {
      setError('Acesso negado: permissões de administrador necessárias');
      return false;
    }
    return true;
  }, [user]);

  // =====================================================
  // IMAGES MANAGEMENT
  // =====================================================

  const loadImages = useCallback(async (filters: ImageFilters = {}): Promise<void> => {
    if (!checkAdminPermissions()) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      
      params.append('page', (filters.page || currentPage).toString());
      params.append('limit', (filters.limit || 20).toString());

      const response = await api.get(`/tournament/admin/images?${params.toString()}`);
      
      if (response?.data) {
        setImages(response.data.images || []);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load images:', err);
      setError(err.response?.data?.message || 'Falha ao carregar imagens');
    } finally {
      setLoading(false);
    }
  }, [api, checkAdminPermissions, currentPage]);

  const uploadImage = useCallback(async (imageData: UploadImageData): Promise<boolean> => {
    if (!checkAdminPermissions()) return false;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', imageData.image);
      formData.append('title', imageData.title);
      formData.append('category', imageData.category);
      
      if (imageData.description) {
        formData.append('description', imageData.description);
      }
      
      if (imageData.tags && imageData.tags.length > 0) {
        formData.append('tags', JSON.stringify(imageData.tags));
      }

      const response = await api.post('/tournament/admin/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response?.data) {
        // Refresh images list
        await loadImages();
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Failed to upload image:', err);
      setError(err.response?.data?.message || 'Falha ao fazer upload da imagem');
      return false;
    } finally {
      setUploading(false);
    }
  }, [api, checkAdminPermissions, loadImages]);

  const uploadMultipleImages = useCallback(async (imagesData: UploadImageData[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> => {
    if (!checkAdminPermissions()) return { success: 0, failed: 0, errors: [] };

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    setUploading(true);
    setError(null);

    try {
      for (const imageData of imagesData) {
        try {
          const result = await uploadImage(imageData);
          if (result) {
            success++;
          } else {
            failed++;
            errors.push(`Falha ao enviar: ${imageData.title}`);
          }
        } catch (err: any) {
          failed++;
          errors.push(`Erro em ${imageData.title}: ${err.message}`);
        }
      }

      return { success, failed, errors };
    } finally {
      setUploading(false);
    }
  }, [uploadImage, checkAdminPermissions]);

  const approveImage = useCallback(async (imageId: number): Promise<boolean> => {
    if (!checkAdminPermissions()) return false;

    try {
      const response = await api.put(`/tournament/admin/images/${imageId}/approve`);
      
      if (response?.data) {
        // Update local state
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, approved: true, approvedAt: new Date().toISOString(), approvedBy: user?.id }
            : img
        ));
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Failed to approve image:', err);
      setError(err.response?.data?.message || 'Falha ao aprovar imagem');
      return false;
    }
  }, [api, checkAdminPermissions, user]);

  const rejectImage = useCallback(async (imageId: number): Promise<boolean> => {
    if (!checkAdminPermissions()) return false;

    try {
      const response = await api.put(`/tournament/admin/images/${imageId}/reject`);
      
      if (response?.data) {
        // Remove from local state or mark as rejected
        setImages(prev => prev.filter(img => img.id !== imageId));
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Failed to reject image:', err);
      setError(err.response?.data?.message || 'Falha ao rejeitar imagem');
      return false;
    }
  }, [api, checkAdminPermissions]);

  const deleteImage = useCallback(async (imageId: number): Promise<boolean> => {
    if (!checkAdminPermissions()) return false;

    try {
      const response = await api.delete(`/tournament/admin/images/${imageId}`);
      
      if (response?.data) {
        // Remove from local state
        setImages(prev => prev.filter(img => img.id !== imageId));
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Failed to delete image:', err);
      setError(err.response?.data?.message || 'Falha ao deletar imagem');
      return false;
    }
  }, [api, checkAdminPermissions]);

  const updateImage = useCallback(async (imageId: number, updates: Partial<AdminTournamentImage>): Promise<boolean> => {
    if (!checkAdminPermissions()) return false;

    try {
      const response = await api.put(`/tournament/admin/images/${imageId}`, updates);
      
      if (response?.data) {
        // Update local state
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        ));
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Failed to update image:', err);
      setError(err.response?.data?.message || 'Falha ao atualizar imagem');
      return false;
    }
  }, [api, checkAdminPermissions]);

  const toggleImageActive = useCallback(async (imageId: number, active: boolean): Promise<boolean> => {
    return updateImage(imageId, { active });
  }, [updateImage]);

  // =====================================================
  // BULK OPERATIONS
  // =====================================================

  const bulkApprove = useCallback(async (imageIds: number[]): Promise<{
    success: number;
    failed: number;
  }> => {
    if (!checkAdminPermissions()) return { success: 0, failed: 0 };

    try {
      setBulkLoading(true);
      setError(null);

      const response = await api.put('/tournament/admin/images/bulk-approve', { imageIds });
      
      if (response?.data) {
        const { success, failed } = response.data;
        
        // Update local state
        setImages(prev => prev.map(img => 
          imageIds.includes(img.id) 
            ? { ...img, approved: true, approvedAt: new Date().toISOString(), approvedBy: user?.id }
            : img
        ));

        return { success: success || imageIds.length, failed: failed || 0 };
      }

      return { success: 0, failed: imageIds.length };
    } catch (err: any) {
      console.error('Failed to bulk approve images:', err);
      setError(err.response?.data?.message || 'Falha na aprovação em lote');
      return { success: 0, failed: imageIds.length };
    } finally {
      setBulkLoading(false);
    }
  }, [api, checkAdminPermissions, user]);

  const bulkReject = useCallback(async (imageIds: number[]): Promise<{
    success: number;
    failed: number;
  }> => {
    if (!checkAdminPermissions()) return { success: 0, failed: 0 };

    try {
      setBulkLoading(true);
      setError(null);

      const response = await api.put('/tournament/admin/images/bulk-reject', { imageIds });
      
      if (response?.data) {
        const { success, failed } = response.data;
        
        // Remove from local state
        setImages(prev => prev.filter(img => !imageIds.includes(img.id)));

        return { success: success || imageIds.length, failed: failed || 0 };
      }

      return { success: 0, failed: imageIds.length };
    } catch (err: any) {
      console.error('Failed to bulk reject images:', err);
      setError(err.response?.data?.message || 'Falha na rejeição em lote');
      return { success: 0, failed: imageIds.length };
    } finally {
      setBulkLoading(false);
    }
  }, [api, checkAdminPermissions]);

  const bulkDelete = useCallback(async (imageIds: number[]): Promise<{
    success: number;
    failed: number;
  }> => {
    if (!checkAdminPermissions()) return { success: 0, failed: 0 };

    try {
      setBulkLoading(true);
      setError(null);

      const response = await api.delete('/tournament/admin/images/bulk-delete', {
        data: { imageIds }
      });
      
      if (response?.data) {
        const { success, failed } = response.data;
        
        // Remove from local state
        setImages(prev => prev.filter(img => !imageIds.includes(img.id)));

        return { success: success || imageIds.length, failed: failed || 0 };
      }

      return { success: 0, failed: imageIds.length };
    } catch (err: any) {
      console.error('Failed to bulk delete images:', err);
      setError(err.response?.data?.message || 'Falha na deleção em lote');
      return { success: 0, failed: imageIds.length };
    } finally {
      setBulkLoading(false);
    }
  }, [api, checkAdminPermissions]);

  const bulkToggleActive = useCallback(async (imageIds: number[], active: boolean): Promise<{
    success: number;
    failed: number;
  }> => {
    if (!checkAdminPermissions()) return { success: 0, failed: 0 };

    try {
      setBulkLoading(true);
      setError(null);

      const response = await api.put('/tournament/admin/images/bulk-toggle-active', { 
        imageIds, 
        active 
      });
      
      if (response?.data) {
        const { success, failed } = response.data;
        
        // Update local state
        setImages(prev => prev.map(img => 
          imageIds.includes(img.id) ? { ...img, active } : img
        ));

        return { success: success || imageIds.length, failed: failed || 0 };
      }

      return { success: 0, failed: imageIds.length };
    } catch (err: any) {
      console.error('Failed to bulk toggle active status:', err);
      setError(err.response?.data?.message || 'Falha na alteração em lote');
      return { success: 0, failed: imageIds.length };
    } finally {
      setBulkLoading(false);
    }
  }, [api, checkAdminPermissions]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const loadAdminStats = useCallback(async (): Promise<void> => {
    if (!checkAdminPermissions()) return;

    try {
      const response = await api.get('/tournament/admin/stats');
      
      if (response?.data) {
        setAdminStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
      setError(err.response?.data?.message || 'Falha ao carregar estatísticas');
    }
  }, [api, checkAdminPermissions]);

  const loadCategoryStats = useCallback(async (): Promise<void> => {
    if (!checkAdminPermissions()) return;

    try {
      const response = await api.get('/tournament/admin/categories/stats');
      
      if (response?.data) {
        setCategoryStats(response.data);
      }
    } catch (err: any) {
      console.error('Failed to load category stats:', err);
      setError(err.response?.data?.message || 'Falha ao carregar estatísticas de categorias');
    }
  }, [api, checkAdminPermissions]);

  // =====================================================
  // UTILITY FUNCTIONS
  // =====================================================

  const getImageById = useCallback((imageId: number): AdminTournamentImage | null => {
    return images.find(img => img.id === imageId) || null;
  }, [images]);

  const getImagesByCategory = useCallback((category: string): AdminTournamentImage[] => {
    return images.filter(img => img.category === category);
  }, [images]);

  const getPendingImages = useCallback((): AdminTournamentImage[] => {
    return images.filter(img => !img.approved);
  }, [images]);

  const getApprovedImages = useCallback((): AdminTournamentImage[] => {
    return images.filter(img => img.approved);
  }, [images]);

  const getActiveImages = useCallback((): AdminTournamentImage[] => {
    return images.filter(img => img.active && img.approved);
  }, [images]);

  const getTopPerformingImages = useCallback((limit: number = 10): AdminTournamentImage[] => {
    return [...images]
      .filter(img => img.approved && img.totalSelections > 0)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, limit);
  }, [images]);

  const searchImages = useCallback((query: string): AdminTournamentImage[] => {
    const lowercaseQuery = query.toLowerCase();
    return images.filter(img => 
      img.title.toLowerCase().includes(lowercaseQuery) ||
      img.description?.toLowerCase().includes(lowercaseQuery) ||
      img.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      img.category.toLowerCase().includes(lowercaseQuery)
    );
  }, [images]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setTotalPages(1);
    setTotalItems(0);
  }, []);

  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================

  return {
    // Data
    images,
    categoryStats,
    adminStats,

    // Loading states
    loading,
    uploading,
    bulkLoading,

    // Error state
    error,

    // Pagination
    currentPage,
    totalPages,
    totalItems,

    // Core functions
    loadImages,
    uploadImage,
    uploadMultipleImages,
    approveImage,
    rejectImage,
    deleteImage,
    updateImage,
    toggleImageActive,

    // Bulk operations
    bulkApprove,
    bulkReject,
    bulkDelete,
    bulkToggleActive,

    // Statistics
    loadAdminStats,
    loadCategoryStats,

    // Utility functions
    getImageById,
    getImagesByCategory,
    getPendingImages,
    getApprovedImages,
    getActiveImages,
    getTopPerformingImages,
    searchImages,

    // State management
    clearError,
    resetPagination,

    // Permission checking
    checkAdminPermissions,

    // Computed values
    isAdmin: user?.isAdmin || false,
    totalImagesCount: images.length,
    pendingCount: getPendingImages().length,
    approvedCount: getApprovedImages().length,
    activeCount: getActiveImages().length,
    hasImages: images.length > 0,
    hasPendingImages: getPendingImages().length > 0,
  };
};

export default useAdminTournament;