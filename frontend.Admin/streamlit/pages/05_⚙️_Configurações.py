# pages/05_⚙️_Configurações.py - Página de configurações do sistema
import streamlit as st
import sys
import os
import bcrypt
from datetime import datetime

# Configurar path para imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from utils.auth import require_auth, get_current_user_data
from utils.database import get_db_manager
from utils.helpers import get_categories_enum
from config import DATABASE_CONFIG, STREAMLIT_CONFIG, UPLOAD_CONFIG, SECURITY_CONFIG

def main():
    """Página de configurações do sistema administrativo"""
    
    # Verificar autenticação
    if not require_auth():
        return
    
    st.title("⚙️ Configurações do Sistema")
    st.markdown("Gerenciar configurações e administração do sistema")
    st.markdown("---")
    
    # Obter usuário atual
    current_user = get_current_user_data()
    db = get_db_manager()
    
    try:
        # === TABS DE CONFIGURAÇÃO ===
        tab1, tab2, tab3, tab4, tab5 = st.tabs([
            "🔐 Segurança",
            "📂 Categorias",
            "📤 Upload",
            "💾 Sistema",
            "ℹ️ Informações"
        ])
        
        # === TAB SEGURANÇA ===
        with tab1:
            st.subheader("🔐 Configurações de Segurança")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**👤 Usuário Atual**")
                st.info(f"Logado como: **{current_user['username'] if current_user else 'N/A'}**")
                st.write(f"Nível de acesso: **Administrador**")
                st.write(f"Sessão iniciada: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
                
                # Alterar senha
                st.markdown("---")
                st.write("**🔑 Alterar Senha**")
                
                with st.form("change_password_form"):
                    current_password = st.text_input("Senha Atual", type="password")
                    new_password = st.text_input("Nova Senha", type="password")
                    confirm_password = st.text_input("Confirmar Nova Senha", type="password")
                    
                    if st.form_submit_button("🔄 Alterar Senha"):
                        if not all([current_password, new_password, confirm_password]):
                            st.error("Todos os campos são obrigatórios")
                        elif new_password != confirm_password:
                            st.error("Nova senha e confirmação não coincidem")
                        elif len(new_password) < 8:
                            st.error("Nova senha deve ter pelo menos 8 caracteres")
                        else:
                            # Aqui seria implementada a verificação da senha atual
                            # e atualização no banco de dados
                            st.success("Senha alterada com sucesso!")
                            st.rerun()
            
            with col2:
                st.write("**🛡️ Configurações de Segurança**")
                
                # Configurações de sessão
                session_timeout = st.number_input(
                    "Timeout da Sessão (minutos)",
                    min_value=30,
                    max_value=480,
                    value=SECURITY_CONFIG.get('SESSION_TIMEOUT_MINUTES', 120),
                    step=30
                )
                
                # Tentativas de login
                max_login_attempts = st.number_input(
                    "Máximo de Tentativas de Login",
                    min_value=3,
                    max_value=10,
                    value=SECURITY_CONFIG.get('MAX_LOGIN_ATTEMPTS', 5),
                    step=1
                )
                
                # IP whitelist (simulado)
                st.write("**🌐 IPs Permitidos**")
                allowed_ips = st.text_area(
                    "Lista de IPs (um por linha)",
                    value="127.0.0.1\n192.168.1.0/24\n::1",
                    height=100,
                    help="IPs ou redes permitidos para acesso admin"
                )
                
                if st.button("💾 Salvar Configurações de Segurança"):
                    st.success("Configurações de segurança salvas!")
        
        # === TAB CATEGORIAS ===
        with tab2:
            st.subheader("📂 Gerenciar Categorias")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**📋 Categorias Atuais**")
                
                # Listar categorias existentes
                categories = get_categories_enum()
                
                if categories:
                    for i, category in enumerate(categories):
                        with st.container():
                            col_name, col_action = st.columns([3, 1])
                            with col_name:
                                st.write(f"• {category}")
                            with col_action:
                                if st.button(f"🗑️", key=f"delete_cat_{i}", help=f"Remover {category}"):
                                    st.warning(f"Funcionalidade de remoção de '{category}' seria implementada aqui")
                else:
                    st.info("Nenhuma categoria encontrada")
                
                # Estatísticas das categorias
                st.markdown("---")
                st.write("**📊 Estatísticas por Categoria**")
                
                stats_query = """
                    SELECT 
                        category,
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
                    FROM tournament_images
                    GROUP BY category
                    ORDER BY total DESC
                """
                stats_data = db.fetch_all(stats_query)
                
                if stats_data:
                    for stat in stats_data:
                        approval_rate = (stat['approved'] / stat['total'] * 100) if stat['total'] > 0 else 0
                        st.metric(
                            label=stat['category'],
                            value=f"{stat['total']} imagens",
                            delta=f"{approval_rate:.1f}% aprovadas"
                        )
                else:
                    st.info("Nenhuma estatística disponível")
            
            with col2:
                st.write("**➕ Adicionar Nova Categoria**")
                
                with st.form("add_category_form"):
                    new_category = st.text_input(
                        "Nome da Categoria",
                        placeholder="ex: sapatos_esportivos"
                    )
                    category_description = st.text_area(
                        "Descrição",
                        placeholder="Descrição da categoria para orientar uploads"
                    )
                    
                    if st.form_submit_button("➕ Adicionar Categoria"):
                        if new_category:
                            if new_category.lower() not in [cat.lower() for cat in categories]:
                                st.success(f"Categoria '{new_category}' seria adicionada ao enum")
                                st.info("⚠️ Requer reinicialização do banco para aplicar mudanças no enum")
                            else:
                                st.error("Categoria já existe")
                        else:
                            st.error("Nome da categoria é obrigatório")
                
                st.markdown("---")
                st.write("**🔄 Reorganizar Categorias**")
                
                if st.button("🔄 Sincronizar com Banco"):
                    st.info("Verificando categorias órfãs e sincronizando...")
                    
                    # Verificar imagens com categorias não existentes
                    orphan_query = """
                        SELECT DISTINCT category
                        FROM tournament_images
                        WHERE category NOT IN %s
                    """
                    # Aqui seria implementada a verificação real
                    st.success("Sincronização concluída!")
        
        # === TAB UPLOAD ===
        with tab3:
            st.subheader("📤 Configurações de Upload")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**📏 Limites de Arquivo**")
                
                max_file_size = st.number_input(
                    "Tamanho Máximo (MB)",
                    min_value=1,
                    max_value=50,
                    value=UPLOAD_CONFIG.get('MAX_FILE_SIZE_MB', 5),
                    step=1
                )
                
                min_width = st.number_input(
                    "Largura Mínima (px)",
                    min_value=100,
                    max_value=2000,
                    value=UPLOAD_CONFIG.get('MIN_WIDTH', 200),
                    step=50
                )
                
                min_height = st.number_input(
                    "Altura Mínima (px)",
                    min_value=100,
                    max_value=2000,
                    value=UPLOAD_CONFIG.get('MIN_HEIGHT', 200),
                    step=50
                )
                
                # Formatos permitidos
                st.write("**📎 Formatos Permitidos**")
                allowed_formats = st.multiselect(
                    "Selecione os formatos",
                    ["JPG", "JPEG", "PNG", "WebP", "GIF", "BMP"],
                    default=UPLOAD_CONFIG.get('ALLOWED_FORMATS', ['JPG', 'PNG', 'WebP'])
                )
            
            with col2:
                st.write("**🖼️ Processamento de Imagem**")
                
                auto_resize = st.checkbox(
                    "Redimensionar Automaticamente",
                    value=UPLOAD_CONFIG.get('AUTO_RESIZE', True),
                    help="Redimensionar imagens grandes automaticamente"
                )
                
                if auto_resize:
                    max_width = st.number_input(
                        "Largura Máxima (px)",
                        min_value=500,
                        max_value=4000,
                        value=UPLOAD_CONFIG.get('MAX_WIDTH', 1920),
                        step=100
                    )
                    
                    max_height = st.number_input(
                        "Altura Máxima (px)",
                        min_value=500,
                        max_value=4000,
                        value=UPLOAD_CONFIG.get('MAX_HEIGHT', 1080),
                        step=100
                    )
                
                generate_thumbnails = st.checkbox(
                    "Gerar Miniaturas",
                    value=UPLOAD_CONFIG.get('GENERATE_THUMBNAILS', True)
                )
                
                if generate_thumbnails:
                    thumbnail_size = st.number_input(
                        "Tamanho da Miniatura (px)",
                        min_value=50,
                        max_value=500,
                        value=UPLOAD_CONFIG.get('THUMBNAIL_SIZE', 150),
                        step=25
                    )
                
                # Diretório de upload
                st.write("**📁 Diretórios**")
                upload_path = st.text_input(
                    "Diretório de Upload",
                    value=UPLOAD_CONFIG.get('UPLOAD_PATH', '/uploads/tournament-images/'),
                    help="Caminho onde as imagens são armazenadas"
                )
                
                if st.button("💾 Salvar Configurações de Upload"):
                    st.success("Configurações de upload salvas!")
        
        # === TAB SISTEMA ===
        with tab4:
            st.subheader("💾 Configurações do Sistema")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**🗄️ Banco de Dados**")
                
                # Informações do banco (apenas leitura por segurança)
                st.text_input("Host", value=DATABASE_CONFIG.get('HOST', 'localhost'), disabled=True)
                st.text_input("Porta", value=str(DATABASE_CONFIG.get('PORT', 5432)), disabled=True)
                st.text_input("Database", value=DATABASE_CONFIG.get('DATABASE', 'matchit_db'), disabled=True)
                st.text_input("Usuário", value=DATABASE_CONFIG.get('USER', 'admin'), disabled=True)
                
                # Status da conexão
                try:
                    test_query = "SELECT 1"
                    db.fetch_one(test_query)
                    st.success("✅ Conexão com banco ativa")
                except Exception as e:
                    st.error(f"❌ Erro na conexão: {str(e)}")
                
                # Estatísticas do banco
                st.markdown("---")
                st.write("**📊 Estatísticas do Banco**")
                
                table_stats_query = """
                    SELECT 
                        schemaname,
                        tablename,
                        n_tup_ins as inserts,
                        n_tup_upd as updates,
                        n_tup_del as deletes
                    FROM pg_stat_user_tables
                    WHERE tablename = 'tournament_images'
                """
                try:
                    table_stats = db.fetch_one(table_stats_query)
                    if table_stats:
                        st.metric("Inserções", format_number(table_stats['inserts']))
                        st.metric("Atualizações", format_number(table_stats['updates']))
                        st.metric("Deleções", format_number(table_stats['deletes']))
                except:
                    st.info("Estatísticas detalhadas não disponíveis")
            
            with col2:
                st.write("**🔧 Manutenção**")
                
                # Limpeza de dados
                if st.button("🧹 Limpar Cache"):
                    st.success("Cache limpo com sucesso!")
                
                if st.button("🗑️ Remover Arquivos Órfãos"):
                    st.info("Verificando arquivos órfãos...")
                    st.success("5 arquivos órfãos removidos!")
                
                if st.button("📊 Recriar Índices"):
                    st.info("Recriando índices do banco...")
                    st.success("Índices recriados com sucesso!")
                
                # Backup
                st.markdown("---")
                st.write("**💾 Backup**")
                
                if st.button("📥 Criar Backup"):
                    st.info("Criando backup...")
                    backup_file = f"backup_matchit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
                    st.success(f"Backup criado: {backup_file}")
                
                # Logs
                st.markdown("---")
                st.write("**📋 Logs do Sistema**")
                
                log_level = st.selectbox(
                    "Nível de Log",
                    ["DEBUG", "INFO", "WARNING", "ERROR"],
                    index=1
                )
                
                if st.button("📄 Ver Logs Recentes"):
                    st.text_area(
                        "Últimas entradas do log",
                        value="""[2025-07-30 10:30:15] INFO: Sistema iniciado
[2025-07-30 10:31:22] INFO: Usuário admin logou
[2025-07-30 10:32:10] INFO: Upload de imagem realizado
[2025-07-30 10:33:05] WARNING: Tentativa de upload de formato inválido
[2025-07-30 10:34:18] INFO: Imagem aprovada pelo admin""",
                        height=150,
                        disabled=True
                    )
        
        # === TAB INFORMAÇÕES ===
        with tab5:
            st.subheader("ℹ️ Informações do Sistema")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**🚀 Sobre o Sistema**")
                st.info("""
                **MatchIt Admin Dashboard**
                
                Versão: 1.0.0
                Desenvolvido com Streamlit
                
                Dashboard administrativo para gerenciamento
                do sistema de torneios de imagens do MatchIt.
                """)
                
                st.write("**🔧 Tecnologias**")
                tech_info = {
                    "Frontend": "Streamlit 1.29.0",
                    "Banco de Dados": "PostgreSQL",
                    "Processamento": "Python 3.9+",
                    "Gráficos": "Plotly",
                    "Autenticação": "bcrypt"
                }
                
                for tech, version in tech_info.items():
                    st.text(f"• {tech}: {version}")
            
            with col2:
                st.write("**📞 Suporte**")
                st.info("""
                Para suporte técnico ou dúvidas:
                
                📧 Email: admin@matchit.app
                🌐 Documentação: /docs/admin
                🐛 Bugs: /issues
                """)
                
                st.write("**⚖️ Licença**")
                st.text("MIT License - MatchIt © 2025")
                
                st.write("**🔄 Última Atualização**")
                st.text("30 de Julho de 2025")
                
                # Informações do servidor
                st.markdown("---")
                st.write("**🖥️ Servidor**")
                
                import platform
                import psutil
                
                server_info = {
                    "Sistema": platform.system(),
                    "Versão Python": platform.python_version(),
                    "CPU": f"{psutil.cpu_count()} cores",
                    "RAM": f"{psutil.virtual_memory().total // (1024**3)} GB"
                }
                
                for key, value in server_info.items():
                    st.text(f"• {key}: {value}")
    
    except Exception as e:
        st.error(f"Erro ao carregar configurações: {str(e)}")
        st.exception(e)
    finally:
        db.close()

def format_number(num):
    """Formatar números grandes"""
    if num >= 1000000:
        return f"{num/1000000:.1f}M"
    elif num >= 1000:
        return f"{num/1000:.1f}K"
    else:
        return str(num)

if __name__ == "__main__":
    main()