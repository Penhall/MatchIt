# utils/auth.py - Sistema de autenticação administrativo
import streamlit as st
import bcrypt
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import logging
import sys
import os

# Adicionar o diretório parent ao path para importar config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import AUTH_CONFIG

logger = logging.getLogger(__name__)

class AuthManager:
    """Gerenciador de autenticação para o dashboard administrativo"""
    
    def __init__(self):
        self.session_timeout = AUTH_CONFIG['session_timeout']
        self.admin_users = AUTH_CONFIG['admin_users']
        
    def hash_password(self, password: str) -> str:
        """Gera hash de uma senha"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verifica se a senha corresponde ao hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception as e:
            logger.error(f"Erro ao verificar senha: {e}")
            return False
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """
        Autentica um usuário
        
        Args:
            username: Nome do usuário
            password: Senha do usuário
            
        Returns:
            Dict com dados do usuário se autenticado, None caso contrário
        """
        if username not in self.admin_users:
            logger.warning(f"Tentativa de login com usuário inexistente: {username}")
            return None
            
        user_data = self.admin_users[username]
        stored_password = user_data['password']
        
        # Verificar se a senha armazenada está em hash ou texto plano
        if stored_password.startswith('$2b$'):
            # Senha está em hash
            password_valid = self.verify_password(password, stored_password)
        else:
            # Senha em texto plano (para desenvolvimento)
            password_valid = password == stored_password
        
        if password_valid:
            logger.info(f"Login bem-sucedido para usuário: {username}")
            return {
                'username': username,
                'role': user_data['role'],
                'permissions': user_data['permissions'],
                'login_time': datetime.now(),
                'last_activity': datetime.now()
            }
        else:
            logger.warning(f"Tentativa de login com senha incorreta para: {username}")
            return None
    
    def is_session_valid(self, user_data: Dict) -> bool:
        """Verifica se a sessão do usuário ainda é válida"""
        if not user_data:
            return False
            
        last_activity = user_data.get('last_activity')
        if not last_activity:
            return False
            
        # Verificar timeout
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity)
            
        session_age = (datetime.now() - last_activity).total_seconds()
        return session_age < self.session_timeout
    
    def update_last_activity(self):
        """Atualiza o timestamp da última atividade"""
        if 'user' in st.session_state:
            st.session_state.user['last_activity'] = datetime.now()
    
    def has_permission(self, permission: str) -> bool:
        """Verifica se o usuário atual tem uma permissão específica"""
        if 'user' not in st.session_state:
            return False
            
        user_permissions = st.session_state.user.get('permissions', [])
        return permission in user_permissions
    
    def logout(self):
        """Efetua logout do usuário atual"""
        if 'user' in st.session_state:
            username = st.session_state.user.get('username', 'unknown')
            logger.info(f"Logout realizado para usuário: {username}")
            del st.session_state.user
        
        # Limpar outras variáveis de sessão relacionadas
        session_keys_to_clear = ['authenticated', 'login_time']
        for key in session_keys_to_clear:
            if key in st.session_state:
                del st.session_state[key]
    
    def get_current_user(self) -> Optional[Dict]:
        """Retorna dados do usuário atual se autenticado"""
        if 'user' not in st.session_state:
            return None
            
        user_data = st.session_state.user
        if self.is_session_valid(user_data):
            self.update_last_activity()
            return user_data
        else:
            self.logout()
            return None

def show_login_form():
    """Exibe formulário de login"""
    st.markdown("## 🔐 Acesso Administrativo")
    st.markdown("---")
    
    with st.form("login_form"):
        st.markdown("### Entre com suas credenciais")
        username = st.text_input("👤 Usuário", placeholder="Digite seu usuário")
        password = st.text_input("🔑 Senha", type="password", placeholder="Digite sua senha")
        
        col1, col2, col3 = st.columns([1, 1, 1])
        with col2:
            submit_button = st.form_submit_button("🚀 Entrar", use_container_width=True)
        
        if submit_button:
            if not username or not password:
                st.error("❌ Por favor, preencha usuário e senha")
                return False
                
            auth_manager = AuthManager()
            user_data = auth_manager.authenticate_user(username, password)
            
            if user_data:
                st.session_state.user = user_data
                st.session_state.authenticated = True
                st.success("✅ Login realizado com sucesso!")
                time.sleep(1)
                st.rerun()
                return True
            else:
                st.error("❌ Usuário ou senha incorretos")
                return False
    
    # Informações sobre credenciais padrão (apenas para desenvolvimento)
    if os.getenv('ENVIRONMENT') == 'development':
        with st.expander("ℹ️ Credenciais de Desenvolvimento"):
            st.info("""
            **Credenciais padrão:**
            - **Admin**: admin / matchit_admin_2024
            - **Moderador**: moderator / matchit_mod_2024
            
            ⚠️ Altere as senhas em produção!
            """)
    
    return False

def require_auth(permissions: List[str] = None):
    """
    Decorator para páginas que requerem autenticação
    
    Args:
        permissions: Lista de permissões necessárias
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            auth_manager = AuthManager()
            current_user = auth_manager.get_current_user()
            
            if not current_user:
                show_login_form()
                return
            
            # Verificar permissões específicas
            if permissions:
                for permission in permissions:
                    if not auth_manager.has_permission(permission):
                        st.error(f"❌ Você não tem permissão '{permission}' para acessar esta página")
                        return
            
            # Executar função original
            return func(*args, **kwargs)
        
        return wrapper
    return decorator

def show_user_info():
    """Exibe informações do usuário logado no sidebar"""
    if 'user' not in st.session_state:
        return
        
    user = st.session_state.user
    
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 👤 Usuário Logado")
        
        # Informações básicas
        st.write(f"**Usuário:** {user['username']}")
        st.write(f"**Perfil:** {user['role'].replace('_', ' ').title()}")
        
        # Tempo de sessão
        login_time = user.get('login_time')
        if login_time:
            if isinstance(login_time, str):
                login_time = datetime.fromisoformat(login_time)
            session_duration = datetime.now() - login_time
            hours, remainder = divmod(int(session_duration.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)
            st.write(f"**Sessão:** {hours:02d}:{minutes:02d}:{seconds:02d}")
        
        # Permissões
        permissions = user.get('permissions', [])
        if permissions:
            st.write("**Permissões:**")
            for perm in permissions:
                st.write(f"• {perm}")
        
        # Botão de logout
        if st.button("🚪 Sair", use_container_width=True):
            auth_manager = AuthManager()
            auth_manager.logout()
            st.rerun()

def check_authentication() -> bool:
    """
    Verifica se o usuário está autenticado
    
    Returns:
        True se autenticado, False caso contrário
    """
    auth_manager = AuthManager()
    current_user = auth_manager.get_current_user()
    return current_user is not None

def get_current_user_data() -> Optional[Dict]:
    """Retorna dados do usuário atual"""
    auth_manager = AuthManager()
    return auth_manager.get_current_user()

# Funções utilitárias para verificação de permissões
def can_read() -> bool:
    """Verifica se pode ler dados"""
    auth_manager = AuthManager()
    return auth_manager.has_permission('read')

def can_write() -> bool:
    """Verifica se pode escrever/editar dados"""
    auth_manager = AuthManager()
    return auth_manager.has_permission('write')

def can_delete() -> bool:
    """Verifica se pode deletar dados"""
    auth_manager = AuthManager()
    return auth_manager.has_permission('delete')

def can_admin() -> bool:
    """Verifica se tem permissões administrativas"""
    auth_manager = AuthManager()
    return auth_manager.has_permission('admin')

def is_super_admin() -> bool:
    """Verifica se é super administrador"""
    if 'user' not in st.session_state:
        return False
    return st.session_state.user.get('role') == 'super_admin'