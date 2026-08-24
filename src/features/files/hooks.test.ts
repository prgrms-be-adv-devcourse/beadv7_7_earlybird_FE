import { describe, it, expect } from "vitest";
import { resolveImageContentType } from "./hooks";

describe("resolveImageContentType", () => {
  it("returns standard MIME when file.type is present", () => {
    const file = new File(["test"], "sample.png", { type: "image/png" });
    expect(resolveImageContentType(file)).toBe("image/png");
  });

  it("normalizes image/jpg to image/jpeg", () => {
    const file = new File(["test"], "sample.jpg", { type: "image/jpg" });
    expect(resolveImageContentType(file)).toBe("image/jpeg");
  });

  it("normalizes image/pjpeg to image/jpeg", () => {
    const file = new File(["test"], "sample.jpg", { type: "image/pjpeg" });
    expect(resolveImageContentType(file)).toBe("image/jpeg");
  });

  it("infers MIME type from extension when file.type is empty", () => {
    const fileJpg = new File(["test"], "photo.jpg", { type: "" });
    expect(resolveImageContentType(fileJpg)).toBe("image/jpeg");

    const filePng = new File(["test"], "icon.png", { type: "" });
    expect(resolveImageContentType(filePng)).toBe("image/png");

    const fileWebp = new File(["test"], "banner.webp", { type: "" });
    expect(resolveImageContentType(fileWebp)).toBe("image/webp");

    const fileGif = new File(["test"], "anim.gif", { type: "" });
    expect(resolveImageContentType(fileGif)).toBe("image/gif");

    const fileSvg = new File(["test"], "vector.svg", { type: "" });
    expect(resolveImageContentType(fileSvg)).toBe("image/svg+xml");

    const fileImg = new File(["test"], "picture.img", { type: "" });
    expect(resolveImageContentType(fileImg)).toBe("image/jpeg");
  });

  it("defaults to image/jpeg for unknown extension when file.type is empty", () => {
    const fileUnknown = new File(["test"], "unknown_file", { type: "" });
    expect(resolveImageContentType(fileUnknown)).toBe("image/jpeg");
  });
});
