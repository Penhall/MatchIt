# check_database.py - Verificar e ajustar estrutura da tabela
from utils.database import get_db_manager

def check_and_fix_database():
    """Verifica a estrutura da tabela e adiciona colunas faltantes"""
    
    db = get_db_manager()
    
    try:
        # Verificar colunas existentes
        columns_query = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tournament_images'
        ORDER BY ordinal_position
        """
        
        columns = db.execute_query(columns_query)
        existing_columns = [col['column_name'] for col in columns]
        
        print("Colunas existentes na tabela tournament_images:")
        for col in columns:
            print(f"- {col['column_name']} ({col['data_type']}) - {'NULL' if col['is_nullable'] == 'YES' else 'NOT NULL'}")
        
        # Colunas opcionais que podem ser úteis (mas não são críticas)
        optional_columns = {
            'thumbnail_url': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;',
            'win_rate': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;',
            'total_views': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;',
            'total_selections': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS total_selections INTEGER DEFAULT 0;',
            'approved_by': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS approved_by INTEGER;',
            'approved_at': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;',
            'mime_type': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50);',
            'title': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS title VARCHAR(255);',
            'description': 'ALTER TABLE tournament_images ADD COLUMN IF NOT EXISTS description TEXT;'
        }
        
        # Verificar quais colunas estão faltando
        missing_columns = []
        for col_name, alter_sql in optional_columns.items():
            if col_name not in existing_columns:
                missing_columns.append((col_name, alter_sql))
        
        if missing_columns:
            print(f"\nColunas faltantes encontradas: {len(missing_columns)}")
            
            # Perguntar se deve executar as alterações
            response = input("\nDeseja executar as alterações no banco? (y/N): ")
            
            if response.lower() == 'y':
                print("\nExecutando alterações...")
                
                for col_name, alter_sql in missing_columns:
                    try:
                        success = db.execute_ddl(alter_sql)
                        if success:
                            print(f"✅ Coluna '{col_name}' adicionada com sucesso")
                        else:
                            print(f"❌ Erro ao adicionar coluna '{col_name}'")
                    except Exception as e:
                        print(f"❌ Erro ao adicionar coluna '{col_name}': {e}")
                
                print("\n🎉 Alterações concluídas!")
            else:
                print("\nAlterações não executadas. Script SQL gerado:")
                print("\n-- Execute as queries abaixo no seu cliente PostgreSQL:")
                for col_name, alter_sql in missing_columns:
                    print(alter_sql)
        else:
            print("\n✅ Todas as colunas necessárias estão presentes!")
            
    except Exception as e:
        print(f"❌ Erro ao verificar banco: {e}")
    finally:
        # DatabaseManager não tem método close() - a conexão é gerenciada internamente
        pass

if __name__ == "__main__":
    check_and_fix_database()