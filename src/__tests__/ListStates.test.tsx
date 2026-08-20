import {
  EmptyState,
  ErrorState,
  ListState,
  LoadingState,
} from "@/components/ListStates";

// ListState is exercised as a pure function rather than through
// @testing-library/react-native: RNTL 14 requires a `test-renderer` peer that
// does not work under the jest-expo 57 preset (render() returns an object with
// no queries), and RNTL 13 will not resolve against React 19. The ordering
// this guards — loading before empty — is the actual bug from the issue, and
// it is fully observable from which element the function returns.

const props = {
  emptyMessage: "No posts found",
  errorMessage: "Could not load posts",
  endMessage: "No more posts",
};

const renderState = (over: Record<string, unknown> = {}) =>
  (ListState as (p: any) => any)({ ...props, ...over });

describe("ListState", () => {
  it("shows the empty state when there is genuinely nothing", () => {
    const el = renderState({ isEmpty: true });

    expect(el.type).toBe(EmptyState);
    expect(el.props.message).toBe("No posts found");
  });

  it("never shows the empty state while the first page is loading", () => {
    // The reported bug: "No posts found" flashed for ~400 ms on every open,
    // because the empty check ran before the loading check.
    const el = renderState({ isLoading: true, isEmpty: true });

    expect(el.type).toBe(LoadingState);
  });

  it("prefers the error state over the empty state", () => {
    const el = renderState({
      isEmpty: true,
      isError: true,
      error: new Error("Network unreachable"),
    });

    expect(el.type).toBe(ErrorState);
    expect(el.props.message).toBe("Network unreachable");
  });

  it("falls back to the generic message when the error carries none", () => {
    const el = renderState({ isError: true, error: undefined });

    expect(el.props.message).toBe("Could not load posts");
  });

  it("passes the retry handler through", () => {
    const onRetry = jest.fn();
    const el = renderState({ isError: true, onRetry });

    expect(el.props.onRetry).toBe(onRetry);
  });

  it("shows a compact loader while fetching another page", () => {
    const el = renderState({ isFetchingMore: true });

    expect(el.type).toBe(LoadingState);
    expect(el.props.compact).toBe(true);
  });

  it("shows the end message once a populated list is exhausted", () => {
    const el = renderState({});

    expect(el.props.children).toBe("No more posts");
  });

  it("renders nothing at the end when no end message is given", () => {
    expect(renderState({ endMessage: undefined })).toBeNull();
  });
});
