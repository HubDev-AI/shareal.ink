// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PreviewContent } from "@/components/create/preview-renderers/preview-content";

describe("PreviewContent", () => {
  it("renders type badge", () => {
    render(<PreviewContent linkType="youtube" loading={false} title={null} description={null} />);
    // TypeBadge renders the config label — youtube maps to "Video"
    expect(screen.getByText("Video")).toBeInTheDocument();
  });

  it("renders title and description", () => {
    render(
      <PreviewContent
        linkType="generic"
        loading={false}
        title="Test Title"
        description="Test description text"
      />
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description text")).toBeInTheDocument();
  });

  it("renders skeletons when loading with no title", () => {
    const { container } = render(
      <PreviewContent linkType="spotify" loading={true} title={null} description={null} />
    );
    const skeletons = container.querySelectorAll("[class*='animate-pulse'], [class*='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders title even when loading if title is available", () => {
    render(
      <PreviewContent linkType="generic" loading={true} title="Already fetched" description={null} />
    );
    expect(screen.getByText("Already fetched")).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    render(
      <PreviewContent linkType="generic" loading={false} title="Title" description={null} />
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("applies line-clamp-2 to title", () => {
    render(
      <PreviewContent linkType="generic" loading={false} title="Title" description={null} />
    );
    const title = screen.getByText("Title");
    expect(title.className).toContain("line-clamp-2");
  });
});
