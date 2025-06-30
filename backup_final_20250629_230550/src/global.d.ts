
// global.d.ts
import * as RechartsLibrary from 'recharts';

declare global {
  interface Window {
    Recharts: typeof RechartsLibrary;
  }
}

// This export statement is needed to make the file a module
export {};
