import { darkTheme, lightTheme } from "@/constants/theme";

describe("theme palettes", () => {
  it("defines the same token names in both schemes", () => {
    // A token present in one palette but not the other renders as `undefined`
    // — which is exactly how theme.colors.border and primaryLight went
    // missing before (#49).
    expect(Object.keys(darkTheme.colors).sort()).toEqual(
      Object.keys(lightTheme.colors).sort(),
    );
  });

  it("actually uses different colours for the two schemes", () => {
    expect(darkTheme.colors.background).not.toBe(lightTheme.colors.background);
    expect(darkTheme.colors.text).not.toBe(lightTheme.colors.text);
    expect(darkTheme.colors.surface).not.toBe(lightTheme.colors.surface);
  });

  it("flags which scheme it is", () => {
    expect(lightTheme.isDark).toBe(false);
    expect(darkTheme.isDark).toBe(true);
  });

  it("shares fonts and radii, so only colour varies", () => {
    expect(darkTheme.fonts).toBe(lightTheme.fonts);
    expect(darkTheme.radius).toBe(lightTheme.radius);
  });

  it("has no undefined colour values", () => {
    for (const palette of [lightTheme.colors, darkTheme.colors]) {
      for (const [name, value] of Object.entries(palette)) {
        expect(`${name}:${value}`).toMatch(/:#[0-9a-f]{6}$/i);
      }
    }
  });

  it("keeps the font weight key that 11 call sites used to typo", () => {
    // `theme.fonts.semibold` (lowercase b) silently produced
    // fontWeight: undefined everywhere it was used.
    expect(lightTheme.fonts.semiBold).toBe("600");
    expect(
      (lightTheme.fonts as Record<string, string>).semibold,
    ).toBeUndefined();
  });
});
