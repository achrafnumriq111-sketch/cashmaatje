import { PDFDocument } from "pdf-lib";

/**
 * Merge an ordered list of images/PDFs into a single PDF file (client-side).
 * Used by "Fix the Chaos" to group multi-page letters that a user selected
 * together so the AI analyses them as ONE document, not N chaos items.
 */
export async function mergeFilesToPdf(
  files: File[],
  outName = "samengevoegd.pdf",
): Promise<File> {
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = (file.type || "").toLowerCase();

    if (type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
      continue;
    }

    // Image path — embed as full-page image.
    let img;
    if (type.includes("png")) {
      img = await merged.embedPng(bytes);
    } else if (type.includes("jpeg") || type.includes("jpg")) {
      img = await merged.embedJpg(bytes);
    } else {
      // For webp/heic/other: draw via bitmap → PNG blob → embed.
      const bmp = await createImageBitmap(new Blob([bytes], { type: file.type || "image/*" }));
      const canvas = document.createElement("canvas");
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas niet beschikbaar");
      ctx.drawImage(bmp, 0, 0);
      const blob: Blob = await new Promise((r) =>
        canvas.toBlob((b) => r(b as Blob), "image/png"),
      );
      const pngBytes = new Uint8Array(await blob.arrayBuffer());
      img = await merged.embedPng(pngBytes);
    }

    const page = merged.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const out = await merged.save();
  return new File([new Uint8Array(out)], outName, { type: "application/pdf" });
}
