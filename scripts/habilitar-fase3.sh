#!/bin/bash

# =================================================================
# FASE 3: HABILITAR SETTINGSSCREEN
# =================================================================

APP_FILE="src/App.tsx"
BACKUP_FILE="src/App.tsx.backup-fase2-$(date +%H%M%S)"

echo "================================================================="
echo "🚀 HABILITANDO FASE 3: LOGIN + PROFILE + SETTINGS"
echo "================================================================="

# Verificar se o arquivo App.tsx existe
if [ ! -f "$APP_FILE" ]; then
    echo "[✗] Erro: Arquivo $APP_FILE não encontrado."
    exit 1
fi

# Fazer backup do App.tsx atual
echo "[INFO] Fazendo backup do App.tsx atual para $BACKUP_FILE..."
cp "$APP_FILE" "$BACKUP_FILE"

echo "[INFO] Habilitando SettingsScreen e sua rota..."

# Habilitar a importação e a rota da SettingsScreen
# Usamos sed para descomentar as linhas corretas
sed -i -e 's|// import SettingsScreen from "./screens/SettingsScreen";|import SettingsScreen from "./screens/SettingsScreen";|' \
       -e 's|// <Route path="/settings" element={<ProtectedRoute><SettingsScreen \/> </ProtectedRoute>} \/>|<Route path="/settings" element={<ProtectedRoute><SettingsScreen />} />} />|' \
       "$APP_FILE"

# Verificação final
if grep -q 'import SettingsScreen from "./screens/SettingsScreen";' "$APP_FILE" && grep -q '<Route path="/settings"' "$APP_FILE"; then
    echo "[✔] Sucesso! SettingsScreen foi habilitada no App.tsx."
    echo "-----------------------------------------------------------------"
    echo "Para testar, execute:"
    echo "npm run dev"
    echo "-----------------------------------------------------------------"
else
    echo "[✗] Erro: Falha ao habilitar a SettingsScreen no App.tsx."
    echo "[INFO] Restaurando o backup..."
    cp "$BACKUP_FILE" "$APP_FILE"
fi
