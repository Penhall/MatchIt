# config.py - Configurações do Dashboard Administrativo MatchIt
import os
from dotenv import load_dotenv

load_dotenv()

# =====================================================
# CONFIGURAÇÕES DO BANCO DE DADOS
# =====================================================

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'matchit_db'),
    'user': os.getenv('DB_USER', 'matchit'),
    'password': os.getenv('DB_PASSWORD', 'matchit123'),
}

# String de conexão completa
DATABASE_URL = f"postgresql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"

# =====================================================
# CONFIGURAÇÕES DE UPLOAD
# =====================================================

UPLOAD_CONFIG = {
    'max_file_size': 5 * 1024 * 1024,  # 5MB
    'allowed_extensions': ['.jpg', '.jpeg', '.png', '.webp'],
    'image_dimensions': {
        'min_width': 200,
        'min_height': 200,
        'max_width': 2048,
        'max_height': 2048,
    },
    'thumbnail_size': (150, 150),
    'quality': 85,
}

# Caminhos de armazenamento
BASE_UPLOAD_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
TOURNAMENT_IMAGES_PATH = os.path.join(BASE_UPLOAD_PATH, 'tournament-images')
THUMBNAILS_PATH = os.path.join(TOURNAMENT_IMAGES_PATH, 'thumbnails')

# Criar diretórios se não existirem
os.makedirs(TOURNAMENT_IMAGES_PATH, exist_ok=True)
os.makedirs(THUMBNAILS_PATH, exist_ok=True)

# =====================================================
# CATEGORIAS DE TORNEIO
# =====================================================

TOURNAMENT_CATEGORIES = {
    'cores': {
        'name': 'cores',
        'display_name': 'Cores',
        'color': '#FF6B6B',
        'icon': '🎨',
        'description': 'Paletas e combinações de cores'
    },
    'estilos': {
        'name': 'estilos', 
        'display_name': 'Estilos',
        'color': '#4ECDC4',
        'icon': '👗',
        'description': 'Estilos de moda e vestimenta'
    },
    'calcados': {
        'name': 'calcados',
        'display_name': 'Calçados', 
        'color': '#45B7D1',
        'icon': '👠',
        'description': 'Sapatos, tênis e calçados em geral'
    },
    'acessorios': {
        'name': 'acessorios',
        'display_name': 'Acessórios',
        'color': '#96CEB4', 
        'icon': '💍',
        'description': 'Bolsas, joias e acessórios'
    },
    'texturas': {
        'name': 'texturas',
        'display_name': 'Texturas',
        'color': '#FECA57',
        'icon': '🧵', 
        'description': 'Texturas e padrões de tecidos'
    },
    'roupas_casuais': {
        'name': 'roupas_casuais',
        'display_name': 'Roupas Casuais',
        'color': '#FF9FF3',
        'icon': '👕',
        'description': 'Roupas para o dia a dia'
    },
    'roupas_formais': {
        'name': 'roupas_formais', 
        'display_name': 'Roupas Formais',
        'color': '#54A0FF',
        'icon': '🤵',
        'description': 'Roupas para ocasiões formais'
    },
    'roupas_festa': {
        'name': 'roupas_festa',
        'display_name': 'Roupas de Festa', 
        'color': '#5F27CD',
        'icon': '🎉',
        'description': 'Roupas para festas e celebrações'
    },
    'joias': {
        'name': 'joias',
        'display_name': 'Joias',
        'color': '#FFD700',
        'icon': '💎',
        'description': 'Joias e bijuterias'
    },
    'bolsas': {
        'name': 'bolsas',
        'display_name': 'Bolsas',
        'color': '#FF6348',
        'icon': '👜', 
        'description': 'Bolsas, mochilas e carteiras'
    }
}

# =====================================================
# CONFIGURAÇÕES DE AUTENTICAÇÃO
# =====================================================

AUTH_CONFIG = {
    'session_timeout': 3600,  # 1 hora em segundos
    'admin_users': {
        'admin': {
            'password': os.getenv('ADMIN_PASSWORD', 'matchit_admin_2024'),
            'role': 'super_admin',
            'permissions': ['read', 'write', 'delete', 'admin']
        },
        'moderator': {
            'password': os.getenv('MODERATOR_PASSWORD', 'matchit_mod_2024'),
            'role': 'moderator', 
            'permissions': ['read', 'write']
        }
    }
}

# =====================================================
# CONFIGURAÇÕES DA APLICAÇÃO STREAMLIT
# =====================================================

STREAMLIT_CONFIG = {
    'page_title': 'MatchIt - Dashboard Administrativo',
    'page_icon': '🎯',
    'layout': 'wide',
    'initial_sidebar_state': 'expanded',
}

# =====================================================
# CONFIGURAÇÕES DE PAGINAÇÃO
# =====================================================

PAGINATION_CONFIG = {
    'images_per_page': 20,
    'max_results': 1000,
}

# =====================================================
# CONFIGURAÇÕES DE LOGS
# =====================================================

LOGGING_CONFIG = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': os.path.join(os.path.dirname(__file__), 'logs', 'admin_dashboard.log')
}

# Criar diretório de logs
os.makedirs(os.path.dirname(LOGGING_CONFIG['file']), exist_ok=True)