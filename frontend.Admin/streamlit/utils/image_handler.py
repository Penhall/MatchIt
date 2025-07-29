# utils/image_handler.py - Processamento e gerenciamento de imagens
import os
import uuid
from PIL import Image, ImageOps
import streamlit as st
from typing import Dict, List, Optional, Tuple, Union
import logging
import hashlib
from datetime import datetime
import sys

# Adicionar o diretório parent ao path para importar config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import UPLOAD_CONFIG, TOURNAMENT_IMAGES_PATH, THUMBNAILS_PATH, TOURNAMENT_CATEGORIES

logger = logging.getLogger(__name__)

class ImageHandler:
    """Gerenciador de upload, processamento e validação de imagens"""
    
    def __init__(self):
        self.max_file_size = UPLOAD_CONFIG['max_file_size']
        self.allowed_extensions = UPLOAD_CONFIG['allowed_extensions']
        self.dimensions = UPLOAD_CONFIG['image_dimensions']
        self.thumbnail_size = UPLOAD_CONFIG['thumbnail_size']
        self.quality = UPLOAD_CONFIG['quality']
        
        # Garantir que diretórios existem
        os.makedirs(TOURNAMENT_IMAGES_PATH, exist_ok=True)
        os.makedirs(THUMBNAILS_PATH, exist_ok=True)
    
    def validate_file(self, uploaded_file) -> Tuple[bool, str]:
        """
        Valida arquivo enviado
        
        Args:
            uploaded_file: Arquivo enviado via Streamlit file_uploader
            
        Returns:
            Tuple (é_válido, mensagem_erro)
        """
        if not uploaded_file:
            return False, "Nenhum arquivo selecionado"
        
        # Verificar tamanho
        if uploaded_file.size > self.max_file_size:
            size_mb = self.max_file_size / (1024 * 1024)
            return False, f"Arquivo muito grande. Máximo: {size_mb:.1f}MB"
        
        # Verificar extensão
        file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        if file_extension not in self.allowed_extensions:
            return False, f"Formato não suportado. Use: {', '.join(self.allowed_extensions)}"
        
        # Validar se é uma imagem válida
        try:
            uploaded_file.seek(0)
            with Image.open(uploaded_file) as img:
                # Verificar dimensões mínimas
                width, height = img.size
                if width < self.dimensions['min_width'] or height < self.dimensions['min_height']:
                    return False, f"Imagem muito pequena. Mínimo: {self.dimensions['min_width']}x{self.dimensions['min_height']}px"
                
                # Verificar dimensões máximas
                if width > self.dimensions['max_width'] or height > self.dimensions['max_height']:
                    return False, f"Imagem muito grande. Máximo: {self.dimensions['max_width']}x{self.dimensions['max_height']}px"
                
        except Exception as e:
            return False, f"Arquivo de imagem inválido: {str(e)}"
        
        finally:
            uploaded_file.seek(0)
        
        return True, "Arquivo válido"
    
    def generate_filename(self, original_filename: str, category: str) -> str:
        """
        Gera nome único para o arquivo
        
        Args:
            original_filename: Nome original do arquivo
            category: Categoria da imagem
            
        Returns:
            Nome único do arquivo
        """
        file_extension = os.path.splitext(original_filename)[1].lower()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        
        return f"{category}_{timestamp}_{unique_id}{file_extension}"
    
    def process_image(self, uploaded_file, category: str, optimize: bool = True) -> Dict:
        """
        Processa imagem: redimensiona, otimiza e gera thumbnail
        
        Args:
            uploaded_file: Arquivo enviado
            category: Categoria da imagem
            optimize: Se deve otimizar a imagem
            
        Returns:
            Dict com informações do processamento
        """
        try:
            # Gerar nome único
            filename = self.generate_filename(uploaded_file.name, category)
            
            # Caminhos dos arquivos
            image_path = os.path.join(TOURNAMENT_IMAGES_PATH, filename)
            thumbnail_filename = f"thumb_{filename}"
            thumbnail_path = os.path.join(THUMBNAILS_PATH, thumbnail_filename)
            
            # Processar imagem principal
            uploaded_file.seek(0)
            with Image.open(uploaded_file) as img:
                # Converter para RGB se necessário (para PNG com transparência)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Criar fundo branco
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Corrigir orientação baseada em EXIF
                img = ImageOps.exif_transpose(img)
                
                # Obter dimensões originais
                original_width, original_height = img.size
                
                # Otimizar tamanho se necessário
                if optimize and (original_width > 1024 or original_height > 1024):
                    img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                
                # Salvar imagem principal
                img.save(image_path, 'JPEG', quality=self.quality, optimize=True)
                
                # Gerar thumbnail
                img_thumb = img.copy()
                img_thumb.thumbnail(self.thumbnail_size, Image.Resampling.LANCZOS)
                img_thumb.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
                
                # Obter informações finais do arquivo
                final_width, final_height = img.size
                file_size = os.path.getsize(image_path)
                
                return {
                    'success': True,
                    'filename': filename,
                    'image_path': image_path,
                    'thumbnail_path': thumbnail_path,
                    'image_url': f'/uploads/tournament-images/{filename}',
                    'thumbnail_url': f'/uploads/tournament-images/thumbnails/{thumbnail_filename}',
                    'original_filename': uploaded_file.name,
                    'file_size': file_size,
                    'image_width': final_width,
                    'image_height': final_height,
                    'mime_type': 'image/jpeg',
                    'original_dimensions': (original_width, original_height),
                    'processed_at': datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Erro ao processar imagem: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_image_files(self, image_url: str, thumbnail_url: str = None) -> bool:
        """
        Remove arquivos de imagem do sistema
        
        Args:
            image_url: URL da imagem principal
            thumbnail_url: URL do thumbnail (opcional)
            
        Returns:
            True se removido com sucesso
        """
        try:
            # Extrair nome do arquivo da URL
            if image_url.startswith('/uploads/tournament-images/'):
                filename = os.path.basename(image_url)
                image_path = os.path.join(TOURNAMENT_IMAGES_PATH, filename)
                
                # Remover imagem principal
                if os.path.exists(image_path):
                    os.remove(image_path)
                    logger.info(f"Imagem removida: {image_path}")
            
            # Remover thumbnail se especificado
            if thumbnail_url:
                if thumbnail_url.startswith('/uploads/tournament-images/thumbnails/'):
                    thumb_filename = os.path.basename(thumbnail_url)
                    thumb_path = os.path.join(THUMBNAILS_PATH, thumb_filename)
                    
                    if os.path.exists(thumb_path):
                        os.remove(thumb_path)
                        logger.info(f"Thumbnail removido: {thumb_path}")
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao remover arquivos de imagem: {e}")
            return False
    
    def get_image_info(self, image_path: str) -> Optional[Dict]:
        """
        Obtém informações de uma imagem existente
        
        Args:
            image_path: Caminho para a imagem
            
        Returns:
            Dict com informações da imagem ou None
        """
        try:
            if not os.path.exists(image_path):
                return None
            
            with Image.open(image_path) as img:
                width, height = img.size
                file_size = os.path.getsize(image_path)
                
                return {
                    'width': width,
                    'height': height,
                    'file_size': file_size,
                    'format': img.format,
                    'mode': img.mode
                }
                
        except Exception as e:
            logger.error(f"Erro ao obter informações da imagem: {e}")
            return None
    
    def create_image_grid(self, images: List[Dict], columns: int = 4) -> None:
        """
        Cria um grid de imagens no Streamlit
        
        Args:
            images: Lista de dicionários com dados das imagens
            columns: Número de colunas no grid
        """
        if not images:
            st.info("📷 Nenhuma imagem encontrada")
            return
        
        # Criar colunas
        cols = st.columns(columns)
        
        for idx, image in enumerate(images):
            col = cols[idx % columns]
            
            with col:
                # Exibir imagem ou placeholder
                if image.get('thumbnail_url'):
                    # Construir caminho local para o thumbnail
                    thumbnail_filename = os.path.basename(image['thumbnail_url'])
                    thumbnail_path = os.path.join(THUMBNAILS_PATH, thumbnail_filename)
                    
                    if os.path.exists(thumbnail_path):
                        st.image(thumbnail_path, use_column_width=True)
                    else:
                        st.info("🖼️ Imagem não encontrada")
                else:
                    st.info("🖼️ Sem preview")
                
                # Informações da imagem
                st.write(f"**{image.get('title', 'Sem título')}**")
                
                # Categoria com cor
                category = image.get('category', '')
                if category in TOURNAMENT_CATEGORIES:
                    cat_info = TOURNAMENT_CATEGORIES[category]
                    st.markdown(f"🏷️ {cat_info['icon']} {cat_info['display_name']}")
                
                # Status
                if image.get('approved'):
                    st.success("✅ Aprovada")
                else:
                    st.warning("⏳ Pendente")
                
                if not image.get('active'):
                    st.error("❌ Inativa")
                
                # Estatísticas
                views = image.get('total_views', 0)
                selections = image.get('total_selections', 0)
                win_rate = image.get('win_rate', 0)
                
                st.caption(f"👁️ {views} | 🎯 {selections} | 🏆 {win_rate:.1f}%")

def show_image_upload_form(category: str = None) -> Optional[Dict]:
    """
    Exibe formulário de upload de imagem
    
    Args:
        category: Categoria pré-selecionada
        
    Returns:
        Dict com dados da imagem processada ou None
    """
    handler = ImageHandler()
    
    st.markdown("### 📤 Upload de Nova Imagem")
    
    with st.form("image_upload_form"):
        # Seleção de categoria 
        if category:
            selected_category = category
            st.info(f"Categoria selecionada: {TOURNAMENT_CATEGORIES[category]['display_name']}")
        else:
            category_options = {
                cat_data['display_name']: cat_key 
                for cat_key, cat_data in TOURNAMENT_CATEGORIES.items()
            }
            selected_display = st.selectbox("🏷️ Categoria", options=list(category_options.keys()))
            selected_category = category_options[selected_display]
        
        # Upload do arquivo
        uploaded_file = st.file_uploader(
            "📁 Selecione a imagem",
            type=['jpg', 'jpeg', 'png', 'webp'],
            help=f"Formatos: JPG, PNG, WebP | Máximo: {UPLOAD_CONFIG['max_file_size'] / (1024*1024):.1f}MB"
        )
        
        # Metadados
        col1, col2 = st.columns(2)
        with col1:
            title = st.text_input("📝 Título", placeholder="Título descritivo da imagem")
        with col2:
            description = st.text_area("📄 Descrição", placeholder="Descrição detalhada...")
        
        # Tags
        tags_input = st.text_input("🏷️ Tags", placeholder="tag1, tag2, tag3")
        tags = [tag.strip() for tag in tags_input.split(',') if tag.strip()] if tags_input else []
        
        # Opções
        col1, col2 = st.columns(2)
        with col1:
            active = st.checkbox("✅ Ativar imagem", value=True)
        with col2:
            approved = st.checkbox("🔒 Aprovar automaticamente", value=False)
        
        # Botão de upload
        submit = st.form_submit_button("🚀 Fazer Upload", use_container_width=True)
        
        if submit:
            if not uploaded_file:
                st.error("❌ Por favor, selecione uma imagem")
                return None
            
            # Validar arquivo
            is_valid, error_msg = handler.validate_file(uploaded_file)
            if not is_valid:
                st.error(f"❌ {error_msg}")
                return None
            
            # Progress bar
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            status_text.text("📤 Fazendo upload...")
            progress_bar.progress(25)
            
            # Processar imagem
            status_text.text("🔄 Processando imagem...")
            progress_bar.progress(50)
            
            result = handler.process_image(uploaded_file, selected_category)
            
            if result['success']:
                progress_bar.progress(75)
                status_text.text("💾 Salvando dados...")
                
                # Montar dados para inserção no banco
                image_data = {
                    'category': selected_category,
                    'image_url': result['image_url'],
                    'thumbnail_url': result['thumbnail_url'],
                    'title': title or result['original_filename'],
                    'description': description,
                    'tags': tags,
                    'active': active,
                    'approved': approved,
                    'file_size': result['file_size'],
                    'image_width': result['image_width'],
                    'image_height': result['image_height'],
                    'mime_type': result['mime_type'],
                    'created_by': 1  # TODO: pegar do usuário logado
                }
                
                progress_bar.progress(100)
                status_text.text("✅ Upload concluído!")
                
                st.success(f"🎉 Imagem '{title or result['original_filename']}' enviada com sucesso!")
                
                # Exibir preview
                if os.path.exists(result['thumbnail_path']):
                    st.image(result['thumbnail_path'], caption="Preview da imagem", width=200)
                
                return image_data
            else:
                st.error(f"❌ Erro no processamento: {result['error']}")
                return None

# Função utilitária para validação de dimensões
def validate_image_dimensions(image_path: str) -> Tuple[bool, str, Tuple[int, int]]:
    """
    Valida dimensões de uma imagem
    
    Args:
        image_path: Caminho para a imagem
        
    Returns:
        Tuple (válida, mensagem, dimensões)
    """
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            
            min_w = UPLOAD_CONFIG['image_dimensions']['min_width']
            min_h = UPLOAD_CONFIG['image_dimensions']['min_height']
            max_w = UPLOAD_CONFIG['image_dimensions']['max_width']
            max_h = UPLOAD_CONFIG['image_dimensions']['max_height']
            
            if width < min_w or height < min_h:
                return False, f"Muito pequena (mín: {min_w}x{min_h})", (width, height)
            
            if width > max_w or height > max_h:
                return False, f"Muito grande (máx: {max_w}x{max_h})", (width, height)
            
            return True, "Dimensões válidas", (width, height)
            
    except Exception as e:
        return False, f"Erro ao validar: {str(e)}", (0, 0)