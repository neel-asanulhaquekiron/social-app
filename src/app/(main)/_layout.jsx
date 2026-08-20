import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";

// Own navigator for the authenticated group so the root layout can guard it
// as a single `(main)` screen.
const MainGroupLayout = () => {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
};

export default MainGroupLayout;
