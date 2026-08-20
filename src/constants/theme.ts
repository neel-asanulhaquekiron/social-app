const fonts = {
  medium: "500",
  semiBold: "600",
  bold: "700",
  extraBold: "800",
} as const;

const radius = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
} as const;

const lightColors = {
  primary: "#00C26F",
  primaryDark: "#00AC62",
  primaryLight: "#e6f9f1",

  dark: "#3E3E3E",
  darkLight: "#e1e1e1",
  gray: "#e3e3e3",
  border: "#e3e3e3",

  surface: "#ffffff",
  background: "#ffffff",

  text: "#494949",
  textLight: "#7c7c7c",
  textDark: "#1d1d1d",
  onPrimary: "#ffffff",

  error: "#ff3333",
  errorSurface: "#ffe8e8",

  rose: "#ef4444",
  roseLight: "#f87171",
};

// Same token names, dark values — so nothing that consumes the theme needs to
// know which scheme is active.
const darkColors: typeof lightColors = {
  primary: "#00C26F",
  primaryDark: "#22D98C",
  primaryLight: "#10312a",

  dark: "#f5f5f5",
  darkLight: "#2a2a2a",
  gray: "#3a3a3a",
  border: "#3a3a3a",

  surface: "#1c1c1e",
  background: "#121214",

  text: "#e8e8ea",
  textLight: "#a1a1a8",
  textDark: "#ffffff",
  onPrimary: "#06281c",

  error: "#ff6b6b",
  errorSurface: "#3a1f1f",

  rose: "#f87171",
  roseLight: "#fca5a5",
};

export type AppTheme = {
  colors: typeof lightColors;
  fonts: typeof fonts;
  radius: typeof radius;
  isDark: boolean;
};

export const lightTheme: AppTheme = {
  colors: lightColors,
  fonts,
  radius,
  isDark: false,
};

export const darkTheme: AppTheme = {
  colors: darkColors,
  fonts,
  radius,
  isDark: true,
};

/**
 * Static export kept for module-scope use (a few places read radius/fonts
 * outside a component). Colours read from here are the light palette — use
 * useTheme()/makeStyles() for anything that must react to the colour scheme.
 */
export const theme = lightTheme;
