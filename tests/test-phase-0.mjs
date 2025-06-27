// tests/test-phase-0.mjs - Teste da Fase 0 completа
import http from 'http';

const API_BASE = 'http://localhost:3000';

// Função helper para fazer requests
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const reqOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = http.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// Testes
async function runTests() {
    console.log('🧪 Iniciando testes da Fase 0...\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Teste 1: Health check
    totalTests++;
    console.log('1️⃣  Testando health check...');
    try {
        const response = await makeRequest('/api/health');
        if (response.status === 200 && response.data.status === 'healthy') {
            console.log('   ✅ Health check OK');
            passedTests++;
        } else {
            console.log('   ❌ Health check falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 2: Buscar preferências (deve retornar vazio inicialmente)
    totalTests++;
    console.log('2️⃣  Testando GET /api/profile/style-preferences...');
    try {
        const response = await makeRequest('/api/profile/style-preferences');
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ GET style-preferences OK');
            console.log('   📊 Dados retornados:', JSON.stringify(response.data.data, null, 2));
            passedTests++;
        } else {
            console.log('   ❌ GET style-preferences falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 3: Criar preferência
    totalTests++;
    console.log('3️⃣  Testando PUT /api/profile/style-preferences...');
    try {
        const response = await makeRequest('/api/profile/style-preferences', {
            method: 'PUT',
            body: {
                category: 'colors',
                questionId: 'warm_vs_cool',
                selectedOption: 'warm_colors',
                preferenceStrength: 0.8
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ PUT style-preferences OK');
            console.log('   💾 Preferência criada:', response.data.data.selectedOption);
            passedTests++;
        } else {
            console.log('   ❌ PUT style-preferences falhou');
            console.log('   📋 Response:', response.data);
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 4: Buscar preferências novamente (deve retornar a criada)
    totalTests++;
    console.log('4️⃣  Testando GET após criar preferência...');
    try {
        const response = await makeRequest('/api/profile/style-preferences');
        if (response.status === 200 && response.data.success) {
            const hasColors = response.data.data.colors && response.data.data.colors.warm_vs_cool;
            if (hasColors) {
                console.log('   ✅ Preferência persistida corretamente');
                console.log('   📊 Valor salvo:', response.data.data.colors.warm_vs_cool.selectedOption);
                passedTests++;
            } else {
                console.log('   ❌ Preferência não foi persistida');
            }
        } else {
            console.log('   ❌ GET após create falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 5: Testar batch update
    totalTests++;
    console.log('5️⃣  Testando POST /api/profile/style-preferences/batch...');
    try {
        const response = await makeRequest('/api/profile/style-preferences/batch', {
            method: 'POST',
            body: {
                preferences: {
                    styles: {
                        casual_vs_formal: { selectedOption: 'casual', preferenceStrength: 0.9 },
                        minimalist_vs_bold: { selectedOption: 'minimalist', preferenceStrength: 0.7 }
                    },
                    accessories: {
                        gold_vs_silver: { selectedOption: 'silver', preferenceStrength: 0.6 }
                    }
                }
            }
        });
        
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Batch update OK');
            console.log('   💾 Preferências atualizadas:', response.data.totalUpdated);
            passedTests++;
        } else {
            console.log('   ❌ Batch update falhou');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Teste 6: Testar estatísticas
    totalTests++;
    console.log('6️⃣  Testando GET /api/profile/style-preferences/stats...');
    try {
        const response = await makeRequest('/api/profile/style-preferences/stats');
        if (response.status === 200 && response.data.success) {
            console.log('   ✅ Estatísticas OK');
            console.log('   📊 Completude:', response.data.data.completionPercentage + '%');
            console.log('   📊 Respostas:', response.data.data.totalAnsweredQuestions);
            passedTests++;
        } else {
            console.log('   ❌ Estatísticas falharam');
        }
    } catch (error) {
        console.log('   ❌ Erro:', error.message);
    }
    
    // Relatório final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RELATÓRIO FINAL DOS TESTES - FASE 0');
    console.log('='.repeat(50));
    console.log(`✅ Testes passados: ${passedTests}/${totalTests}`);
    console.log(`📊 Taxa de sucesso: ${Math.round((passedTests/totalTests)*100)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 FASE 0 COMPLETAMENTE FUNCIONAL!');
        console.log('✅ Integração PostgreSQL OK');
        console.log('✅ Todas as operações CRUD funcionando');
        console.log('✅ Persistência de dados confirmada');
        console.log('🚀 Pronto para Fase 1!');
    } else {
        console.log('⚠️  Alguns testes falharam. Revisar implementação.');
    }
    
    process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch(console.error);
