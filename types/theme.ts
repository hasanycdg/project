import { MD3Theme } from 'react-native-paper';

declare global {
  export interface CustomColors {
    warning: string;
  }
}

declare module 'react-native-paper' {
  export interface MD3Colors {
    warning: string;
  }
}
