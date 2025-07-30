# simple_auth.py - Autenticação simplificada para debug
import streamlit as st

def simple_login():
    """Formulário de login simplificado"""
    st.title("🔐 Login Admin - DEBUG")
    
    # Mostrar credenciais na tela
    st.info("""
    **Credenciais válidas:**
    - admin / matchit_admin_2025
    - moderator / matchit_mod_2025
    """)
    
    username = st.text_input("Usuário:")
    password = st.text_input("Senha:", type="password")
    
    if st.button("Entrar"):
        # Verificação hardcoded para debug
        valid_users = {
            'admin': 'matchit_admin_2025',
            'moderator': 'matchit_mod_2025'
        }
        
        st.write(f"Usuário digitado: '{username}'")
        st.write(f"Senha digitada: '{password}'")
        st.write(f"Usuários válidos: {list(valid_users.keys())}")
        
        if username in valid_users and valid_users[username] == password:
            st.success("✅ Login bem-sucedido!")
            st.session_state.authenticated = True
            st.session_state.user = {'username': username}
            return True
        else:
            st.error("❌ Credenciais incorretas")
            if username in valid_users:
                st.write(f"Senha esperada: '{valid_users[username]}'")
            return False
    
    return False

# Teste
if __name__ == "__main__":
    simple_login()