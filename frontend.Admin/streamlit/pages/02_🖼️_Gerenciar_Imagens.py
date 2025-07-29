# pages/02_🖼️_Gerenciar_Imagens.py - Página de gerenciamento CRUD de imagens
import streamlit as st
import pandas as pd
import os
import sys
from datetime import datetime

# Configurar path para imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.auth import require_auth, can_write, can_delete, get_current_user_data
from utils.database import get_db_manager
from utils.image_handler import show_image_upload_form, ImageHandler
from utils.helpers import (
    create_filter_sidebar, show_pagination, format_date, format_file_size,
    show_bulk_actions, show_confirmation_dialog, truncate_text, get_category_display_info
)
from config import TOURNAMENT_CATEGORIES

# =====================================================
# CONFIGURAÇÃO DA PÁGINA
# =====================================================

st.set_page_config(
    page_title="Gerenciar Imagens - MatchIt Admin",
    page_icon="🖼️",
    layout="wide"
)

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

@require_auth(['read'])
def main():
    """Função principal da página de gerenciamento de imagens"""
    
    st.markdown("# 🖼️ Gerenciamento de Imagens")
    st.markdown("---")
    
    # Inicializar session state
    if 'selected_images' not in st.session_state:
        st.session_state.selected_images = []
    
    if 'current_view' not in st.session_state:
        st.session_state.current_view = 'list'
    
    # Tabs principais
    tab1, tab2, tab3 = st.tabs(["📋 Listar Imagens", "📤 Upload", "🔧 Ações em Lote"])
    
    with tab1:
        show_images_list()
    
    with tab2:
        if can_write():
            show_upload_section()
        else:
            st.error("❌ Você não tem permissão para fazer upload de imagens")
    
    with tab3:
        if can_write():
            show_bulk_actions_section()
        else:
            st.error("❌ Você não tem permissão para ações em lote")

def show_images_list():
    """Exibe lista de imagens com filtros e paginação"""
    
    try:
        # Filtros na sidebar
        filters = create_filter_sidebar()
        
        # Buscar imagens com filtros
        db = get_db_manager()
        
        # Parâmetros da consulta
        query_params = {
            'category': filters['category'],
            'active_only': filters['active_only'],
            'approved_only': filters['approved_only'],
            'search_term': filters['search_term'],
            'limit': 100,  # Buscar mais para paginação local
            'offset': 0
        }
        
        images = db.get_tournament_images(**query_params)
        
        if not images:
            st.info("📷 Nenhuma imagem encontrada com os filtros aplicados")
            return
        
        # Aplicar filtros de data localmente
        if filters['date_filter'] != 'Todos':
            images = apply_date_filter(images, filters)
        
        # Header da lista
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            st.markdown(f"### 📊 **{len(images)}** imagens encontradas")
        
        with col2:
            view_mode = st.selectbox(
                "👁️ Visualização",
                options=['list', 'grid', 'table'],
                format_func=lambda x: {'list': '📋 Lista', 'grid': '🔲 Grid', 'table': '📄 Tabela'}[x],
                key='view_mode'
            )
        
        with col3:
            sort_by = st.selectbox(
                "📊 Ordenar por",
                options=['upload_date', 'title', 'category', 'win_rate', 'total_views'],
                format_func=lambda x: {
                    'upload_date': '📅 Data',
                    'title': '📝 Título', 
                    'category': '🏷️ Categoria',
                    'win_rate': '🏆 Win Rate',
                    'total_views': '👁️ Views'
                }[x],
                key='sort_by'
            )
        
        # Ordenar imagens
        images = sort_images(images, sort_by)
        
        # Paginação
        offset, limit = show_pagination(len(images))
        paginated_images = images[offset:offset + limit]
        
        # Exibir imagens conforme o modo selecionado
        if view_mode == 'grid':
            show_images_grid(paginated_images)
        elif view_mode == 'table':
            show_images_table(paginated_images)
        else:
            show_images_list_view(paginated_images)
            
    except Exception as e:
        st.error(f"❌ Erro ao carregar imagens: {str(e)}")
        st.exception(e)

def show_images_grid(images):
    """Exibe imagens em formato grid"""
    
    cols_per_row = 4
    
    for i in range(0, len(images), cols_per_row):
        cols = st.columns(cols_per_row)
        
        for j, col in enumerate(cols):
            if i + j < len(images):
                image = images[i + j]
                
                with col:
                    show_image_card(image)

def show_image_card(image):
    """Exibe card individual de imagem"""
    
    with st.container():
        # Checkbox para seleção
        selected = st.checkbox(
            "Selecionar",
            key=f"select_{image['id']}",
            value=image['id'] in st.session_state.selected_images
        )
        
        if selected and image['id'] not in st.session_state.selected_images:
            st.session_state.selected_images.append(image['id'])
        elif not selected and image['id'] in st.session_state.selected_images:
            st.session_state.selected_images.remove(image['id'])
        
        # Preview da imagem
        if image.get('thumbnail_url'):
            # Tentar carregar thumbnail local
            from config import THUMBNAILS_PATH
            thumbnail_filename = os.path.basename(image['thumbnail_url'])
            thumbnail_path = os.path.join(THUMBNAILS_PATH, thumbnail_filename)
            
            if os.path.exists(thumbnail_path):
                st.image(thumbnail_path, use_column_width=True)
            else:
                st.info("🖼️ Preview indisponível")
        else:
            st.info("🖼️ Sem thumbnail")
        
        # Título e categoria
        title = truncate_text(image.get('title', 'Sem título'), 30)
        st.markdown(f"**{title}**")
        
        # Categoria
        category = image.get('category', '')
        if category in TOURNAMENT_CATEGORIES:
            cat_info = TOURNAMENT_CATEGORIES[category]
            st.markdown(f"🏷️ {cat_info['icon']} {cat_info['display_name']}")
        
        # Status badges
        col1, col2 = st.columns(2)
        with col1:
            if image.get('approved'):
                st.success("✅ Aprovada")
            else:
                st.warning("⏳ Pendente")
        
        with col2:
            if image.get('active'):
                st.success("🟢 Ativa")
            else:
                st.error("🔴 Inativa")
        
        # Estatísticas
        st.caption(f"👁️ {image.get('total_views', 0)} | 🎯 {image.get('total_selections', 0)} | 🏆 {image.get('win_rate', 0):.1f}%")
        
        # Botão de edição
        if st.button("✏️ Editar", key=f"edit_{image['id']}", use_container_width=True):
            show_edit_image_modal(image)

def show_images_list_view(images):
    """Exibe imagens em formato de lista"""
    
    for image in images:
        with st.container():
            col1, col2, col3, col4, col5 = st.columns([1, 3, 2, 2, 2])
            
            # Seleção
            with col1:
                selected = st.checkbox(
                    "",
                    key=f"list_select_{image['id']}",
                    value=image['id'] in st.session_state.selected_images
                )
                
                if selected and image['id'] not in st.session_state.selected_images:
                    st.session_state.selected_images.append(image['id'])
                elif not selected and image['id'] in st.session_state.selected_images:
                    st.session_state.selected_images.remove(image['id'])
            
            # Informações principais
            with col2:
                title = image.get('title', 'Sem título')
                st.markdown(f"**{title}**")
                
                category = image.get('category', '')
                if category in TOURNAMENT_CATEGORIES:
                    cat_info = TOURNAMENT_CATEGORIES[category]
                    st.caption(f"{cat_info['icon']} {cat_info['display_name']}")
                
                st.caption(f"📅 {format_date(image.get('upload_date'))}")
            
            # Status
            with col3:
                if image.get('approved'):
                    st.markdown("✅ **Aprovada**")
                else:
                    st.markdown("⏳ **Pendente**")
                
                if not image.get('active'):
                    st.markdown("🔴 **Inativa**")
            
            # Estatísticas
            with col4:
                st.metric("Views", image.get('total_views', 0))
                st.metric("Seleções", image.get('total_selections', 0))
            
            # Ações
            with col5:
                if st.button("✏️ Editar", key=f"list_edit_{image['id']}"):
                    show_edit_image_modal(image)
                
                if can_delete():
                    if st.button("🗑️ Excluir", key=f"list_delete_{image['id']}"):
                        delete_image(image)
        
        st.markdown("---")

def show_images_table(images):
    """Exibe imagens em formato de tabela"""
    
    if not images:
        return
    
    # Preparar dados para DataFrame
    table_data = []
    
    for image in images:
        category_info = get_category_display_info(image.get('category', ''))
        
        table_data.append({
            'ID': image.get('id'),
            'Título': truncate_text(image.get('title', 'Sem título'), 40),
            'Categoria': f"{category_info['icon']} {category_info['display_name']}",
            'Status': '✅ Aprovada' if image.get('approved') else '⏳ Pendente',
            'Ativa': '🟢 Sim' if image.get('active') else '🔴 Não',
            'Views': image.get('total_views', 0),
            'Seleções': image.get('total_selections', 0),
            'Win Rate': f"{image.get('win_rate', 0):.1f}%",
            'Upload': format_date(image.get('upload_date')),
            'Tamanho': format_file_size(image.get('file_size', 0))
        })
    
    # Exibir tabela
    df = pd.DataFrame(table_data)
    
    # Usar data_editor para permitir seleção
    edited_df = st.data_editor(
        df,
        use_container_width=True,
        hide_index=True,
        column_config={
            "ID": st.column_config.NumberColumn("ID", width=80),
            "Título": st.column_config.TextColumn("Título", width=200),
            "Categoria": st.column_config.TextColumn("Categoria", width=150),
            "Views": st.column_config.NumberColumn("Views", width=80),
            "Seleções": st.column_config.NumberColumn("Seleções", width=80),
        },
        disabled=list(df.columns)  # Tornar tabela somente leitura
    )

def show_edit_image_modal(image):
    """Exibe modal de edição de imagem"""
    
    st.markdown("---")
    st.markdown(f"### ✏️ Editar Imagem: {image.get('title', 'Sem título')}")
    
    with st.form(f"edit_form_{image['id']}"):
        col1, col2 = st.columns([1, 2])
        
        with col1:
            # Preview da imagem
            if image.get('thumbnail_url'):
                from config import THUMBNAILS_PATH
                thumbnail_filename = os.path.basename(image['thumbnail_url'])
                thumbnail_path = os.path.join(THUMBNAILS_PATH, thumbnail_filename)
                
                if os.path.exists(thumbnail_path):
                    st.image(thumbnail_path, caption="Preview atual", width=200)
        
        with col2:
            # Campos de edição
            new_title = st.text_input("📝 Título", value=image.get('title', ''))
            new_description = st.text_area("📄 Descrição", value=image.get('description', ''))
            
            # Tags
            current_tags = image.get('tags', [])
            tags_str = ', '.join(current_tags) if current_tags else ''
            new_tags_str = st.text_input("🏷️ Tags (separadas por vírgula)", value=tags_str)
            new_tags = [tag.strip() for tag in new_tags_str.split(',') if tag.strip()]
            
            # Categoria
            current_category = image.get('category', '')
            category_options = list(TOURNAMENT_CATEGORIES.keys())
            current_index = category_options.index(current_category) if current_category in category_options else 0
            
            new_category = st.selectbox(
                "🏷️ Categoria",
                options=category_options,
                index=current_index,
                format_func=lambda x: f"{TOURNAMENT_CATEGORIES[x]['icon']} {TOURNAMENT_CATEGORIES[x]['display_name']}"
            )
            
            # Status
            col_a, col_b = st.columns(2)
            with col_a:
                new_active = st.checkbox("✅ Ativa", value=image.get('active', True))
            with col_b:
                new_approved = st.checkbox("🔒 Aprovada", value=image.get('approved', False))
        
        # Botões de ação
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.form_submit_button("💾 Salvar Alterações", use_container_width=True):
                update_image(image['id'], {
                    'title': new_title,
                    'description': new_description,
                    'tags': new_tags,
                    'category': new_category,
                    'active': new_active,
                    'approved': new_approved,
                    'approved_by': get_current_user_data().get('username') if new_approved else None
                })
        
        with col2:
            if st.form_submit_button("🚫 Cancelar", use_container_width=True):
                st.rerun()
        
        with col3:
            if can_delete() and st.form_submit_button("🗑️ Excluir", use_container_width=True):
                delete_image(image)

def show_upload_section():
    """Exibe seção de upload de imagens"""
    
    st.markdown("### 📤 Upload de Nova Imagem")
    
    # Formulário de upload
    uploaded_image_data = show_image_upload_form()
    
    if uploaded_image_data:
        # Inserir no banco de dados
        db = get_db_manager()
        image_id = db.insert_tournament_image(uploaded_image_data)
        
        if image_id:
            st.success(f"🎉 Imagem inserida com sucesso! ID: {image_id}")
            
            # Limpar cache e recarregar
            if st.button("🔄 Recarregar Lista"):
                st.rerun()
        else:
            st.error("❌ Erro ao inserir imagem no banco de dados")

def show_bulk_actions_section():
    """Exibe seção de ações em lote"""
    
    st.markdown("### 🔧 Ações em Lote")
    
    if not st.session_state.selected_images:
        st.info("📝 Selecione imagens na aba 'Listar Imagens' para realizar ações em lote")
        return
    
    selected_count = len(st.session_state.selected_images)
    st.success(f"✅ {selected_count} imagem(ns) selecionada(s)")
    
    # Mostrar IDs selecionados
    with st.expander("📋 Imagens Selecionadas"):
        st.write(st.session_state.selected_images)
    
    # Ações disponíveis
    available_actions = ['approve', 'reject', 'activate', 'deactivate']
    if can_delete():
        available_actions.append('delete')
    
    selected_action = show_bulk_actions(st.session_state.selected_images, available_actions)
    
    if selected_action:
        execute_bulk_action(selected_action, st.session_state.selected_images)

# =====================================================
# FUNÇÕES AUXILIARES
# =====================================================

def apply_date_filter(images, filters):
    """Aplica filtro de data nas imagens"""
    
    if filters['date_filter'] == 'Todos':
        return images
    
    now = datetime.now()
    
    if filters['date_filter'] == 'Última semana':
        cutoff = now - pd.Timedelta(days=7)
    elif filters['date_filter'] == 'Último mês':
        cutoff = now - pd.Timedelta(days=30)
    elif filters['date_filter'] == 'Últimos 3 meses':
        cutoff = now - pd.Timedelta(days=90)
    elif filters['date_filter'] == 'Personalizado' and filters['custom_dates']:
        start_date, end_date = filters['custom_dates']
        # Filtrar por intervalo personalizado
        filtered = []
        for img in images:
            upload_date = pd.to_datetime(img.get('upload_date'))
            if start_date <= upload_date.date() <= end_date:
                filtered.append(img)
        return filtered
    else:
        return images
    
    # Filtrar por data de corte
    filtered = []
    for img in images:
        upload_date = pd.to_datetime(img.get('upload_date'))
        if upload_date >= cutoff:
            filtered.append(img)
    
    return filtered

def sort_images(images, sort_by):
    """Ordena lista de imagens"""
    
    reverse = True  # Ordem decrescente por padrão
    
    if sort_by == 'title':
        reverse = False
        key_func = lambda x: x.get('title', '').lower()
    elif sort_by == 'category':
        reverse = False
        key_func = lambda x: x.get('category', '')
    elif sort_by == 'win_rate':
        key_func = lambda x: x.get('win_rate', 0)
    elif sort_by == 'total_views':
        key_func = lambda x: x.get('total_views', 0)
    else:  # upload_date
        key_func = lambda x: x.get('upload_date', '')
    
    return sorted(images, key=key_func, reverse=reverse)

def update_image(image_id, updates):
    """Atualiza dados de uma imagem"""
    
    try:
        db = get_db_manager()
        success = db.update_tournament_image(image_id, updates)
        
        if success:
            st.success("✅ Imagem atualizada com sucesso!")
            st.rerun()
        else:
            st.error("❌ Erro ao atualizar imagem")
            
    except Exception as e:
        st.error(f"❌ Erro ao atualizar: {str(e)}")

def delete_image(image):
    """Exclui uma imagem"""
    
    if show_confirmation_dialog(
        "Confirmar Exclusão",
        f"Tem certeza que deseja excluir a imagem '{image.get('title', 'Sem título')}'?",
        f"delete_{image['id']}"
    ):
        try:
            db = get_db_manager()
            handler = ImageHandler()
            
            # Remover arquivos físicos
            handler.delete_image_files(
                image.get('image_url', ''),
                image.get('thumbnail_url', '')
            )
            
            # Remover do banco (soft delete)
            success = db.delete_tournament_image(image['id'], soft_delete=True)
            
            if success:
                st.success("✅ Imagem excluída com sucesso!")
                st.rerun()
            else:
                st.error("❌ Erro ao excluir imagem")
                
        except Exception as e:
            st.error(f"❌ Erro ao excluir: {str(e)}")

def execute_bulk_action(action, image_ids):
    """Executa ação em lote nas imagens selecionadas"""
    
    try:
        db = get_db_manager()
        current_user = get_current_user_data()
        user_id = current_user.get('username', 'admin') if current_user else 'admin'
        
        if action == 'approve':
            success = db.bulk_update_approval(image_ids, True, user_id)
            message = "aprovadas"
        elif action == 'reject':
            success = db.bulk_update_approval(image_ids, False, user_id)
            message = "rejeitadas"
        elif action in ['activate', 'deactivate']:
            # Implementar update em lote para ativo/inativo
            active_status = action == 'activate'
            # Por enquanto, usar loop (pode ser otimizado)
            success = True
            for img_id in image_ids:
                if not db.update_tournament_image(img_id, {'active': active_status}):
                    success = False
                    break
            message = "ativadas" if active_status else "desativadas"
        elif action == 'delete':
            # Implementar exclusão em lote
            success = True
            for img_id in image_ids:
                if not db.delete_tournament_image(img_id, soft_delete=True):
                    success = False
                    break
            message = "excluídas"
        else:
            st.error(f"❌ Ação '{action}' não implementada")
            return
        
        if success:
            st.success(f"✅ {len(image_ids)} imagens {message} com sucesso!")
            st.session_state.selected_images = []  # Limpar seleção
            st.rerun()
        else:
            st.error(f"❌ Erro ao executar ação em lote")
            
    except Exception as e:
        st.error(f"❌ Erro na ação em lote: {str(e)}")

# =====================================================
# EXECUÇÃO DA PÁGINA
# =====================================================

if __name__ == "__main__":
    main()