# app.py - Aplicação principal do Dashboard Administrativo MatchIt
import streamlit as st
import sys
import os

# Configurar o path para importar módulos locais
sys.path.append(os.path.dirname(__file__))

from config import STREAMLIT_CONFIG
from utils.auth import check_authentication, show_login_form, show_user_info
from utils.database import get_db_manager
from utils.helpers import create_stats_overview

# =====================================================
# CONFIGURAÇÃO DA PÁGINA
# =====================================================

st.set_page_config(
    page_title=STREAMLIT_CONFIG['page_title'],
    page_icon=STREAMLIT_CONFIG['page_icon'], 
    layout=STREAMLIT_CONFIG['layout'],
    initial_sidebar_state=STREAMLIT_CONFIG['initial_sidebar_state'],
    menu_items={
        'Get Help': 'https://github.com/matchit/admin-dashboard',
        'Report a bug': 'https://github.com/matchit/admin-dashboard/issues',
        'About': """
        # MatchIt - Dashboard Administrativo
        
        Sistema de gerenciamento administrativo para imagens de torneios do MatchIt.
        
        **Versão:** 1.0.0  
        **Desenvolvido por:** Equipe MatchIt
        """
    }
)

# =====================================================
# CSS CUSTOMIZADO
# =====================================================

st.markdown("""
<style>
/* Estilo geral */
.main-header {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    padding: 1rem;
    border-radius: 10px;
    color: white;
    margin-bottom: 2rem;
    text-align: center;
}

.metric-card {
    background: white;
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid #667eea;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.category-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
    color: white;
    margin: 2px;
}

.status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: bold;
    color: white;
}

.success { background-color: #28a745; }
.warning { background-color: #ffc107; color: #212529; }
.danger { background-color: #dc3545; }
.info { background-color: #17a2b8; }

/* Sidebar styling */
.css-1d391kg {
    background-color: #f8f9fa;
}

/* Buttons */
.stButton > button {
    width: 100%;
    border-radius: 8px;
    border: none;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: bold;
}

.stButton > button:hover {
    background: linear-gradient(90deg, #764ba2 0%, #667eea 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* Cards */
[data-testid="metric-container"] {
    background: white;
    border: 1px solid #e1e5e9;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

[data-testid="metric-container"] > div {
    color: #495057;
}

/* Alerts */
.stAlert {
    border-radius: 8px;
}

/* File uploader */
.stFileUploader {
    border: 2px dashed #667eea;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
}

/* Progress bars */
.stProgress .st-bo {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}
</style>
""", unsafe_allow_html=True)

# =====================================================
# FUNÇÃO PRINCIPAL
# =====================================================

def main():
    """Função principal da aplicação"""
    
    # Verificar autenticação
    if not check_authentication():
        # Header para página de login
        st.markdown("""
        <div class="main-header">
            <h1>🎯 MatchIt - Dashboard Administrativo</h1>
            <p>Sistema de gerenciamento de imagens para torneios</p>
        </div>
        """, unsafe_allow_html=True)
        
        show_login_form()
        return
    
    # Usuário autenticado - mostrar aplicação principal
    show_main_dashboard()

def show_main_dashboard():
    """Exibe o dashboard principal"""
    
    # Header principal
    st.markdown("""
    <div class="main-header">
        <h1>🎯 MatchIt - Dashboard Administrativo</h1>
        <p>Gerencie imagens, categorias e torneios de forma eficiente</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Informações do usuário no sidebar
    show_user_info()
    
    # Menu de navegação no sidebar
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 🧭 Navegação")
        
        # Links para outras páginas
        st.markdown("""
        **📊 [Dashboard Principal](http://localhost:8501)**
        
        **🖼️ [Gerenciar Imagens](http://localhost:8501/Gerenciar_Imagens)**
        
        **📂 [Categorias](http://localhost:8501/Categorias)**
        
        **📈 [Analytics](http://localhost:8501/Analytics)**
        
        **⚙️ [Configurações](http://localhost:8501/Configurações)**
        """)
    
    # Conteúdo principal
    show_dashboard_content()

def show_dashboard_content():
    """Exibe conteúdo do dashboard principal"""
    
    try:
        # Buscar estatísticas gerais
        db = get_db_manager()
        stats = db.get_dashboard_stats()
        category_stats = db.get_category_stats()
        
        # Overview de estatísticas
        st.markdown("## 📊 Visão Geral")
        create_stats_overview(stats)
        
        st.markdown("---")
        
        # Estatísticas por categoria
        st.markdown("## 🏷️ Estatísticas por Categoria")
        
        if category_stats:
            # Preparar dados para exibição
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("### 📈 Resumo por Categoria")
                
                for cat_stat in category_stats:
                    category = cat_stat['category']
                    from config import TOURNAMENT_CATEGORIES
                    
                    if category in TOURNAMENT_CATEGORIES:
                        cat_info = TOURNAMENT_CATEGORIES[category]
                        
                        with st.expander(f"{cat_info['icon']} {cat_info['display_name']}"):
                            col_a, col_b = st.columns(2)
                            
                            with col_a:
                                st.metric("Total", cat_stat['total_images'] or 0)
                                st.metric("Aprovadas", cat_stat['approved_images'] or 0)
                            
                            with col_b:
                                st.metric("Ativas", cat_stat['active_images'] or 0)
                                win_rate = cat_stat['avg_win_rate'] or 0
                                st.metric("Win Rate Médio", f"{win_rate:.1f}%")
                            
                            # Barra de progresso para aprovação
                            if cat_stat['total_images']:
                                approval_rate = (cat_stat['approved_images'] or 0) / cat_stat['total_images']
                                st.progress(approval_rate)
                                st.caption(f"Taxa de aprovação: {approval_rate*100:.1f}%")
            
            with col2:
                st.markdown("### 📊 Atividade Recente")
                
                # Top categorias por uploads recentes
                recent_uploads = sorted(
                    [(cat['category'], cat['recent_uploads'] or 0) for cat in category_stats],
                    key=lambda x: x[1],
                    reverse=True
                )[:5]
                
                if any(upload_count > 0 for _, upload_count in recent_uploads):
                    st.markdown("**🆕 Uploads desta semana:**")
                    for category, upload_count in recent_uploads:
                        if upload_count > 0 and category in TOURNAMENT_CATEGORIES:
                            cat_info = TOURNAMENT_CATEGORIES[category]
                            st.write(f"• {cat_info['icon']} {cat_info['display_name']}: {upload_count}")
                else:
                    st.info("📷 Nenhum upload recente")
                
                # Estatísticas de visualizações
                total_views = sum(cat.get('total_views', 0) or 0 for cat in category_stats)
                total_selections = sum(cat.get('total_selections', 0) or 0 for cat in category_stats)
                
                st.markdown("**🎯 Engajamento Geral:**")
                st.write(f"• 👁️ Visualizações: {total_views:,}")
                st.write(f"• ✅ Seleções: {total_selections:,}")
                
                if total_views > 0:
                    selection_rate = (total_selections / total_views) * 100
                    st.write(f"• 📊 Taxa de seleção: {selection_rate:.1f}%")
        
        else:
            st.info("📊 Nenhuma estatística disponível ainda")
        
        st.markdown("---")
        
        # Ações rápidas
        st.markdown("## ⚡ Ações Rápidas")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if st.button("📤 Upload de Imagens", use_container_width=True):
                st.switch_page("pages/02_🖼️_Gerenciar_Imagens.py")
        
        with col2:
            if st.button("🔍 Ver Pendentes", use_container_width=True):
                # Redirecionar para página de imagens com filtro de pendentes
                st.session_state.filter_approved_only = False
                st.session_state.show_pending_only = True
                st.switch_page("pages/02_🖼️_Gerenciar_Imagens.py")
        
        with col3:
            if st.button("📊 Analytics Detalhado", use_container_width=True):
                st.switch_page("pages/04_📈_Analytics.py")
        
        with col4:
            if st.button("⚙️ Configurações", use_container_width=True):
                st.switch_page("pages/05_⚙️_Configurações.py")
        
        # Alertas e notificações
        show_alerts_section(stats)
        
    except Exception as e:
        st.error(f"❌ Erro ao carregar dashboard: {str(e)}")
        st.exception(e)

def show_alerts_section(stats: dict):
    """Exibe seção de alertas e notificações"""
    
    st.markdown("---")
    st.markdown("## 🚨 Alertas e Notificações")
    
    alerts = []
    
    # Verificar imagens pendentes de aprovação
    pending_count = stats.get('pending_approval', 0)
    if pending_count > 0:
        alerts.append({
            'type': 'warning',
            'message': f"⏳ {pending_count} imagem(ns) aguardando aprovação",
            'action': "Ver Pendentes"
        })
    
    # Verificar uploads recentes
    recent_count = stats.get('recent_uploads', 0)
    if recent_count > 10:
        alerts.append({
            'type': 'info', 
            'message': f"📈 {recent_count} uploads na última semana - atividade alta!",
            'action': None
        })
    
    # Verificar se há poucas imagens aprovadas
    approved_count = stats.get('approved_images', 0)
    if approved_count < 50:
        alerts.append({
            'type': 'warning',
            'message': f"⚠️ Apenas {approved_count} imagens aprovadas. Considere aprovar mais conteúdo.",
            'action': "Gerenciar Imagens"
        })
    
    # Verificar taxa de aprovação muito baixa
    total_images = stats.get('total_images', 0)
    if total_images > 0:
        approval_rate = (approved_count / total_images) * 100
        if approval_rate < 30:
            alerts.append({
                'type': 'error',
                'message': f"🚩 Taxa de aprovação baixa ({approval_rate:.1f}%). Revisar critérios de aprovação.",
                'action': None
            })
    
    if alerts:
        for alert in alerts:
            if alert['type'] == 'warning':
                st.warning(alert['message'])
            elif alert['type'] == 'error':
                st.error(alert['message'])
            elif alert['type'] == 'info':
                st.info(alert['message'])
    else:
        st.success("✅ Tudo funcionando normalmente!")

# =====================================================
# EXECUÇÃO DA APLICAÇÃO
# =====================================================

if __name__ == "__main__":
    main()