import type { AppTheme } from "@/constants/theme";
import { darkTheme, lightTheme } from "@/constants/theme";
import { useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

/** The palette for the device's current colour scheme. */
export const useTheme = (): AppTheme => {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
};

/**
 * Builds a StyleSheet from the active theme.
 *
 * StyleSheet.create() at module scope captures colours once, which is why the
 * app was stuck in light mode despite `userInterfaceStyle: "automatic"`.
 * Declaring styles through makeStyles() keeps the same authoring shape while
 * letting the palette change:
 *
 *   const useStyles = makeStyles((theme) => ({ box: { backgroundColor: theme.colors.surface } }));
 *   // inside the component:
 *   const styles = useStyles();
 *
 * The result is memoised per scheme, so styles are rebuilt only when the
 * colour scheme actually changes.
 */
export const makeStyles = <T extends Record<string, any>>(
  factory: (theme: AppTheme) => T,
) => {
  const cache = new Map<boolean, T>();

  return (): T => {
    const activeTheme = useTheme();

    return useMemo(() => {
      const cached = cache.get(activeTheme.isDark);
      if (cached) return cached;

      const created = StyleSheet.create(factory(activeTheme));
      cache.set(activeTheme.isDark, created);
      return created;
    }, [activeTheme]);
  };
};
