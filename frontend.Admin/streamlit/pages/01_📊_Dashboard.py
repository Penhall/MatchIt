# pages/01_📊_Dashboard.py - Página principal com dashboard de estatísticas
import streamlit as st
import sys
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

# Configurar path para imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.auth import require_auth
from utils.database import get_db_manager
from utils.helpers import format_number, get_categories_enum, create_metric_card
from config import TOURNAMENT_CONFIG

def main():
    """Página principal do dashboard com estatísticas gerais"""
    
    # Verificar autenticação
    if not require_auth():
        return
    
    st.title("📊 Dashboard Administrativo")
    st.markdown("---")
    
    # Obter dados do banco
    db = get_db_manager()
    
    try:
        # === MÉTRICAS PRINCIPAIS ===
        col1, col2, col3, col4 = st.columns(4)
        
        # Total de imagens
        total_images_query = "SELECT COUNT(*) as total FROM tournament_images"
        total_images = db.fetch_one(total_images_query)['total']
        
        with col1:
            create_metric_card(
                "🖼️ Total de Imagens",
                format_number(total_images),
                delta=None,
                help_text="Total de imagens no sistema"
            )
        
        # Imagens aprovadas
        approved_query = """
            SELECT COUNT(*) as approved 
            FROM tournament_images 
            WHERE approved = true
        """
        approved_images = db.fetch_one(approved_query)['approved']
        approval_rate = (approved_images / total_images * 100) if total_images > 0 else 0
        
        with col2:
            create_metric_card(
                "✅ Imagens Aprovadas",
                format_number(approved_images),
                delta=f"{approval_rate:.1f}%",
                help_text="Imagens aprovadas para uso em torneios"
            )
        
        # Imagens pendentes
        pending_query = """
            SELECT COUNT(*) as pending 
            FROM tournament_images 
            WHERE approved = false AND active = true
        """
        pending_images = db.fetch_one(pending_query)['pending']
        
        with col3:
            create_metric_card(
                "⏳ Pendentes de Aprovação",
                format_number(pending_images),
                delta=None,
                help_text="Imagens aguardando revisão"
            )
        
        # Total de categorias
        categories = get_categories_enum()
        
        with col4:
            create_metric_card(
                "📂 Categorias Ativas",
                format_number(len(categories)),
                delta=None,
                help_text="Categorias disponíveis no sistema"
            )
        
        st.markdown("---")
        
        # === GRÁFICOS PRINCIPAIS ===
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📈 Distribuição por Status")
            
            # Gráfico de status das imagens (baseado em approved e active)
            status_query = """
                SELECT 
                    CASE 
                        WHEN approved = true THEN 'approved'
                        WHEN approved = false AND active = true THEN 'pending'
                        WHEN active = false THEN 'inactive'
                        ELSE 'unknown'
                    END as status,
                    COUNT(*) as count
                FROM tournament_images
                GROUP BY 
                    CASE 
                        WHEN approved = true THEN 'approved'
                        WHEN approved = false AND active = true THEN 'pending'
                        WHEN active = false THEN 'inactive'
                        ELSE 'unknown'
                    END
                ORDER BY count DESC
            """
            status_data = db.fetch_all(status_query)
            
            if status_data:
                df_status = pd.DataFrame(status_data)
                
                # Mapear cores para cada status
                color_map = {
                    'approved': '#28a745',    # Verde
                    'pending': '#ffc107',     # Amarelo
                    'rejected': '#dc3545',    # Vermelho
                    'inactive': '#6c757d'     # Cinza
                }
                
                colors = [color_map.get(status, '#007bff') for status in df_status['status']]
                
                fig_status = px.pie(
                    df_status, 
                    values='count', 
                    names='status',
                    title="Status das Imagens",
                    color_discrete_sequence=colors
                )
                fig_status.update_layout(height=400)
                st.plotly_chart(fig_status, use_container_width=True)
            else:
                st.info("Nenhum dado de status encontrado")
        
        with col2:
            st.subheader("📊 Imagens por Categoria")
            
            # Gráfico de distribuição por categoria
            category_query = """
                SELECT category, COUNT(*) as count
                FROM tournament_images
                WHERE approved = true
                GROUP BY category
                ORDER BY count DESC
                LIMIT 10
            """
            category_data = db.fetch_all(category_query)
            
            if category_data:
                df_category = pd.DataFrame(category_data)
                
                fig_category = px.bar(
                    df_category,
                    x='category',
                    y='count',
                    title="Top 10 Categorias (Aprovadas)",
                    color='count',
                    color_continuous_scale='Blues'
                )
                fig_category.update_layout(
                    height=400,
                    xaxis_tickangle=-45
                )
                st.plotly_chart(fig_category, use_container_width=True)
            else:
                st.info("Nenhum dado de categoria encontrado")
        
        st.markdown("---")
        
        # === TABELA DE ATIVIDADE RECENTE ===
        st.subheader("🕒 Atividade Recente")
        
        recent_query = """
            SELECT 
                id,
                title,
                category,
                CASE 
                    WHEN approved = true THEN 'approved'
                    WHEN approved = false AND active = true THEN 'pending'
                    WHEN active = false THEN 'inactive'
                    ELSE 'unknown'
                END as status,
                uploaded_at as upload_date,
                image_url as file_path
            FROM tournament_images
            ORDER BY uploaded_at DESC
            LIMIT 10
        """
        recent_data = db.fetch_all(recent_query)
        
        if recent_data:
            df_recent = pd.DataFrame(recent_data)
            
            # Formatar data
            df_recent['upload_date'] = pd.to_datetime(df_recent['upload_date']).dt.strftime('%d/%m/%Y %H:%M')
            
            # Adicionar indicadores de status
            status_indicators = {
                'approved': '✅',
                'pending': '⏳',
                'rejected': '❌',
                'inactive': '⚫'
            }
            df_recent['status_icon'] = df_recent['status'].map(status_indicators)
            
            # Mostrar tabela
            st.dataframe(
                df_recent[['id', 'title', 'category', 'status_icon', 'upload_date']],
                column_config={
                    "id": "ID",
                    "title": "Título",
                    "category": "Categoria",
                    "status_icon": "Status",
                    "upload_date": "Data de Upload"
                },
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("Nenhuma atividade recente encontrada")
        
        # === ESTATÍSTICAS DETALHADAS ===
        st.markdown("---")
        st.subheader("📋 Estatísticas Detalhadas")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric(
                label="Taxa de Aprovação",
                value=f"{approval_rate:.1f}%",
                help="Percentual de imagens aprovadas"
            )
        
        with col2:
            # Média de uploads por dia (últimos 30 dias)
            uploads_query = """
                SELECT COUNT(*) as daily_uploads
                FROM tournament_images
                WHERE uploaded_at >= NOW() - INTERVAL '30 days'
            """
            uploads_data = db.fetch_one(uploads_query)
            daily_avg = uploads_data['daily_uploads'] / 30 if uploads_data else 0
            
            st.metric(
                label="Uploads/Dia (30d)",
                value=f"{daily_avg:.1f}",
                help="Média de uploads por dia nos últimos 30 dias"
            )
        
        with col3:
            # Tamanho médio dos arquivos
            size_query = """
                SELECT AVG(file_size) as avg_size
                FROM tournament_images
                WHERE file_size IS NOT NULL
            """
            size_data = db.fetch_one(size_query)
            avg_size = size_data['avg_size'] if size_data and size_data['avg_size'] else 0
            avg_size_mb = avg_size / (1024 * 1024) if avg_size > 0 else 0
            
            st.metric(
                label="Tamanho Médio",
                value=f"{avg_size_mb:.1f} MB",
                help="Tamanho médio dos arquivos de imagem"
            )
        
        # === GRÁFICO DE TIMELINE ===
        st.markdown("---")
        st.subheader("📅 Timeline de Uploads (Últimos 30 dias)")
        
        timeline_query = """
            SELECT 
                DATE(uploaded_at) as date,
                COUNT(*) as uploads,
                CASE 
                    WHEN approved = true THEN 'approved'
                    WHEN approved = false AND active = true THEN 'pending'
                    WHEN active = false THEN 'inactive'
                    ELSE 'unknown'
                END as status
            FROM tournament_images
            WHERE uploaded_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(uploaded_at), status
            ORDER BY date DESC
        """
        timeline_data = db.fetch_all(timeline_query)
        
        if timeline_data:
            df_timeline = pd.DataFrame(timeline_data)
            df_timeline['date'] = pd.to_datetime(df_timeline['date'])
            
            fig_timeline = px.bar(
                df_timeline,
                x='date',
                y='uploads',
                color='status',
                title="Uploads por Dia e Status",
                color_discrete_map={
                    'approved': '#28a745',
                    'pending': '#ffc107',
                    'rejected': '#dc3545',
                    'inactive': '#6c757d'
                }
            )
            fig_timeline.update_layout(height=400)
            st.plotly_chart(fig_timeline, use_container_width=True)
        else:
            st.info("Nenhum dado de timeline encontrado")
        
        # === AÇÕES RÁPIDAS ===
        st.markdown("---")
        st.subheader("⚡ Ações Rápidas")
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if st.button("🖼️ Gerenciar Imagens", use_container_width=True):
                st.info("💡 Use a sidebar para navegar para 'Gerenciar Imagens'")
        
        with col2:
            if st.button("📂 Ver Categorias", use_container_width=True):
                st.info("💡 Use a sidebar para navegar para 'Categorias'")
        
        with col3:
            if st.button("📈 Analytics", use_container_width=True):
                st.info("💡 Use a sidebar para navegar para 'Analytics'")
        
        with col4:
            if st.button("⚙️ Configurações", use_container_width=True):
                st.info("💡 Use a sidebar para navegar para 'Configurações'")
    
    except Exception as e:
        st.error(f"Erro ao carregar dashboard: {str(e)}")
        st.exception(e)
    finally:
        db.close()

if __name__ == "__main__":
    main()