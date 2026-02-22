// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { TruncatedText } from "@/components/surface/shared/truncated-text";

describe("TruncatedText", () => {
  it("renders text content", () => {
    render(<TruncatedText text="Hello world" />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(<TruncatedText text="Click me" href="https://example.com" />);
    const link = screen.getByRole("link", { name: "Click me" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not show toggle button for short text", () => {
    render(<TruncatedText text="Short" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
