export type StylistColorScheme = 'light' | 'dark';
export type StylistColorMode = 'bg' | 'automatic';
export type StylistFamilyMode = 'one' | 'two';

export interface StylistColorPalette {
  background: string;
  surface: string;
  text: string;
  primary: string;
  secondary: string;
  success: string;
  warning: string;
}

export interface StylistSemanticFamilies {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
}

export interface StylistThemeTokens {
  version: 1;
  colorSystem: {
    mode: StylistColorMode;
    previewScheme: StylistColorScheme;
    familyMode: StylistFamilyMode;
  };
  families: {
    light: StylistSemanticFamilies;
    dark: StylistSemanticFamilies;
  };
  palettes: {
    bg: {
      light: StylistColorPalette;
      dark: StylistColorPalette;
    };
    automatic: {
      light: StylistColorPalette;
      dark: StylistColorPalette;
    };
  };
  colors: {
    light: StylistColorPalette;
    dark: StylistColorPalette;
  };
  typography: {
    fontFamily: string;
    fontDisplay: string;
    fontTitle: string;
    fontSubtitle: string;
    fontBody: string;
    fontCaption: string;
    fontMono: string;
    displaySize: number;
    headingSize: number;
    bodySize: number;
    captionSize: number;
  };
  layout: {
    radius: number;
    spacing: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
  };
}

export const stylistThemeTokens: StylistThemeTokens = {
  version: 1,
  colorSystem: {
    mode: 'bg',
    previewScheme: 'light',
    familyMode: 'one',
  },
  families: {
    light: {
      primary: 'emerald',
      secondary: 'coral',
      success: 'emerald',
      warning: 'amber',
    },
    dark: {
      primary: 'emerald',
      secondary: 'coral',
      success: 'emerald',
      warning: 'amber',
    },
  },
  palettes: {
    bg: {
      light: {
        background: '#f7f5ef',
        surface: '#e5eee3',
        text: '#263d32',
        primary: '#386c54',
        secondary: '#ce7a67',
        success: '#4d865e',
        warning: '#b96c47',
      },
      dark: {
        background: '#1e2b23',
        surface: '#2c3b31',
        text: '#f5f2e9',
        primary: '#91b99b',
        secondary: '#e29683',
        success: '#83bd8f',
        warning: '#e9a179',
      },
    },
    automatic: {
      light: {
        background: '#f7f5ef',
        surface: '#e5eee3',
        text: '#263d32',
        primary: '#386c54',
        secondary: '#ce7a67',
        success: '#4d865e',
        warning: '#b96c47',
      },
      dark: {
        background: '#1e2b23',
        surface: '#2c3b31',
        text: '#f5f2e9',
        primary: '#91b99b',
        secondary: '#e29683',
        success: '#83bd8f',
        warning: '#e9a179',
      },
    },
  },
  colors: {
    light: {
      background: '#f7f5ef',
      surface: '#e5eee3',
      text: '#263d32',
      primary: '#386c54',
      secondary: '#ce7a67',
      success: '#4d865e',
      warning: '#b96c47',
    },
    dark: {
      background: '#1e2b23',
      surface: '#2c3b31',
      text: '#f5f2e9',
      primary: '#91b99b',
      secondary: '#e29683',
      success: '#83bd8f',
      warning: '#e9a179',
    },
  },
  typography: {
    fontFamily: 'System',
    fontDisplay: 'System',
    fontTitle: 'System',
    fontSubtitle: 'System',
    fontBody: 'System',
    fontCaption: 'System',
    fontMono: 'monospace',
    displaySize: 32,
    headingSize: 20,
    bodySize: 15,
    captionSize: 12,
  },
  layout: {
    radius: 12,
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
  },
};

export default stylistThemeTokens;
