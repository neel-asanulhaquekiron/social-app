import { Stack } from "expo-router";

// Own navigator for the authenticated group so the root layout can guard it
// as a single `(main)` screen.
const MainGroupLayout = () => {
  return <Stack screenOptions={{ headerShown: false }} />;
};

export default MainGroupLayout;
