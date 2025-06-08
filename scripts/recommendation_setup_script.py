#!/usr/bin/env python3
"""
Script para criar estrutura completa do Sistema de Recomendação - MatchIt
Autor: Sistema de Recomendação MatchIt
Data: 2025-06-06
"""

import os
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

class RecommendationSystemSetup:
    def __init__(self):
        """Inicializa o setup do sistema de recomendação"""
        self.project_root = Path.cwd()
        self.created_dirs = []
        self.dependencies = {
            'production': [
                '@types/node (já instalado)',
                'uuid (para IDs únicos)',
                'date-fns (para manipulação de datas)',
                'lodash (para manipulação de arrays)'
            ],
            'development': [
                '@types/uuid',
                '@types/lodash',
                'jest (para testes)',
                '@types/jest'
            ],
            'optional': [
                'redis (para cache avançado)',
                'bull (para jobs assíncronos)',
                'prometheus-api-metrics (para monitoramento)'
            ]
        }
    
    def print_header(self) -> None:
        """Imprime o cabeçalho do script"""
        print("🚀 Configurando Sistema de Recomendação MatchIt...")
    
    def create_directory(self, dir_path: str) -> None:
        """Cria um diretório se não existir"""
        path = self.project_root / dir_path
        path.mkdir(parents=True, exist_ok=True)
        self.created_dirs.append(dir_path)
    
    def create_directory_structure(self) -> None:
        """Cria toda a estrutura de diretórios"""
        print("📁 Criando estrutura de diretórios...")
        
        directories = [
            # Types e interfaces
            'types/recommendation',
            'types/analytics',
            
            # Services e engines
            'services/recommendation',
            'services/analytics',
            
            # API routes
            'routes/recommendation',
            
            # Hooks React
            'hooks/recommendation',
            
            # Componentes React
            'components/recommendation',
            'components/analytics',
            
            # Database migrations
            'scripts/migrations/recommendation',
            
            # Utils e helpers
            'utils/recommendation',
            'utils/analytics',
            
            # Testes
            'tests/recommendation',
            'tests/analytics',
            
            # Config
            'config/recommendation'
        ]
        
        for directory in directories:
            self.create_directory(directory)
        
        print("✅ Estrutura de diretórios criada!")
    
    def print_implementation_plan(self) -> None:
        """Imprime o plano de implementação detalhado"""
        print("📝 Arquivos que serão implementados:")
        print()
        
        phases = {
            "FASE 1: Adequação da Base": {
                "📁 Types/Interfaces": [
                    "types/recommendation/base.ts",
                    "types/recommendation/extended-user.ts", 
                    "types/recommendation/match-score.ts",
                    "types/recommendation/user-interaction.ts",
                    "types/recommendation/index.ts"
                ],
                "📁 Database Extensions": [
                    "scripts/migrations/recommendation/001_extend_user_profiles.sql",
                    "scripts/migrations/recommendation/002_create_interactions_table.sql",
                    "scripts/migrations/recommendation/003_create_algorithm_weights.sql",
                    "scripts/migrations/recommendation/004_create_recommendation_cache.sql"
                ],
                "📁 Backend Extensions": [
                    "routes/recommendation/feedback.ts",
                    "routes/recommendation/preferences.ts",
                    "services/recommendation/user-profile-service.ts"
                ]
            },
            "FASE 2: Engine de Recomendação": {
                "📁 Core Engine": [
                    "services/recommendation/recommendation-engine.ts",
                    "services/recommendation/recommendation-service.ts",
                    "services/recommendation/algorithm-weights.ts"
                ],
                "📁 API Routes": [
                    "routes/recommendation/recommendations.ts",
                    "routes/recommendation/index.ts"
                ]
            },
            "FASE 3: Sistema de Feedback": {
                "📁 Frontend Components": [
                    "components/recommendation/recommendation-card.tsx",
                    "components/recommendation/recommendation-list.tsx",
                    "components/recommendation/feedback-buttons.tsx"
                ],
                "📁 React Hooks": [
                    "hooks/recommendation/use-recommendations.ts",
                    "hooks/recommendation/use-feedback.ts"
                ],
                "📁 Analytics": [
                    "services/analytics/recommendation-analytics.ts",
                    "components/analytics/recommendation-dashboard.tsx"
                ]
            },
            "FASE 4: Otimizações Avançadas": {
                "📁 Performance": [
                    "services/recommendation/cache-service.ts",
                    "utils/recommendation/query-optimizer.ts"
                ],
                "📁 Advanced Features": [
                    "services/recommendation/ml-service.ts",
                    "components/recommendation/advanced-filters.tsx"
                ]
            }
        }
        
        for phase_name, categories in phases.items():
            print(f"=== {phase_name} ===")
            for category_name, files in categories.items():
                print(f"{category_name}:")
                for file in files:
                    print(f"  - {file}")
            print()
        
        # Arquivos adicionais
        additional_files = {
            "📁 Configuration": [
                "config/recommendation/algorithm-config.ts",
                "config/recommendation/cache-config.ts"
            ],
            "📁 Tests": [
                "tests/recommendation/engine.test.ts",
                "tests/recommendation/service.test.ts",
                "tests/recommendation/api.test.ts"
            ],
            "📁 Utils": [
                "utils/recommendation/similarity-calculations.ts",
                "utils/recommendation/geo-utils.ts",
                "utils/analytics/metrics-calculator.ts"
            ]
        }
        
        for category_name, files in additional_files.items():
            print(f"{category_name}:")
            for file in files:
                print(f"  - {file}")
        print()
        
        print("🎯 Total estimado: ~30 arquivos a serem criados ao longo das 4 fases")
        print()
    
    def check_project_structure(self) -> bool:
        """Verifica a estrutura básica do projeto"""
        print("📦 Verificando dependências do projeto...")
        
        # Verificar package.json
        package_json_path = self.project_root / "package.json"
        if package_json_path.exists():
            print("✅ package.json encontrado")
        else:
            print("❌ package.json não encontrado - execute na raiz do projeto")
            return False
        
        # Verificar estrutura básica
        basic_dirs = ['components', 'types', 'services']
        missing_dirs = []
        
        for dir_name in basic_dirs:
            dir_path = self.project_root / dir_name
            if dir_path.exists():
                continue
            else:
                missing_dirs.append(dir_name)
        
        if not missing_dirs:
            print("✅ Estrutura básica do projeto confirmada")
        else:
            print("⚠️  Algumas pastas básicas não foram encontradas - será criada estrutura completa")
            print(f"   Pastas ausentes: {', '.join(missing_dirs)}")
        
        return True
    
    def create_progress_file(self) -> None:
        """Cria o arquivo de progresso em markdown"""
        print("📊 Criando arquivo de progresso...")
        
        progress_content = f"""# Sistema de Recomendação MatchIt - Progresso da Implementação

## Status Geral: 🟡 Em Andamento

### FASE 1: Adequação da Base ⏳
- [ ] 1.1 Extensão de Tipos
- [ ] 1.2 Extensão do Banco
- [ ] 1.3 Adaptação do Backend

### FASE 2: Engine de Recomendação Básico ⏸️
- [ ] 2.1 RecommendationEngine Core
- [ ] 2.2 RecommendationService
- [ ] 2.3 APIs de Recomendação

### FASE 3: Sistema de Feedback e Aprendizado ⏸️
- [ ] 3.1 Coleta de Feedback
- [ ] 3.2 Pesos Adaptativos
- [ ] 3.3 Melhorias de UX

### FASE 4: Otimizações e Features Avançadas ⏸️
- [ ] 4.1 Performance
- [ ] 4.2 Analytics Avançados
- [ ] 4.3 Features Sociais

---
Última atualização: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## Estrutura de Diretórios Criada

### Diretórios Principais:
"""
        
        # Adicionar diretórios criados
        for directory in sorted(self.created_dirs):
            progress_content += f"- {directory}/\n"
        
        progress_content += f"""
### Estatísticas:
- Total de diretórios criados: {len(self.created_dirs)}
- Data de criação: {datetime.now().strftime("%Y-%m-%d")}
- Estrutura baseada em: Sistema de Recomendação MatchIt v1.2.0

### Próximos Passos:
1. Implementar tipos TypeScript
2. Criar migrations de banco de dados
3. Desenvolver engine de recomendação
4. Implementar componentes React
5. Adicionar sistema de analytics

---
🚀 **MatchIt Recommendation System** - Transformando conexões em relacionamentos significativos
"""
        
        # Escrever arquivo
        progress_file_path = self.project_root / ".recommendation-system-progress.md"
        with open(progress_file_path, 'w', encoding='utf-8') as f:
            f.write(progress_content)
        
        print("✅ Arquivo de progresso criado: .recommendation-system-progress.md")
    
    def print_dependencies_info(self) -> None:
        """Imprime informações sobre dependências"""
        print()
        print("📦 Dependências que serão necessárias:")
        
        for category, deps in self.dependencies.items():
            print(f"{category.title()}:")
            for dep in deps:
                print(f"  - {dep}")
            print()
    
    def print_next_steps(self) -> None:
        """Imprime os próximos passos"""
        print("🎉 Setup concluído! Execute os próximos comandos conforme os arquivos forem criados.")
        print()
        print("📋 Próximos passos:")
        print("1. Implementar tipos base (Fase 1.1)")
        print("2. Executar migrações de banco (Fase 1.2)")
        print("3. Implementar extensões de backend (Fase 1.3)")
        print("4. Testar compatibilidade com sistema atual")
        print()
        print("💡 Dica: Acompanhe o progresso no arquivo .recommendation-system-progress.md")
        print()
        print("🔧 Para instalar dependências Python para migrations:")
        print("   pip install psycopg2-binary python-dotenv")
        print()
        print("🚀 Para executar as migrations (após implementar os SQLs):")
        print("   python run_all_migrations.py")
    
    def create_requirements_file(self) -> None:
        """Cria arquivo requirements.txt para dependências Python"""
        requirements_content = """# Dependências Python para Sistema de Recomendação MatchIt

# Database
psycopg2-binary>=2.9.0

# Environment variables
python-dotenv>=1.0.0

# Utilities
typing-extensions>=4.0.0

# Development dependencies (opcional)
pytest>=7.0.0
pytest-asyncio>=0.21.0
black>=23.0.0
flake8>=6.0.0
mypy>=1.0.0
"""
        
        requirements_path = self.project_root / "requirements-recommendation.txt"
        with open(requirements_path, 'w', encoding='utf-8') as f:
            f.write(requirements_content)
        
        print("📦 Arquivo requirements-recommendation.txt criado para dependências Python")
    
    def run_setup(self) -> bool:
        """Executa o setup completo"""
        try:
            # Header
            self.print_header()
            
            # Verificar estrutura do projeto
            if not self.check_project_structure():
                return False
            
            # Criar estrutura de diretórios
            self.create_directory_structure()
            
            # Mostrar plano de implementação
            self.print_implementation_plan()
            
            # Criar arquivo de progresso
            self.create_progress_file()
            
            # Criar arquivo de requirements Python
            self.create_requirements_file()
            
            # Mostrar informações sobre dependências
            self.print_dependencies_info()
            
            # Próximos passos
            self.print_next_steps()
            
            return True
            
        except Exception as e:
            print(f"❌ Erro durante o setup: {e}")
            return False

def main() -> int:
    """Função principal"""
    setup = RecommendationSystemSetup()
    
    try:
        if setup.run_setup():
            return 0
        else:
            return 1
    except KeyboardInterrupt:
        print("\n⚠️  Setup cancelado pelo usuário")
        return 1
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
