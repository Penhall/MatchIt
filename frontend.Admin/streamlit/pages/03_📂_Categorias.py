# pages/03_📂_Categorias.py - Página de gerenciamento de categorias
import streamlit as st
import sys
import os

# Configurar path para imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.auth import require_auth
from utils.database import get_db_manager
from utils.helpers import create_stats_overview, format_number
from config import TOURNAMENT_CATEGORIES

# =====================================================
# CONFIGURAÇÃO DA PÁGINA
# =====================================================

st.set_page_config(
    page_title="Categorias - MatchIt Admin",
    page_icon="📂",
    layout="wide"
)

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

@require_auth(['read'])
def main():
    """Função principal da página de categorias"""
    
    st.markdown("# 📂 Gerenciamento de Categorias")
    st.markdown("---")
    
    try:
        # Buscar estatísticas das categorias
        db = get_db_manager()
        category_stats = db.get_category_stats()
        
        if not category_stats:
            st.warning("📊 Nenhuma estatística de categoria disponível")
            return
        
        # Overview geral
        show_categories_overview(category_stats)
        
        st.markdown("---")
        
        # Grid de categorias
        show_categories_grid(category_stats)
        
        st.markdown("---")
        
        # Análise comparativa
        show_comparative_analysis(category_stats)
        
    except Exception as e:
        st.error(f"❌ Erro ao carregar categorias: {str(e)}")
        st.exception(e)

def show_categories_overview(category_stats):
    """Exibe overview geral das categorias"""
    
    st.markdown("## 📊 Visão Geral das Categorias")
    
    # Calcular totais
    total_images = sum(stat.get('total_images', 0) for stat in category_stats)
    total_approved = sum(stat.get('approved_images', 0) for stat in category_stats)
    total_active = sum(stat.get('active_images', 0) for stat in category_stats)
    total_views = sum(stat.get('total_views', 0) or 0 for stat in category_stats)
    
    # Métricas principais
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            "🏷️ Categorias Ativas",
            len([c for c in category_stats if c.get('active_images', 0) > 0]),
            help="Categorias com pelo menos uma imagem ativa"
        )
    
    with col2:
        st.metric(
            "📷 Total de Imagens",
            format_number(total_images),
            help="Total de imagens em todas as categorias"
        )
    
    with col3:
        approval_rate = (total_approved / total_images * 100) if total_images > 0 else 0
        st.metric(
            "✅ Taxa de Aprovação",
            f"{approval_rate:.1f}%",
            help="Percentual de imagens aprovadas"
        )
    
    with col4:
        st.metric(
            "👁️ Total de Views",
            format_number(total_views),
            help="Total de visualizações em torneios"
        )

def show_categories_grid(category_stats):
    """Exibe grid com informações de cada categoria"""
    
    st.markdown("## 🎯 Detalhes por Categoria")
    
    # Organizar em grid de 3 colunas
    cols_per_row = 3
    stats_by_category = {stat['category']: stat for stat in category_stats}
    
    categories = list(TOURNAMENT_CATEGORIES.keys())
    
    for i in range(0, len(categories), cols_per_row):
        cols = st.columns(cols_per_row)
        
        for j, col in enumerate(cols):
            if i + j < len(categories):
                category_key = categories[i + j]
                category_info = TOURNAMENT_CATEGORIES[category_key]
                category_stat = stats_by_category.get(category_key, {})
                
                with col:
                    show_category_card(category_key, category_info, category_stat)

def show_category_card(category_key, category_info, category_stat):
    """Exibe card individual de categoria"""
    
    with st.container():
        # Header da categoria com cor
        st.markdown(f"""
        <div style="background: {category_info['color']}; color: white; padding: 1rem; 
                    border-radius: 8px; text-align: center; margin-bottom: 1rem;">
            <h3>{category_info['icon']} {category_info['display_name']}</h3>
            <p style="margin: 0; opacity: 0.9;">{category_info['description']}</p>
        </div>
        """, unsafe_allow_html=True)
        
        # Estatísticas
        col1, col2 = st.columns(2)
        
        with col1:
            st.metric("📷 Total", category_stat.get('total_images', 0))
            st.metric("✅ Aprovadas", category_stat.get('approved_images', 0))
        
        with col2:
            st.metric("🟢 Ativas", category_stat.get('active_images', 0))
            st.metric("👁️ Views", category_stat.get('total_views', 0) or 0)
        
        # Barra de progresso para aprovação
        total = category_stat.get('total_images', 0)
        approved = category_stat.get('approved_images', 0)
        
        if total > 0:
            approval_rate = approved / total
            st.progress(approval_rate)
            st.caption(f"Taxa de aprovação: {approval_rate*100:.1f}%")
        else:
            st.caption("Nenhuma imagem nesta categoria")
        
        # Win rate médio
        avg_win_rate = category_stat.get('avg_win_rate', 0) or 0
        if avg_win_rate > 0:
            st.metric("🏆 Win Rate Médio", f"{avg_win_rate:.1f}%")
        
        # Uploads recentes
        recent_uploads = category_stat.get('recent_uploads', 0) or 0
        monthly_uploads = category_stat.get('monthly_uploads', 0) or 0
        
        if recent_uploads > 0:
            st.success(f"🆕 {recent_uploads} uploads esta semana")
        if monthly_uploads > 0:
            st.info(f"📅 {monthly_uploads} uploads este mês")
        
        # Botão para ver imagens
        if st.button(f"👁️ Ver Imagens", key=f"view_{category_key}", use_container_width=True):
            # Redirecionar para página de imagens com filtro
            st.session_state.filter_category = category_info['display_name']
            st.switch_page("pages/02_🖼️_Gerenciar_Imagens.py")

def show_comparative_analysis(category_stats):
    """Exibe análise comparativa entre categorias"""
    
    st.markdown("## 📈 Análise Comparativa")
    
    # Preparar dados
    categories_data = []
    for stat in category_stats:
        category_key = stat['category']
        if category_key in TOURNAMENT_CATEGORIES:
            category_info = TOURNAMENT_CATEGORIES[category_key]
            
            total = stat.get('total_images', 0)
            approved = stat.get('approved_images', 0)
            views = stat.get('total_views', 0) or 0
            selections = stat.get('total_selections', 0) or 0
            
            categories_data.append({
                'categoria': category_info['display_name'],
                'icon': category_info['icon'],
                'total_images': total,
                'approved_images': approved,
                'approval_rate': (approved / total * 100) if total > 0 else 0,
                'total_views': views,
                'total_selections': selections,
                'selection_rate': (selections / views * 100) if views > 0 else 0,
                'avg_win_rate': stat.get('avg_win_rate', 0) or 0,
                'recent_uploads': stat.get('recent_uploads', 0) or 0
            })
    
    if not categories_data:
        st.info("📊 Dados insuficientes para análise comparativa")
        return
    
    # Tabs para diferentes análises
    tab1, tab2, tab3 = st.tabs(["📊 Quantidade", "🎯 Engajamento", "🏆 Performance"])
    
    with tab1:
        show_quantity_analysis(categories_data)
    
    with tab2:
        show_engagement_analysis(categories_data)
    
    with tab3:
        show_performance_analysis(categories_data)

def show_quantity_analysis(categories_data):
    """Análise de quantidade de imagens"""
    
    st.markdown("### 📊 Análise de Quantidade")
    
    # Ordenar por total de imagens
    sorted_data = sorted(categories_data, key=lambda x: x['total_images'], reverse=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**🏆 Top 5 - Mais Imagens:**")
        for i, cat in enumerate(sorted_data[:5]):
            st.write(f"{i+1}. {cat['icon']} {cat['categoria']}: {cat['total_images']} imagens")
    
    with col2:
        st.markdown("**⚠️ Categorias com Poucas Imagens:**")
        low_count = [cat for cat in sorted_data if cat['total_images'] < 10]
        if low_count:
            for cat in low_count:
                st.write(f"• {cat['icon']} {cat['categoria']}: {cat['total_images']} imagens")
        else:
            st.success("✅ Todas as categorias têm 10+ imagens")
    
    # Taxa de aprovação por categoria
    st.markdown("**📈 Taxa de Aprovação por Categoria:**")
    approval_sorted = sorted(categories_data, key=lambda x: x['approval_rate'], reverse=True)
    
    for cat in approval_sorted:
        progress = cat['approval_rate'] / 100
        st.write(f"{cat['icon']} {cat['categoria']}")
        st.progress(progress)
        st.caption(f"{cat['approval_rate']:.1f}% ({cat['approved_images']}/{cat['total_images']})")

def show_engagement_analysis(categories_data):
    """Análise de engajamento"""
    
    st.markdown("### 🎯 Análise de Engajamento")
    
    # Views por categoria
    views_sorted = sorted(categories_data, key=lambda x: x['total_views'], reverse=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**👁️ Mais Visualizadas:**")
        for i, cat in enumerate(views_sorted[:5]):
            if cat['total_views'] > 0:
                st.write(f"{i+1}. {cat['icon']} {cat['categoria']}: {format_number(cat['total_views'])} views")
    
    with col2:
        st.markdown("**🎯 Taxa de Seleção:**")
        selection_sorted = sorted(categories_data, key=lambda x: x['selection_rate'], reverse=True)
        for cat in selection_sorted[:5]:
            if cat['selection_rate'] > 0:
                st.write(f"• {cat['icon']} {cat['categoria']}: {cat['selection_rate']:.1f}%")
    
    # Atividade recente
    st.markdown("**🆕 Atividade Recente (últimos 7 dias):**")
    recent_sorted = sorted(categories_data, key=lambda x: x['recent_uploads'], reverse=True)
    
    cols = st.columns(4)
    for i, cat in enumerate(recent_sorted[:4]):
        with cols[i]:
            if cat['recent_uploads'] > 0:
                st.metric(
                    f"{cat['icon']} {cat['categoria'][:10]}...",
                    f"{cat['recent_uploads']} uploads"
                )

def show_performance_analysis(categories_data):
    """Análise de performance"""
    
    st.markdown("### 🏆 Análise de Performance")
    
    # Win rate por categoria
    winrate_sorted = sorted(categories_data, key=lambda x: x['avg_win_rate'], reverse=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("**🏆 Melhores Win Rates:**")
        for i, cat in enumerate(winrate_sorted[:5]):
            if cat['avg_win_rate'] > 0:
                st.write(f"{i+1}. {cat['icon']} {cat['categoria']}: {cat['avg_win_rate']:.1f}%")
    
    with col2:
        st.markdown("**📊 Distribuição de Performance:**")
        
        high_performers = len([c for c in categories_data if c['avg_win_rate'] >= 60])
        medium_performers = len([c for c in categories_data if 30 <= c['avg_win_rate'] < 60])
        low_performers = len([c for c in categories_data if 0 < c['avg_win_rate'] < 30])
        no_data = len([c for c in categories_data if c['avg_win_rate'] == 0])
        
        st.write(f"🟢 Alto desempenho (≥60%): {high_performers}")
        st.write(f"🟡 Médio desempenho (30-59%): {medium_performers}")
        st.write(f"🔴 Baixo desempenho (<30%): {low_performers}")
        st.write(f"⚪ Sem dados: {no_data}")
    
    # Recomendações
    st.markdown("---")
    st.markdown("### 💡 Recomendações")
    
    recommendations = []
    
    # Categorias com poucas imagens
    low_image_cats = [c for c in categories_data if c['total_images'] < 10]
    if low_image_cats:
        cat_names = ", ".join([c['categoria'] for c in low_image_cats])
        recommendations.append(f"📤 **Upload mais imagens** para: {cat_names}")
    
    # Categorias com baixa aprovação
    low_approval_cats = [c for c in categories_data if c['approval_rate'] < 50 and c['total_images'] > 5]
    if low_approval_cats:
        cat_names = ", ".join([c['categoria'] for c in low_approval_cats])
        recommendations.append(f"✅ **Revisar critérios de aprovação** para: {cat_names}")
    
    # Categorias sem atividade recente
    inactive_cats = [c for c in categories_data if c['recent_uploads'] == 0 and c['total_images'] > 0]
    if inactive_cats:
        cat_names = ", ".join([c['categoria'] for c in inactive_cats])
        recommendations.append(f"🔄 **Promover uploads** em: {cat_names}")
    
    # Categorias com baixo engajamento
    low_engagement_cats = [c for c in categories_data if c['total_views'] > 0 and c['selection_rate'] < 10]
    if low_engagement_cats:
        cat_names = ", ".join([c['categoria'] for c in low_engagement_cats])
        recommendations.append(f"🎯 **Melhorar qualidade das imagens** em: {cat_names}")
    
    if recommendations:
        for rec in recommendations:
            st.info(rec)
    else:
        st.success("🎉 Todas as categorias estão com boa performance!")

# =====================================================
# EXECUÇÃO DA PÁGINA
# =====================================================

if __name__ == "__main__":
    main()