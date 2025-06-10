#!/usr/bin/env python3
import os
import sys

# Configuracao de encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    import psycopg2
    print("psycopg2 importado com sucesso")
    
    # Configuracao do banco
    config = {
        'host': 'localhost',
        'port': 5432,
        'user': 'matchit',
        'password': 'matchit123',
        'database': 'matchit_db'
    }
    
    print("Tentando conectar...")
    conn = psycopg2.connect(**config)
    print("Conexao estabelecida!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"PostgreSQL version: {version[0]}")
    
    cursor.execute("SELECT current_database();")
    db = cursor.fetchone()
    print(f"Database: {db[0]}")
    
    cursor.execute("SHOW client_encoding;")
    encoding = cursor.fetchone()
    print(f"Client encoding: {encoding[0]}")
    
    conn.close()
    print("Teste concluido com sucesso!")
    
except Exception as e:
    print(f"Erro: {e}")
    print(f"Tipo do erro: {type(e)}")
