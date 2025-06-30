#!/bin/bash
# Script para habilitar próxima fase rapidamente

echo "Escolha a fase para habilitar:"
echo "1) ProfileScreen"
echo "2) SettingsScreen" 
echo "3) StyleAdjustmentScreen"
echo "4) BottomNavbar"
echo "5) MatchAreaScreen"
echo "6) ChatScreen"
echo "7) VendorScreen"
echo ""
read -p "Digite o número da fase: " fase

case $fase in
    1)
        echo "Habilitando ProfileScreen..."
        sed -i.bak 's|// import ProfileScreen|import ProfileScreen|g' src/App.tsx
        sed -i.bak 's|// <Route path="/profile"|<Route path="/profile"|g' src/App.tsx
        echo "✅ ProfileScreen habilitado"
        ;;
    2)
        echo "Habilitando SettingsScreen..."
        sed -i.bak 's|// import SettingsScreen|import SettingsScreen|g' src/App.tsx
        sed -i.bak 's|// <Route path="/settings"|<Route path="/settings"|g' src/App.tsx
        echo "✅ SettingsScreen habilitado"
        ;;
    3)
        echo "⚠️  Habilitando StyleAdjustmentScreen (pode ter problemas)..."
        sed -i.bak 's|// import StyleAdjustmentScreen|import StyleAdjustmentScreen|g' src/App.tsx
        sed -i.bak 's|// <Route path="/style-adjustment"|<Route path="/style-adjustment"|g' src/App.tsx
        echo "✅ StyleAdjustmentScreen habilitado"
        ;;
    4)
        echo "Habilitando BottomNavbar..."
        sed -i.bak 's|// import BottomNavbar|import BottomNavbar|g' src/App.tsx
        sed -i.bak 's|// {isAuthenticated && <BottomNavbar />}|{isAuthenticated && <BottomNavbar />}|g' src/App.tsx
        echo "✅ BottomNavbar habilitado"
        ;;
    *)
        echo "Fase não implementada ainda"
        ;;
esac

echo ""
echo "Agora teste com: npm run dev"
