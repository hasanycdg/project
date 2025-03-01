import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import '@/types/theme';

const fontConfig = {
  fontFamily: 'System',
};

const theme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,
    primary: '#00D37F',
    primaryContainer: '#CCF4E3',
    secondary: '#2B2D42',
    secondaryContainer: '#E9E9EC',
    error: '#DC3545',
    warning: '#FB8C00',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    subtext: '#666666',
  },
};

export default theme;
