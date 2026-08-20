import Loading from "@/components/Loading";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { View } from "react-native";

// Anchor route. Declarative redirect instead of an imperative
// router.replace(), so it can't race the notification deep-link handler on a
// cold start.
const Index = () => {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Loading />
      </View>
    );
  }

  return <Redirect href={user ? "/home" : "/welcome"} />;
};

export default Index;
