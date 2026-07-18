import { Dimensions } from "react-native";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");

export const hp = (percentage) => {
  return (deviceHeight * percentage) / 100;
};

export const wp = (percentage) => {
  return (deviceWidth * percentage) / 100;
};

export const capped = (value, max) => Math.min(value, max);
