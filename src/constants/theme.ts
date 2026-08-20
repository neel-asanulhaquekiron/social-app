export const theme = {
  colors: {
    primary: "#00C26F",
    primaryDark: "#00AC62",
    // Referenced by NotificationItem for the unread highlight; it used to fall
    // back to a hardcoded "#e0f7fa" because the key did not exist.
    primaryLight: "#e6f9f1",

    dark: "#3E3E3E",
    darkLight: "#e1e1e1",
    gray: "#e3e3e3",
    // Referenced by newPost; without it borderColor was undefined.
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
  },
  fonts: {
    medium: "500",
    semiBold: "600",
    bold: "700",
    extraBold: "800",
  },
  radius: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
  },
};
