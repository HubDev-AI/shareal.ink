// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { IframeWithFallback } from "@/components/surface/shared/iframe-with-fallback";

// Mock next/image to render a plain img
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, unoptimized, priority, ...rest } = props;
    return <img {...rest} data-fill={fill} />;
  },
}));

describe("IframeWithFallback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders fallback image immediately", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
      />
    );

    const layer = screen.getByTestId("fallback-layer");
    const img = layer.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/og.png");
  });

  it("renders iframe element with correct src", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com/player"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
      />
    );

    const iframe = screen.getByTitle("Test embed");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "https://embed.example.com/player");
  });

  it("iframe starts invisible (opacity-0)", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
      />
    );

    const iframeLayer = screen.getByTestId("iframe-layer");
    expect(iframeLayer.className).toContain("opacity-0");
    expect(iframeLayer.className).toContain("pointer-events-none");
  });

  it("iframe becomes visible after load event", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
      />
    );

    const iframe = screen.getByTitle("Test embed");
    act(() => {
      iframe.dispatchEvent(new Event("load"));
    });

    const iframeLayer = screen.getByTestId("iframe-layer");
    expect(iframeLayer.className).toContain("opacity-100");
    expect(iframeLayer.className).toContain("pointer-events-auto");
  });

  it("shows failed state after timeout", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
        timeout={5000}
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Iframe should be removed from DOM
    expect(screen.queryByTitle("Test embed")).not.toBeInTheDocument();
    // Should show "Open original" link
    expect(screen.getByText("Open original")).toBeInTheDocument();
  });

  it("calls onFailed callback on timeout", () => {
    const onFailed = vi.fn();

    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
        timeout={5000}
        onFailed={onFailed}
      />
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onFailed).toHaveBeenCalledTimes(1);
  });

  it("does not show failed state if iframe loads before timeout", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage="https://example.com/og.png"
        fallbackUrl="https://example.com"
        title="Test embed"
        timeout={5000}
      />
    );

    const iframe = screen.getByTitle("Test embed");
    act(() => {
      iframe.dispatchEvent(new Event("load"));
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Should still be loaded, not failed
    const iframeLayer = screen.getByTestId("iframe-layer");
    expect(iframeLayer.className).toContain("opacity-100");
    expect(screen.queryByText("Open original")).not.toBeInTheDocument();
  });

  it("renders placeholder when no fallback image", () => {
    render(
      <IframeWithFallback
        src="https://embed.example.com"
        fallbackImage={null}
        fallbackUrl="https://example.com"
        title="Test embed"
      />
    );

    const layer = screen.getByTestId("fallback-layer");
    // Should not contain an img element
    const img = layer.querySelector("img");
    expect(img).not.toBeInTheDocument();
    // Should have a spinner/placeholder instead
    expect(layer.querySelector("[data-testid='placeholder']") ?? layer.querySelector(".animate-spin")).toBeTruthy();
  });
});
