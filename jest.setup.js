// Silence the Reanimated / native-module noise that jest-expo can't stub.
jest.mock("react-native-get-random-values", () => ({}), { virtual: true });
