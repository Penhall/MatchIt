// Tipos globais para resolver problemas de módulos
declare module 'analytics';
declare module 'recommendation';
declare module '@hooks/useApi' {
  import { AxiosInstance } from 'axios';
  const useApi: () => AxiosInstance;
  export default useApi;
}
