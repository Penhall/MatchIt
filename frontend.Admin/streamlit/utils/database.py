# utils/database.py - Gerenciador de conexão com PostgreSQL
import psycopg2
from psycopg2.extras import RealDictCursor
import streamlit as st
import logging
from typing import List, Dict, Any, Optional, Tuple
from contextlib import contextmanager
import sys
import os

# Adicionar o diretório parent ao path para importar config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import DATABASE_URL, DB_CONFIG

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Gerenciador de conexão e operações com PostgreSQL"""
    
    def __init__(self):
        self.connection_pool = None
        self._test_connection()
    
    def _test_connection(self) -> bool:
        """Testa a conexão com o banco de dados"""
        try:
            with psycopg2.connect(DATABASE_URL) as conn:
                with conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                    logger.info("✅ Conexão com banco de dados estabelecida com sucesso")
                    return True
        except Exception as e:
            logger.error(f"❌ Erro ao conectar com banco de dados: {e}")
            st.error(f"Erro de conexão com banco: {e}")
            return False
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexões com o banco"""
        conn = None
        try:
            conn = psycopg2.connect(DATABASE_URL)
            yield conn
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Erro na conexão: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_query(self, query: str, params: tuple = None, fetch: bool = True) -> Optional[List[Dict]]:
        """
        Executa uma query e retorna os resultados
        
        Args:
            query: SQL query para executar
            params: Parâmetros para a query
            fetch: Se deve fazer fetch dos resultados
            
        Returns:
            Lista de dicionários com os resultados ou None
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)
                    
                    if fetch:
                        results = cursor.fetchall()
                        return [dict(row) for row in results]
                    else:
                        conn.commit()
                        return None
                        
        except Exception as e:
            logger.error(f"Erro ao executar query: {e}")
            logger.error(f"Query: {query}")
            logger.error(f"Params: {params}")
            raise
    
    def execute_many(self, query: str, params_list: List[tuple]) -> bool:
        """
        Executa múltiplas operações de uma vez
        
        Args:
            query: SQL query para executar
            params_list: Lista de tuplas com parâmetros
            
        Returns:
            True se sucesso, False caso contrário
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.executemany(query, params_list)
                    conn.commit()
                    logger.info(f"Executadas {len(params_list)} operações com sucesso")
                    return True
                    
        except Exception as e:
            logger.error(f"Erro ao executar batch: {e}")
            return False

    # =====================================================
    # OPERAÇÕES ESPECÍFICAS PARA IMAGENS DE TORNEIO
    # =====================================================
    
    def get_tournament_images(self, 
                            category: Optional[str] = None,
                            active_only: bool = False,
                            approved_only: bool = False,
                            search_term: Optional[str] = None,
                            limit: int = 50,
                            offset: int = 0) -> List[Dict]:
        """Busca imagens de torneio com filtros opcionais"""
        
        conditions = []
        params = []
        param_count = 0
        
        if category:
            param_count += 1
            conditions.append(f"category = ${param_count}")
            params.append(category)
        
        if active_only:
            conditions.append("active = true")
            
        if approved_only:
            conditions.append("approved = true")
            
        if search_term:
            param_count += 1
            conditions.append(f"(title ILIKE ${param_count} OR description ILIKE ${param_count} OR ${param_count} = ANY(tags))")
            search_pattern = f"%{search_term}%"
            params.extend([search_pattern, search_pattern, search_term])
            param_count += 2
        
        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        query = f"""
        SELECT 
            id, category, image_url, thumbnail_url, title, description, tags,
            active, approved, created_by, upload_date, updated_at,
            file_size, image_width, image_height, mime_type,
            total_views, total_selections, win_rate,
            approved_by, approved_at
        FROM tournament_images 
        {where_clause}
        ORDER BY upload_date DESC
        LIMIT ${param_count + 1} OFFSET ${param_count + 2}
        """
        
        params.extend([limit, offset])
        
        return self.execute_query(query, tuple(params))
    
    def get_image_by_id(self, image_id: int) -> Optional[Dict]:
        """Busca uma imagem específica por ID"""
        query = """
        SELECT 
            id, category, image_url, thumbnail_url, title, description, tags,
            active, approved, created_by, upload_date, updated_at,
            file_size, image_width, image_height, mime_type,
            total_views, total_selections, win_rate,
            approved_by, approved_at
        FROM tournament_images 
        WHERE id = $1
        """
        
        results = self.execute_query(query, (image_id,))
        return results[0] if results else None
    
    def insert_tournament_image(self, image_data: Dict) -> Optional[int]:
        """Insere uma nova imagem de torneio"""
        query = """
        INSERT INTO tournament_images 
        (category, image_url, thumbnail_url, title, description, tags, 
         active, approved, created_by, file_size, image_width, image_height, mime_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
        """
        
        params = (
            image_data['category'],
            image_data['image_url'], 
            image_data.get('thumbnail_url'),
            image_data.get('title', ''),
            image_data.get('description', ''),
            image_data.get('tags', []),
            image_data.get('active', True),
            image_data.get('approved', False),
            image_data.get('created_by'),
            image_data.get('file_size'),
            image_data.get('image_width'),
            image_data.get('image_height'),
            image_data.get('mime_type')
        )
        
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute(query, params)
                    result = cursor.fetchone()
                    conn.commit()
                    return result[0] if result else None
        except Exception as e:
            logger.error(f"Erro ao inserir imagem: {e}")
            return None
    
    def update_tournament_image(self, image_id: int, updates: Dict) -> bool:
        """Atualiza uma imagem de torneio"""
        
        # Construir query dinâmica baseada nos campos a atualizar
        set_clauses = []
        params = []
        param_count = 0
        
        updateable_fields = [
            'category', 'title', 'description', 'tags', 'active', 
            'approved', 'approved_by', 'image_url', 'thumbnail_url'
        ]
        
        for field in updateable_fields:
            if field in updates:
                param_count += 1
                set_clauses.append(f"{field} = ${param_count}")
                params.append(updates[field])
        
        if not set_clauses:
            return False
        
        # Adicionar timestamp de atualização
        param_count += 1
        set_clauses.append(f"updated_at = ${param_count}")
        params.append('NOW()')
        
        # Adicionar ID para WHERE
        param_count += 1
        params.append(image_id)
        
        query = f"""
        UPDATE tournament_images 
        SET {', '.join(set_clauses)}
        WHERE id = ${param_count}
        """
        
        try:
            self.execute_query(query, tuple(params), fetch=False)
            return True
        except Exception as e:
            logger.error(f"Erro ao atualizar imagem {image_id}: {e}")
            return False
    
    def delete_tournament_image(self, image_id: int, soft_delete: bool = True) -> bool:
        """Remove uma imagem de torneio (soft ou hard delete)"""
        
        if soft_delete:
            # Soft delete - apenas marca como inativa
            query = "UPDATE tournament_images SET active = false, updated_at = NOW() WHERE id = $1"
        else:
            # Hard delete - remove completamente
            query = "DELETE FROM tournament_images WHERE id = $1"
        
        try:
            self.execute_query(query, (image_id,), fetch=False)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar imagem {image_id}: {e}")
            return False
    
    def get_category_stats(self) -> List[Dict]:
        """Busca estatísticas por categoria"""
        query = """
        SELECT 
            category,
            COUNT(*) as total_images,
            COUNT(CASE WHEN active = true THEN 1 END) as active_images,
            COUNT(CASE WHEN approved = true THEN 1 END) as approved_images,
            AVG(CASE WHEN approved = true THEN win_rate ELSE NULL END) as avg_win_rate,
            SUM(total_views) as total_views,
            SUM(total_selections) as total_selections,
            COUNT(CASE WHEN upload_date > NOW() - INTERVAL '7 days' THEN 1 END) as recent_uploads,
            COUNT(CASE WHEN upload_date > NOW() - INTERVAL '30 days' THEN 1 END) as monthly_uploads
        FROM tournament_images 
        GROUP BY category
        ORDER BY category
        """
        
        return self.execute_query(query)
    
    def get_dashboard_stats(self) -> Dict:
        """Busca estatísticas gerais para o dashboard"""
        queries = {
            'total_images': "SELECT COUNT(*) as count FROM tournament_images",
            'active_images': "SELECT COUNT(*) as count FROM tournament_images WHERE active = true",
            'approved_images': "SELECT COUNT(*) as count FROM tournament_images WHERE approved = true", 
            'pending_approval': "SELECT COUNT(*) as count FROM tournament_images WHERE approved = false AND active = true",
            'total_views': "SELECT COALESCE(SUM(total_views), 0) as total FROM tournament_images",
            'total_selections': "SELECT COALESCE(SUM(total_selections), 0) as total FROM tournament_images",
            'recent_uploads': "SELECT COUNT(*) as count FROM tournament_images WHERE upload_date > NOW() - INTERVAL '7 days'",
            'categories_count': "SELECT COUNT(DISTINCT category) as count FROM tournament_images"
        }
        
        stats = {}
        for key, query in queries.items():
            try:
                result = self.execute_query(query)
                if result:
                    stats[key] = result[0].get('count', 0) or result[0].get('total', 0)
                else:
                    stats[key] = 0
            except Exception as e:
                logger.error(f"Erro ao buscar estatística {key}: {e}")
                stats[key] = 0
        
        return stats
    
    def bulk_update_approval(self, image_ids: List[int], approved: bool, approved_by: Optional[int] = None) -> bool:
        """Atualiza aprovação de múltiplas imagens em lote"""
        if not image_ids:
            return True
            
        placeholders = ','.join(['$' + str(i + 1) for i in range(len(image_ids))])
        params = list(image_ids)
        
        set_clause = "approved = $" + str(len(params) + 1)
        params.append(approved)
        
        if approved_by:
            set_clause += ", approved_by = $" + str(len(params) + 1)
            params.append(approved_by)
            
        if approved:
            set_clause += ", approved_at = NOW()"
        
        query = f"""
        UPDATE tournament_images 
        SET {set_clause}, updated_at = NOW()
        WHERE id IN ({placeholders})
        """
        
        try:
            self.execute_query(query, tuple(params), fetch=False)
            return True
        except Exception as e:
            logger.error(f"Erro no update em lote: {e}")
            return False

# Singleton instance
@st.cache_resource
def get_db_manager():
    """Retorna instância única do DatabaseManager"""
    return DatabaseManager()

# Funções de conveniência
def get_images(**kwargs):
    """Função de conveniência para buscar imagens"""
    db = get_db_manager()
    return db.get_tournament_images(**kwargs)

def get_stats():
    """Função de conveniência para buscar estatísticas"""
    db = get_db_manager()
    return db.get_dashboard_stats()

def get_category_statistics():
    """Função de conveniência para estatísticas por categoria"""
    db = get_db_manager()
    return db.get_category_stats()