import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { makeStyles } from "@/hooks/useTheme";
import { Redirect } from "expo-router";
import { View } from "react-native";

// Anchor route. Declarative redirect instead of an imperative
// router.replace(), so it can't race the notification deep-link handler on a
// cold start.
const Index = () => {
  const styles = useStyles();
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Loading />
      </View>
    );
  }

  return <Redirect href={user ? "/home" : "/welcome"} />;
};

export default Index;

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // Without this the view is transparent and falls through to the
    // navigator's background, which is white — so the first thing shown on a
    // cold start flashed white in dark mode.
    backgroundColor: theme.colors.background,
  },
}));
