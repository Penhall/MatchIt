import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Recursos de tradução
const resources = {
  'pt-BR': {
    translation: {
      // Navegação
      nav: {
        profile: 'Perfil',
        style: 'Estilo',
        matches: 'Matches',
        chats: 'Chats',
        shop: 'Shop',
        settings: 'Configurações'
      },
      
      // Login
      login: {
        title: 'MatchIt',
        subtitle: 'Conecte-se além da superfície',
        email: 'E-mail',
        password: 'Senha',
        signIn: 'Entrar',
        signUp: 'Registrar',
        alreadyHaveAccount: 'Já tem uma conta? Entre',
        noAccount: 'Não tem conta? Registre-se',
        authError: 'Erro na autenticação',
        passwordsDontMatch: 'Senhas não coincidem'
      },
      
      // Perfil
      profile: {
        title: 'Meu Perfil',
        editProfile: 'Editar Perfil & Fotos',
        styleProgress: 'Progresso do Perfil de Estilo',
        adjustStyle: 'Ajustar Seu Estilo',
        accountOptions: 'Opções da Conta',
        edit: {
          title: 'Editar Perfil',
          displayName: 'Nome de Exibição',
          city: 'Cidade',
          saveChanges: 'Salvar Alterações'
        }
      },
      
      // Torneios
      tournament: {
        title: 'Torneio de Estilos',
        selectCategory: 'Escolha uma Categoria',
        startTournament: 'Iniciar Torneio',
        round: 'Rodada {{current}} de {{total}}',
        choosePreferred: 'Escolha sua preferência',
        results: 'Resultados do Torneio',
        champion: 'Campeão',
        finalist: 'Finalista',
        playAgain: 'Jogar Novamente',
        categories: {
          cores: 'Cores',
          estilos: 'Estilos',
          ambientes: 'Ambientes'
        }
      },
      
      // Configurações
      settings: {
        title: 'Configurações',
        appearance: 'Aparência',
        darkMode: 'Modo Escuro',
        notifications: 'Notificações',
        account: 'Conta',
        logout: 'Sair',
        privacy: 'Privacidade',
        language: 'Idioma'
      },
      
      // Comum
      common: {
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        cancel: 'Cancelar',
        save: 'Salvar',
        edit: 'Editar',
        delete: 'Excluir',
        confirm: 'Confirmar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        finish: 'Finalizar'
      },
      
      // Shop
      shop: {
        title: 'Shop',
        curatedForYou: 'Curado Para Você',
        exclusiveDrops: 'Drops Exclusivos',
        recommendedProducts: 'Produtos Recomendados',
        buyNow: 'Comprar Agora'
      },
      
      // Matches
      matches: {
        title: 'Seus Matches',
        noMatches: 'Nenhum match ainda',
        compatibility: 'Compatibilidade',
        newMatch: 'Novo Match!'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    lng: 'pt-BR',
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
