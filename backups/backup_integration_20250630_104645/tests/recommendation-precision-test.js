// tests/recommendation-precision-test.js - Teste de precisão do algoritmo de recomendação
const axios = require('axios');

class RecommendationPrecisionTest {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
        this.testUsers = [];
        this.testResults = {
            passed: 0,
            failed: 0,
            warnings: 0,
            metrics: {}
        };
    }

    // Utilitários de logging
    log(message, type = 'info') {
        const colors = {
            success: '\x1b[32m✅',
            error: '\x1b[31m❌',
            warning: '\x1b[33m⚠️ ',
            info: '\x1b[34mℹ️ ',
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]} ${message}${colors.reset}`);
    }

    // Criar usuários de teste com perfis diversos
    async createTestUsers() {
        this.log('Criando usuários de teste com perfis diversos...', 'info');
        
        const testProfiles = [
            {
                name: 'Ana Casual',
                email: 'ana.casual@test.com',
                age: 25,
                location: { lat: -15.7942, lng: -47.8822 }, // Brasília
                preferences: {
                    ageRange: [23, 30],
                    maxDistance: 50
                },
                stylePreferences: {
                    cores: { preferredColors: ['blue', 'green'], intensity: 0.8 },
                    estilos: { casualness: 0.9, elegance: 0.3 }
                },
                personalityVector: [0.7, 0.5, 0.8, 0.6, 0.4] // Extrovert, friendly
            },
            {
                name: 'Bruno Elegante',
                email: 'bruno.elegante@test.com',
                age: 28,
                location: { lat: -15.7942, lng: -47.8822 },
                preferences: {
                    ageRange: [24, 32],
                    maxDistance: 30
                },
                stylePreferences: {
                    cores: { preferredColors: ['black', 'white'], intensity: 0.9 },
                    estilos: { casualness: 0.2, elegance: 0.9 }
                },
                personalityVector: [0.4, 0.8, 0.6, 0.9, 0.7] // More introverted, sophisticated
            },
            {
                name: 'Carla Artística',
                email: 'carla.artistica@test.com',
                age: 26,
                location: { lat: -15.7942, lng: -47.8822 },
                preferences: {
                    ageRange: [22, 35],
                    maxDistance: 100
                },
                stylePreferences: {
                    cores: { preferredColors: ['purple', 'orange'], intensity: 0.9 },
                    estilos: { casualness: 0.6, elegance: 0.4, creativity: 0.9 }
                },
                personalityVector: [0.8, 0.3, 0.9, 0.5, 0.8] // Creative, independent
            }
        ];

        for (const profile of testProfiles) {
            try {
                const response = await axios.post(`${this.baseURL}/auth/register`, {
                    email: profile.email,
                    password: 'test123456',
                    name: profile.name
                });

                if (response.data.token) {
                    // Atualizar perfil com dados detalhados
                    await axios.put(`${this.baseURL}/profile`, profile, {
                        headers: { Authorization: `Bearer ${response.data.token}` }
                    });

                    this.testUsers.push({
                        ...profile,
                        id: response.data.user.id,
                        token: response.data.token
                    });
                    
                    this.log(`Usuário criado: ${profile.name}`, 'success');
                    this.testResults.passed++;
                } else {
                    throw new Error('Token não retornado');
                }
            } catch (error) {
                this.log(`Erro ao criar usuário ${profile.name}: ${error.message}`, 'error');
                this.testResults.failed++;
            }
        }
    }

    // Testar precisão das recomendações
    async testRecommendationPrecision() {
        this.log('Testando precisão das recomendações...', 'info');
        
        for (const user of this.testUsers) {
            try {
                // Obter recomendações
                const response = await axios.get(`${this.baseURL}/recommendations`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                    params: { limit: 10 }
                });

                const recommendations = response.data.recommendations || response.data;
                
                if (!Array.isArray(recommendations)) {
                    throw new Error('Recomendações não retornadas como array');
                }

                // Analisar qualidade das recomendações
                const analysis = this.analyzeRecommendations(user, recommendations);
                
                this.log(`${user.name}: ${recommendations.length} recomendações recebidas`, 'info');
                this.log(`  Relevância média: ${analysis.averageRelevance.toFixed(2)}`, 'info');
                this.log(`  Diversidade: ${analysis.diversity.toFixed(2)}`, 'info');
                
                // Armazenar métricas
                this.testResults.metrics[user.name] = analysis;
                
                if (analysis.averageRelevance > 0.6) {
                    this.testResults.passed++;
                } else {
                    this.testResults.failed++;
                    this.log(`  Relevância baixa para ${user.name}`, 'warning');
                }

            } catch (error) {
                this.log(`Erro ao obter recomendações para ${user.name}: ${error.message}`, 'error');
                this.testResults.failed++;
            }
        }
    }

    // Analisar qualidade das recomendações
    analyzeRecommendations(user, recommendations) {
        let totalRelevance = 0;
        let ageMatches = 0;
        let locationMatches = 0;
        let styleMatches = 0;
        
        const uniqueProfiles = new Set();

        for (const rec of recommendations) {
            let relevanceScore = 0;
            
            // Verificar critérios de idade
            if (rec.age >= user.preferences.ageRange[0] && 
                rec.age <= user.preferences.ageRange[1]) {
                relevanceScore += 0.3;
                ageMatches++;
            }
            
            // Verificar localização (simplificado)
            if (rec.location && this.calculateDistance(user.location, rec.location) <= user.preferences.maxDistance) {
                relevanceScore += 0.2;
                locationMatches++;
            }
            
            // Verificar compatibilidade de estilo (se dados disponíveis)
            if (rec.stylePreferences && user.stylePreferences) {
                const styleCompatibility = this.calculateStyleCompatibility(
                    user.stylePreferences, 
                    rec.stylePreferences
                );
                relevanceScore += styleCompatibility * 0.3;
                if (styleCompatibility > 0.5) styleMatches++;
            }
            
            // Verificar se há score de compatibilidade
            if (rec.compatibilityScore) {
                relevanceScore += rec.compatibilityScore * 0.2;
            }
            
            totalRelevance += relevanceScore;
            uniqueProfiles.add(rec.id);
        }

        return {
            averageRelevance: recommendations.length > 0 ? totalRelevance / recommendations.length : 0,
            diversity: uniqueProfiles.size / recommendations.length,
            ageMatchRate: recommendations.length > 0 ? ageMatches / recommendations.length : 0,
            locationMatchRate: recommendations.length > 0 ? locationMatches / recommendations.length : 0,
            styleMatchRate: recommendations.length > 0 ? styleMatches / recommendations.length : 0,
            totalRecommendations: recommendations.length
        };
    }

    // Calcular compatibilidade de estilo
    calculateStyleCompatibility(style1, style2) {
        let compatibility = 0;
        let comparisons = 0;

        // Comparar cores
        if (style1.cores && style2.cores) {
            const colors1 = style1.cores.preferredColors || [];
            const colors2 = style2.cores.preferredColors || [];
            const commonColors = colors1.filter(color => colors2.includes(color));
            compatibility += commonColors.length / Math.max(colors1.length, colors2.length, 1);
            comparisons++;
        }

        // Comparar estilos
        if (style1.estilos && style2.estilos) {
            const casualDiff = Math.abs((style1.estilos.casualness || 0) - (style2.estilos.casualness || 0));
            const eleganceDiff = Math.abs((style1.estilos.elegance || 0) - (style2.estilos.elegance || 0));
            compatibility += (2 - casualDiff - eleganceDiff) / 2;
            comparisons++;
        }

        return comparisons > 0 ? compatibility / comparisons : 0;
    }

    // Calcular distância simples (aproximada)
    calculateDistance(loc1, loc2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
        const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Testar sistema de feedback
    async testFeedbackSystem() {
        this.log('Testando sistema de feedback...', 'info');
        
        for (let i = 0; i < this.testUsers.length - 1; i++) {
            const user = this.testUsers[i];
            const targetUser = this.testUsers[i + 1];
            
            try {
                // Enviar feedback positivo
                await axios.post(`${this.baseURL}/recommendations/feedback`, {
                    targetUserId: targetUser.id,
                    action: 'like'
                }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                
                this.log(`Feedback enviado: ${user.name} → ${targetUser.name}`, 'success');
                this.testResults.passed++;
                
            } catch (error) {
                this.log(`Erro no feedback ${user.name} → ${targetUser.name}: ${error.message}`, 'error');
                this.testResults.failed++;
            }
        }
    }

    // Testar performance do algoritmo
    async testPerformance() {
        this.log('Testando performance do algoritmo...', 'info');
        
        const user = this.testUsers[0];
        if (!user) return;

        const startTime = Date.now();
        
        try {
            // Fazer múltiplas requisições para medir performance
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    axios.get(`${this.baseURL}/recommendations`, {
                        headers: { Authorization: `Bearer ${user.token}` },
                        params: { limit: 20 }
                    })
                );
            }
            
            await Promise.all(promises);
            const endTime = Date.now();
            const avgTime = (endTime - startTime) / 5;
            
            this.log(`Tempo médio de resposta: ${avgTime}ms`, 'info');
            
            if (avgTime < 1000) {
                this.log('Performance: Excelente (< 1s)', 'success');
                this.testResults.passed++;
            } else if (avgTime < 3000) {
                this.log('Performance: Aceitável (< 3s)', 'warning');
                this.testResults.warnings++;
            } else {
                this.log('Performance: Lenta (> 3s)', 'error');
                this.testResults.failed++;
            }
            
        } catch (error) {
            this.log(`Erro no teste de performance: ${error.message}`, 'error');
            this.testResults.failed++;
        }
    }

    // Limpar dados de teste
    async cleanup() {
        this.log('Removendo usuários de teste...', 'info');
        
        for (const user of this.testUsers) {
            try {
                await axios.delete(`${this.baseURL}/profile`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                this.log(`Usuário removido: ${user.name}`, 'success');
            } catch (error) {
                this.log(`Erro ao remover ${user.name}: ${error.message}`, 'warning');
            }
        }
    }

    // Gerar relatório final
    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DE PRECISÃO DO SISTEMA DE RECOMENDAÇÃO');
        console.log('='.repeat(60));
        
        console.log(`\n📈 RESULTADOS GERAIS:`);
        console.log(`  ✅ Testes Passaram: ${this.testResults.passed}`);
        console.log(`  ❌ Testes Falharam: ${this.testResults.failed}`);
        console.log(`  ⚠️  Avisos: ${this.testResults.warnings}`);
        
        const total = this.testResults.passed + this.testResults.failed;
        const successRate = total > 0 ? (this.testResults.passed / total * 100).toFixed(1) : 0;
        console.log(`  📊 Taxa de Sucesso: ${successRate}%`);
        
        console.log(`\n🎯 MÉTRICAS DE PRECISÃO:`);
        for (const [userName, metrics] of Object.entries(this.testResults.metrics)) {
            console.log(`\n  👤 ${userName}:`);
            console.log(`    • Relevância Média: ${(metrics.averageRelevance * 100).toFixed(1)}%`);
            console.log(`    • Diversidade: ${(metrics.diversity * 100).toFixed(1)}%`);
            console.log(`    • Taxa de Match por Idade: ${(metrics.ageMatchRate * 100).toFixed(1)}%`);
            console.log(`    • Taxa de Match por Localização: ${(metrics.locationMatchRate * 100).toFixed(1)}%`);
            console.log(`    • Taxa de Match por Estilo: ${(metrics.styleMatchRate * 100).toFixed(1)}%`);
        }
        
        console.log(`\n🏆 AVALIAÇÃO GERAL:`);
        if (successRate >= 80) {
            this.log('Sistema de recomendação funcionando bem!', 'success');
        } else if (successRate >= 60) {
            this.log('Sistema de recomendação funcional, mas precisa melhorias', 'warning');
        } else {
            this.log('Sistema de recomendação precisa revisão significativa', 'error');
        }
        
        console.log(`\n🔧 SUGESTÕES DE MELHORIA:`);
        console.log(`  • Implementar perfil emocional para maior precisão`);
        console.log(`  • Adicionar filtragem colaborativa`);
        console.log(`  • Implementar sistema de aprendizado adaptativo`);
        console.log(`  • Melhorar algoritmo de compatibilidade de estilo`);
        console.log(`  • Adicionar mais fatores de personalidade`);
    }

    // Executar todos os testes
    async runAllTests() {
        try {
            console.log('🚀 Iniciando testes de precisão do sistema de recomendação...\n');
            
            await this.createTestUsers();
            await this.testRecommendationPrecision();
            await this.testFeedbackSystem();
            await this.testPerformance();
            
            this.generateReport();
            
        } catch (error) {
            this.log(`Erro crítico durante os testes: ${error.message}`, 'error');
        } finally {
            await this.cleanup();
        }
    }
}

// Executar testes se chamado diretamente
if (require.main === module) {
    const tester = new RecommendationPrecisionTest();
    tester.runAllTests().then(() => {
        console.log('\n✅ Testes de precisão concluídos!');
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erro nos testes:', error.message);
        process.exit(1);
    });
}

module.exports = RecommendationPrecisionTest;