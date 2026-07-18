import ScreenWrapper from "@/components/ScreenWrapper";
import { useRouter } from "expo-router";
import { Button, Text } from "react-native";

const index = () => {
  const router = useRouter();
  return (
    <ScreenWrapper>
      <Text>index</Text>
      <Button title="Go to Welcome" onPress={() => router.push("welcome")} />
    </ScreenWrapper>
  );
};

export default index;
