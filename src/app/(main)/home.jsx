import ScreenWrapper from "@/components/ScreenWrapper";
import { supabase } from "@/lib/supabase";
import { Alert, Button, StyleSheet, Text } from "react-native";

const Home = () => {
  const onLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  return (
    <ScreenWrapper>
      <Text>Home</Text>
      <Button title="logout" onPress={onLogout} />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({});
