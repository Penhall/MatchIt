# pages/04_📈_Analytics.py - Página de analytics avançados e relatórios
import streamlit as st
import sys
import os
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import numpy as np

# Configurar path para imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.auth import require_auth
from utils.database import get_db_manager
from utils.helpers import format_number, get_categories_enum, create_metric_card
from config import TOURNAMENT_CONFIG

def main():
    """Página de analytics avançados com relatórios detalhados"""
    
    # Verificar autenticação
    if not require_auth():
        return
    
    st.title("📈 Analytics Avançados")
    st.markdown("Análises detalhadas e relatórios do sistema de torneios")
    st.markdown("---")
    
    # Obter dados do banco
    db = get_db_manager()
    
    try:
        # === FILTROS ===
        col1, col2, col3 = st.columns(3)
        
        with col1:
            # Filtro de período
            period_options = {
                "Últimos 7 dias": 7,
                "Últimos 30 dias": 30,
                "Últimos 90 dias": 90,
                "Último ano": 365
            }
            selected_period = st.selectbox("📅 Período", list(period_options.keys()))
            days = period_options[selected_period]
        
        with col2:
            # Filtro de categoria
            categories = get_categories_enum()
            selected_category = st.selectbox("📂 Categoria", ["Todas"] + categories)
        
        with col3:
            # Filtro de status
            status_options = ["Todos", "approved", "pending", "rejected", "inactive"]
            selected_status = st.selectbox("🔄 Status", status_options)
        
        # Construir filtros SQL
        date_filter = f"uploaded_at >= NOW() - INTERVAL '{days} days'"
        category_filter = f"AND category = '{selected_category}'" if selected_category != "Todas" else ""
        
        # Filtro de status baseado nas colunas boolean da tabela
        if selected_status == "approved":
            status_filter = "AND approved = true"
        elif selected_status == "pending":
            status_filter = "AND approved = false AND active = true"
        elif selected_status == "rejected":
            status_filter = "AND active = false"
        elif selected_status == "inactive":
            status_filter = "AND active = false"
        else:
            status_filter = ""  # Todos
        
        where_clause = f"WHERE {date_filter} {category_filter} {status_filter}"
        
        st.markdown("---")
        
        # === MÉTRICAS DO PERÍODO ===
        col1, col2, col3, col4 = st.columns(4)
        
        # Total de imagens no período
        total_query = f"SELECT COUNT(*) as total FROM tournament_images {where_clause}"
        total_data = db.fetch_one(total_query)
        total_period = total_data['total'] if total_data else 0
        
        with col1:
            create_metric_card(
                "📊 Total no Período",
                format_number(total_period),
                help_text=f"Imagens {selected_period.lower()}"
            )
        
        # Taxa de aprovação no período
        approved_query = f"SELECT COUNT(*) as approved FROM tournament_images {where_clause} AND approved = true"
        approved_data = db.fetch_one(approved_query)
        approved_period = approved_data['approved'] if approved_data else 0
        approval_rate = (approved_period / total_period * 100) if total_period > 0 else 0
        
        with col2:
            create_metric_card(
                "✅ Taxa de Aprovação",
                f"{approval_rate:.1f}%",
                help_text="Percentual aprovado no período"
            )
        
        # Média diária
        daily_avg = total_period / days if days > 0 else 0
        
        with col3:
            create_metric_card(
                "📈 Média Diária",
                f"{daily_avg:.1f}",
                help_text="Uploads por dia no período"
            )
        
        # Categoria mais popular
        popular_query = f"""
            SELECT category, COUNT(*) as count
            FROM tournament_images {where_clause}
            GROUP BY category
            ORDER BY count DESC
            LIMIT 1
        """
        popular_data = db.fetch_one(popular_query)
        top_category = popular_data['category'] if popular_data else "N/A"
        
        with col4:
            create_metric_card(
                "🏆 Top Categoria",
                top_category,
                help_text="Categoria mais popular"
            )
        
        st.markdown("---")
        
        # === GRÁFICOS AVANÇADOS ===
        
        # Gráfico de tendência temporal
        st.subheader("📊 Tendência Temporal")
        
        timeline_query = f"""
            SELECT 
                DATE(uploaded_at) as date,
                COUNT(*) as total_uploads,
                SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved_uploads,
                SUM(CASE WHEN approved = false AND active = true THEN 1 ELSE 0 END) as pending_uploads,
                SUM(CASE WHEN active = false THEN 1 ELSE 0 END) as rejected_uploads
            FROM tournament_images {where_clause}
            GROUP BY DATE(uploaded_at)
            ORDER BY date
        """
        timeline_data = db.fetch_all(timeline_query)
        
        if timeline_data:
            df_timeline = pd.DataFrame(timeline_data)
            df_timeline['date'] = pd.to_datetime(df_timeline['date'])
            
            # Criar gráfico com múltiplas linhas
            fig_timeline = go.Figure()
            
            fig_timeline.add_trace(go.Scatter(
                x=df_timeline['date'],
                y=df_timeline['total_uploads'],
                mode='lines+markers',
                name='Total',
                line=dict(color='#007bff', width=3)
            ))
            
            fig_timeline.add_trace(go.Scatter(
                x=df_timeline['date'],
                y=df_timeline['approved_uploads'],
                mode='lines+markers',
                name='Aprovadas',
                line=dict(color='#28a745', width=2)
            ))
            
            fig_timeline.add_trace(go.Scatter(
                x=df_timeline['date'],
                y=df_timeline['pending_uploads'],
                mode='lines+markers',
                name='Pendentes',
                line=dict(color='#ffc107', width=2)
            ))
            
            fig_timeline.add_trace(go.Scatter(
                x=df_timeline['date'],
                y=df_timeline['rejected_uploads'],
                mode='lines+markers',
                name='Rejeitadas',
                line=dict(color='#dc3545', width=2)
            ))
            
            fig_timeline.update_layout(
                title="Uploads por Dia",
                xaxis_title="Data",
                yaxis_title="Número de Uploads",
                height=400,
                showlegend=True
            )
            
            st.plotly_chart(fig_timeline, use_container_width=True)
        else:
            st.info("Nenhum dado de tendência encontrado para o período selecionado")
        
        # === ANÁLISE POR CATEGORIA ===
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📊 Performance por Categoria")
            
            category_performance_query = f"""
                SELECT 
                    category,
                    COUNT(*) as total,
                    SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved,
                    ROUND(
                        SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                        1
                    ) as approval_rate
                FROM tournament_images {where_clause}
                GROUP BY category
                HAVING COUNT(*) > 0
                ORDER BY total DESC
            """
            category_data = db.fetch_all(category_performance_query)
            
            if category_data:
                df_category = pd.DataFrame(category_data)
                
                # Gráfico de barras horizontal
                fig_category = px.bar(
                    df_category,
                    x='total',
                    y='category',
                    orientation='h',
                    title="Total de Imagens por Categoria",
                    color='approval_rate',
                    color_continuous_scale='RdYlGn',
                    text='total'
                )
                fig_category.update_layout(height=400)
                fig_category.update_traces(textposition='outside')
                st.plotly_chart(fig_category, use_container_width=True)
            else:
                st.info("Nenhum dado de categoria encontrado")
        
        with col2:
            st.subheader("🎯 Taxa de Aprovação por Categoria")
            
            if category_data:
                # Gráfico de radar para taxas de aprovação
                categories_radar = df_category['category'].tolist()
                approval_rates = df_category['approval_rate'].tolist()
                
                fig_radar = go.Figure()
                
                fig_radar.add_trace(go.Scatterpolar(
                    r=approval_rates,
                    theta=categories_radar,
                    fill='toself',
                    name='Taxa de Aprovação (%)',
                    line=dict(color='#007bff')
                ))
                
                fig_radar.update_layout(
                    polar=dict(
                        radialaxis=dict(
                            visible=True,
                            range=[0, 100]
                        )
                    ),
                    title="Taxa de Aprovação por Categoria (%)",
                    height=400
                )
                
                st.plotly_chart(fig_radar, use_container_width=True)
            else:
                st.info("Nenhum dado disponível para o gráfico de radar")
        
        # === ANÁLISE DE QUALIDADE ===
        st.markdown("---")
        st.subheader("🔍 Análise de Qualidade das Imagens")
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Distribuição de tamanhos de arquivo
            size_query = f"""
                SELECT 
                    CASE 
                        WHEN file_size < 500000 THEN 'Pequeno (<500KB)'
                        WHEN file_size < 1000000 THEN 'Médio (500KB-1MB)'
                        WHEN file_size < 2000000 THEN 'Grande (1-2MB)'
                        ELSE 'Muito Grande (>2MB)'
                    END as size_category,
                    COUNT(*) as count,
                    ROUND(AVG(file_size / 1024.0 / 1024.0), 2) as avg_size_mb
                FROM tournament_images {where_clause}
                AND file_size IS NOT NULL
                GROUP BY size_category
                ORDER BY avg_size_mb
            """
            size_data = db.fetch_all(size_query)
            
            if size_data:
                df_size = pd.DataFrame(size_data)
                
                fig_size = px.pie(
                    df_size,
                    values='count',
                    names='size_category',
                    title="Distribuição por Tamanho de Arquivo"
                )
                fig_size.update_layout(height=400)
                st.plotly_chart(fig_size, use_container_width=True)
            else:
                st.info("Nenhum dado de tamanho encontrado")
        
        with col2:
            # Top imagens por visualizações (simulado - seria baseado em dados reais de uso)
            popular_images_query = f"""
                SELECT 
                    image_name as title,
                    category,
                    CASE 
                        WHEN approved = true THEN 'approved'
                        WHEN approved = false AND active = true THEN 'pending'
                        WHEN active = false THEN 'inactive'
                        ELSE 'unknown'
                    END as status,
                    uploaded_at as upload_date,
                    file_size
                FROM tournament_images {where_clause}
                AND approved = true
                ORDER BY uploaded_at DESC
                LIMIT 10
            """
            popular_data = db.fetch_all(popular_images_query)
            
            if popular_data:
                st.write("**🏆 Imagens Aprovadas Recentes**")
                df_popular = pd.DataFrame(popular_data)
                df_popular['upload_date'] = pd.to_datetime(df_popular['upload_date']).dt.strftime('%d/%m/%Y')
                df_popular['file_size_mb'] = (df_popular['file_size'] / 1024 / 1024).round(2)
                
                st.dataframe(
                    df_popular[['title', 'category', 'upload_date', 'file_size_mb']],
                    column_config={
                        "title": "Título",
                        "category": "Categoria",
                        "upload_date": "Data",
                        "file_size_mb": "Tamanho (MB)"
                    },
                    use_container_width=True,
                    hide_index=True
                )
            else:
                st.info("Nenhuma imagem aprovada encontrada")
        
        # === RELATÓRIO DETALHADO ===
        st.markdown("---")
        st.subheader("📋 Relatório Detalhado")
        
        with st.container():
            # Tabela com todas as estatísticas
            summary_query = f"""
                SELECT 
                    category,
                    COUNT(*) as total,
                    SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                    ROUND(AVG(file_size / 1024.0 / 1024.0), 2) as avg_size_mb,
                    ROUND(
                        SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                        1
                    ) as approval_rate
                FROM tournament_images {where_clause}
                GROUP BY category
                ORDER BY total DESC
            """
            summary_data = db.fetch_all(summary_query)
            
            if summary_data:
                df_summary = pd.DataFrame(summary_data)
                
                st.dataframe(
                    df_summary,
                    column_config={
                        "category": "Categoria",
                        "total": "Total",
                        "approved": "Aprovadas",
                        "pending": "Pendentes",
                        "rejected": "Rejeitadas",
                        "avg_size_mb": "Tam. Médio (MB)",
                        "approval_rate": "Taxa Aprovação (%)"
                    },
                    use_container_width=True,
                    hide_index=True
                )
                
                # Botão para exportar dados
                if st.button("📤 Exportar Relatório CSV"):
                    csv = df_summary.to_csv(index=False)
                    st.download_button(
                        label="⬇️ Baixar CSV",
                        data=csv,
                        file_name=f"relatorio_analytics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        mime="text/csv"
                    )
            else:
                st.info("Nenhum dado disponível para o relatório")
        
        # === INSIGHTS AUTOMÁTICOS ===
        st.markdown("---")
        st.subheader("💡 Insights Automáticos")
        
        if timeline_data and category_data:
            insights = []
            
            # Insight sobre crescimento
            if len(timeline_data) >= 7:
                recent_avg = sum([row['total_uploads'] for row in timeline_data[-7:]]) / 7
                older_avg = sum([row['total_uploads'] for row in timeline_data[:-7]]) / max(1, len(timeline_data) - 7)
                
                if recent_avg > older_avg * 1.2:
                    insights.append("📈 **Crescimento acelerado**: Os uploads aumentaram significativamente nos últimos dias")
                elif recent_avg < older_avg * 0.8:
                    insights.append("📉 **Desaceleração**: Os uploads diminuíram recentemente")
            
            # Insight sobre aprovação
            if approval_rate > 80:
                insights.append("✅ **Alta qualidade**: Taxa de aprovação acima de 80%")
            elif approval_rate < 50:
                insights.append("⚠️ **Atenção**: Taxa de aprovação baixa, revisar critérios")
            
            # Insight sobre categorias
            df_cat = pd.DataFrame(category_data)
            if len(df_cat) > 0:
                top_category = df_cat.iloc[0]['category']
                top_count = df_cat.iloc[0]['total']
                insights.append(f"🏆 **Categoria dominante**: {top_category} representa {top_count} uploads")
            
            # Mostrar insights
            for insight in insights:
                st.markdown(insight)
            
            if not insights:
                st.info("Nenhum insight específico identificado para o período atual")
        
    except Exception as e:
        st.error(f"Erro ao carregar analytics: {str(e)}")
        st.exception(e)
    finally:
        db.close()

if __name__ == "__main__":
    main()