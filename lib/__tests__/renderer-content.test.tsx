// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { RendererContent } from "@/components/surface/shared/renderer-content";

describe("RendererContent", () => {
  it("renders title via TruncatedText", () => {
    render(<RendererContent title="Surface Title" description={null} />);
    expect(screen.getByText("Surface Title")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<RendererContent title={null} description="Some description" />);
    expect(screen.getByText("Some description")).toBeInTheDocument();
  });

  it("renders both title and description", () => {
    render(<RendererContent title="Title" description="Description" />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("renders nothing when both are null", () => {
    const { container } = render(<RendererContent title={null} description={null} />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.children.length).toBe(0);
  });

  it("renders title as link when href is provided", () => {
    render(<RendererContent title="Link Title" description={null} href="https://example.com" />);
    const link = screen.getByRole("link", { name: "Link Title" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });

  it("applies line-clamp-3 to description", () => {
    render(<RendererContent title={null} description="Long text" />);
    const desc = screen.getByText("Long text");
    expect(desc.className).toContain("line-clamp-3");
  });
});
