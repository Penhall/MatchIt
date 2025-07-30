# test_auth.py - Teste simples de autenticação
from config import AUTH_CONFIG

print("Testando configurações de autenticação:")
print(f"Usuários disponíveis: {list(AUTH_CONFIG['admin_users'].keys())}")

for username, user_data in AUTH_CONFIG['admin_users'].items():
    print(f"Usuário: {username}")
    print(f"Senha: {user_data['password']}")
    print(f"Role: {user_data['role']}")
    print("---")