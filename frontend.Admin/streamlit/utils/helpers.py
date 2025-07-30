# utils/helpers.py - Funções auxiliares e utilitários
import streamlit as st
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import logging
import sys
import os

# Adicionar o diretório parent ao path para importar config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import TOURNAMENT_CATEGORIES, PAGINATION_CONFIG

logger = logging.getLogger(__name__)

def get_categories_enum() -> List[str]:
    """
    Retorna lista de categorias disponíveis
    
    Returns:
        Lista de strings com categorias
    """
    return list(TOURNAMENT_CATEGORIES.keys())

def format_number(num: int) -> str:
    """
    Formatar números grandes para exibição
    
    Args:
        num: Número inteiro
        
    Returns:
        String formatada (ex: "1.5K", "2.3M")
    """
    if num >= 1000000:
        return f"{num/1000000:.1f}M"
    elif num >= 1000:
        return f"{num/1000:.1f}K"
    else:
        return str(num)

def create_metric_card(title: str, value: str, delta: str = None, help_text: str = None):
    """
    Cria um card de métrica customizado
    
    Args:
        title: Título da métrica
        value: Valor da métrica
        delta: Valor de variação (opcional)
        help_text: Texto de ajuda (opcional)
    """
    if delta:
        st.metric(label=title, value=value, delta=delta, help=help_text)
    else:
        st.metric(label=title, value=value, help=help_text)

def format_file_size(size_bytes: int) -> str:
    """
    Formata tamanho de arquivo em formato legível
    
    Args:
        size_bytes: Tamanho em bytes
        
    Returns:
        String formatada (ex: "1.5 MB")
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    size_bytes = float(size_bytes)
    i = 0
    
    while size_bytes >= 1024.0 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"

def format_date(date_obj: Any) -> str:
    """
    Formata data para exibição
    
    Args:
        date_obj: Objeto de data/string
        
    Returns:
        String formatada da data
    """
    if not date_obj:
        return "N/A"
    
    try:
        if isinstance(date_obj, str):
            # Tentar converter string para datetime
            if 'T' in date_obj:
                dt = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
            else:
                dt = datetime.strptime(date_obj, '%Y-%m-%d %H:%M:%S')
        else:
            dt = date_obj
        
        # Verificar se é hoje
        now = datetime.now()
        if dt.date() == now.date():
            return f"Hoje às {dt.strftime('%H:%M')}"
        
        # Verificar se é ontem
        yesterday = now - timedelta(days=1)
        if dt.date() == yesterday.date():
            return f"Ontem às {dt.strftime('%H:%M')}"
        
        # Verificar se é desta semana
        week_ago = now - timedelta(days=7)
        if dt > week_ago:
            weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
            return f"{weekdays[dt.weekday()]} às {dt.strftime('%H:%M')}"
        
        # Data mais antiga
        return dt.strftime('%d/%m/%Y às %H:%M')
        
    except Exception as e:
        logger.error(f"Erro ao formatar data {date_obj}: {e}")
        return str(date_obj)

def format_number(number: Any, decimal_places: int = 0) -> str:
    """
    Formata número com separadores de milhares
    
    Args:
        number: Número para formatar
        decimal_places: Casas decimais
        
    Returns:
        Número formatado
    """
    try:
        if number is None:
            return "0"
        
        num = float(number)
        if decimal_places == 0:
            return f"{int(num):,}".replace(',', '.')
        else:
            return f"{num:,.{decimal_places}f}".replace(',', 'X').replace('.', ',').replace('X', '.')
    except (ValueError, TypeError):
        return str(number)

def get_category_display_info(category: str) -> Dict:
    """
    Retorna informações de exibição para uma categoria
    
    Args:
        category: Nome da categoria
        
    Returns:
        Dict com informações da categoria
    """
    return TOURNAMENT_CATEGORIES.get(category, {
        'name': category,
        'display_name': category.title(),
        'color': '#808080',
        'icon': '📷',
        'description': 'Categoria personalizada'
    })

def create_metric_card(title: str, value: Any, delta: Any = None, help_text: str = None):
    """
    Cria um card de métrica estilizado
    
    Args:
        title: Título da métrica
        value: Valor principal
        delta: Variação (opcional)
        help_text: Texto de ajuda (opcional)
    """
    formatted_value = format_number(value) if isinstance(value, (int, float)) else str(value)
    
    st.metric(
        label=title,
        value=formatted_value,
        delta=delta,
        help=help_text
    )

def create_status_badge(status: str, status_map: Dict[str, Dict] = None) -> str:
    """
    Cria badge HTML para status
    
    Args:
        status: Status atual
        status_map: Mapeamento de status para cores/textos
        
    Returns:
        HTML do badge
    """
    default_map = {
        'active': {'color': '#28a745', 'text': '✅ Ativo'},
        'inactive': {'color': '#dc3545', 'text': '❌ Inativo'},
        'approved': {'color': '#28a745', 'text': '✅ Aprovado'},
        'pending': {'color': '#ffc107', 'text': '⏳ Pendente'},
        'rejected': {'color': '#dc3545', 'text': '❌ Rejeitado'}
    }
    
    if status_map:
        default_map.update(status_map)
    
    info = default_map.get(status, {'color': '#6c757d', 'text': status})
    
    return f"""
    <span style="background-color: {info['color']}; color: white; 
                 padding: 4px 8px; border-radius: 12px; font-size: 12px;">
        {info['text']}
    </span>
    """

def show_pagination(total_items: int, items_per_page: int = None) -> Tuple[int, int]:
    """
    Exibe controles de paginação
    
    Args:
        total_items: Total de itens
        items_per_page: Itens por página
        
    Returns:
        Tuple (offset, limit)
    """
    if items_per_page is None:
        items_per_page = PAGINATION_CONFIG['images_per_page']
    
    if total_items <= items_per_page:
        return 0, items_per_page
    
    total_pages = (total_items + items_per_page - 1) // items_per_page
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        current_page = st.selectbox(
            "📄 Página",
            options=list(range(1, total_pages + 1)),
            format_func=lambda x: f"Página {x} de {total_pages}",
            key="pagination_select"
        )
    
    offset = (current_page - 1) * items_per_page
    
    # Mostrar informações da paginação
    start_item = offset + 1
    end_item = min(offset + items_per_page, total_items)
    
    st.caption(f"Mostrando {start_item}-{end_item} de {total_items} itens")
    
    return offset, items_per_page

def create_filter_sidebar(categories: List[str] = None) -> Dict:
    """
    Cria sidebar com filtros
    
    Args:
        categories: Lista de categorias disponíveis
        
    Returns:
        Dict com filtros selecionados
    """
    with st.sidebar:
        st.markdown("## 🔍 Filtros")
        
        # Filtro por categoria
        if categories is None:
            categories = list(TOURNAMENT_CATEGORIES.keys())
        
        category_options = ["Todas"] + [
            TOURNAMENT_CATEGORIES[cat]['display_name'] 
            for cat in categories if cat in TOURNAMENT_CATEGORIES
        ]
        
        selected_category_display = st.selectbox(
            "🏷️ Categoria",
            options=category_options,
            key="filter_category"
        )
        
        selected_category = None
        if selected_category_display != "Todas":
            # Encontrar categoria por display name
            for cat_key, cat_data in TOURNAMENT_CATEGORIES.items():
                if cat_data['display_name'] == selected_category_display:
                    selected_category = cat_key
                    break
        
        # Filtro por status
        st.markdown("### 📊 Status")
        show_active = st.checkbox("✅ Apenas ativas", value=False, key="filter_active")
        show_approved = st.checkbox("🔒 Apenas aprovadas", value=False, key="filter_approved")
        
        # Filtro por período
        st.markdown("### 📅 Período")
        date_filter = st.selectbox(
            "Período",
            options=["Todos", "Última semana", "Último mês", "Últimos 3 meses", "Personalizado"],
            key="filter_date"
        )
        
        custom_dates = None
        if date_filter == "Personalizado":
            col1, col2 = st.columns(2)
            with col1:
                start_date = st.date_input("De", key="filter_start_date")
            with col2:
                end_date = st.date_input("Até", key="filter_end_date")
            custom_dates = (start_date, end_date)
        
        # Busca por texto
        st.markdown("### 🔍 Busca")
        search_term = st.text_input(
            "Título, descrição ou tags",
            placeholder="Digite para buscar...",
            key="filter_search"
        )
        
        # Botão para limpar filtros
        if st.button("🧹 Limpar Filtros", use_container_width=True):
            # Limpar session state dos filtros
            filter_keys = [
                "filter_category", "filter_active", "filter_approved", 
                "filter_date", "filter_search", "filter_start_date", "filter_end_date"
            ]
            for key in filter_keys:
                if key in st.session_state:
                    del st.session_state[key]
            st.rerun()
    
    return {
        'category': selected_category,
        'active_only': show_active,
        'approved_only': show_approved,
        'date_filter': date_filter,
        'custom_dates': custom_dates,
        'search_term': search_term.strip() if search_term else None
    }

def show_confirmation_dialog(title: str, message: str, key: str) -> bool:
    """
    Exibe diálogo de confirmação
    
    Args:
        title: Título do diálogo
        message: Mensagem de confirmação
        key: Chave única para o diálogo
        
    Returns:
        True se confirmado
    """
    if f"confirm_{key}" not in st.session_state:
        st.session_state[f"confirm_{key}"] = False
    
    if not st.session_state[f"confirm_{key}"]:
        st.warning(f"⚠️ **{title}**")
        st.write(message)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("✅ Confirmar", key=f"confirm_yes_{key}"):
                st.session_state[f"confirm_{key}"] = True
                st.rerun()
        with col2:
            if st.button("❌ Cancelar", key=f"confirm_no_{key}"):
                return False
        
        return False
    
    return True

def export_to_csv(data: List[Dict], filename: str = None) -> str:
    """
    Exporta dados para CSV
    
    Args:
        data: Lista de dicionários para exportar
        filename: Nome do arquivo (opcional)
        
    Returns:
        String CSV
    """
    if not data:
        return ""
    
    df = pd.DataFrame(data)
    
    # Formatar colunas de data
    date_columns = ['upload_date', 'updated_at', 'approved_at', 'created_at']
    for col in date_columns:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col]).dt.strftime('%d/%m/%Y %H:%M')
    
    # Formatar colunas de tamanho
    if 'file_size' in df.columns:
        df['file_size_formatted'] = df['file_size'].apply(lambda x: format_file_size(x) if pd.notna(x) else 'N/A')
    
    return df.to_csv(index=False, encoding='utf-8-sig')

def show_bulk_actions(selected_items: List[Any], available_actions: List[str]) -> Optional[str]:
    """
    Exibe opções de ações em lote
    
    Args:
        selected_items: Lista de itens selecionados
        available_actions: Lista de ações disponíveis
        
    Returns:
        Ação selecionada ou None
    """
    if not selected_items:
        return None
    
    st.markdown(f"### 🔧 Ações em Lote ({len(selected_items)} selecionados)")
    
    action_labels = {
        'approve': '✅ Aprovar',
        'reject': '❌ Rejeitar', 
        'activate': '🔓 Ativar',
        'deactivate': '🔒 Desativar',
        'delete': '🗑️ Excluir',
        'export': '📤 Exportar'
    }
    
    col1, col2 = st.columns([2, 1])
    
    with col1:
        selected_action = st.selectbox(
            "Selecione uma ação",
            options=available_actions,
            format_func=lambda x: action_labels.get(x, x),
            key="bulk_action_select"
        )
    
    with col2:
        if st.button("🚀 Executar", key="bulk_action_execute"):
            return selected_action
    
    return None

def create_stats_overview(stats: Dict) -> None:
    """
    Cria overview de estatísticas
    
    Args:
        stats: Dicionário com estatísticas
    """
    # Métricas principais
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        create_metric_card(
            "📷 Total de Imagens",
            stats.get('total_images', 0),
            help_text="Total de imagens no sistema"
        )
    
    with col2:
        create_metric_card(
            "✅ Aprovadas",
            stats.get('approved_images', 0),
            help_text="Imagens aprovadas para uso em torneios"
        )
    
    with col3:
        create_metric_card(
            "⏳ Pendentes",
            stats.get('pending_approval', 0),
            help_text="Imagens aguardando aprovação"
        )
    
    with col4:
        create_metric_card(
            "🔍 Visualizações",
            stats.get('total_views', 0),
            help_text="Total de visualizações nos torneios"
        )

def safe_get_nested(dictionary: Dict, keys: List[str], default: Any = None) -> Any:
    """
    Busca valor aninhado no dicionário de forma segura
    
    Args:
        dictionary: Dicionário para buscar
        keys: Lista de chaves aninhadas
        default: Valor padrão se não encontrar
        
    Returns:
        Valor encontrado ou padrão
    """
    current = dictionary
    try:
        for key in keys:
            current = current[key]
        return current
    except (KeyError, TypeError):
        return default

def truncate_text(text: str, max_length: int = 50) -> str:
    """
    Trunca texto se muito longo
    
    Args:
        text: Texto para truncar
        max_length: Comprimento máximo
        
    Returns:
        Texto truncado
    """
    if not text or len(text) <= max_length:
        return text or ""
    
    return text[:max_length-3] + "..."