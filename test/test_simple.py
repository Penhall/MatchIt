#!/usr/bin/env python3
import os
import sys

try:
    import psycopg2
    print("psycopg2 OK")
    
    config = {
        'host': 'localhost',
        'port': 5432,
        'user': 'matchit',
        'password': 'matchit123',
        'database': 'matchit_db'
    }
    
    print("Conectando...")
    conn = psycopg2.connect(**config)
    print("Conexao OK!")
    
    cursor = conn.cursor()
    cursor.execute("SELECT current_database();")
    db = cursor.fetchone()
    print(f"Database: {db[0]}")
    
    conn.close()
    print("Teste concluido!")
    
except Exception as e:
    print(f"Erro: {e}")
