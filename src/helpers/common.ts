import { Dimensions } from "react-native";

// Read at call time, not once at module load: the old module-level snapshot
// was captured before the first render and never changed, so every value was
// wrong after a rotation or a foldable resize.
//
// Note this still only helps values computed during render. Styles built by
// StyleSheet.create() at module scope are evaluated once by definition —
// making those react to size changes means building them inside components
// from useWindowDimensions(), which is the responsive/font-scaling work in
// issue #48.
export const hp = (percentage: number): number =>
  (Dimensions.get("window").height * percentage) / 100;

export const wp = (percentage: number): number =>
  (Dimensions.get("window").width * percentage) / 100;
