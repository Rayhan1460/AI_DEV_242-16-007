import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Tender, Requirement } from '../types/tender';
import type { UploadedPdf } from '../types/pdf';
import type { MatchingState } from '../types/matching';

export interface IncludedDocumentEntry {
  order: number;
  requirementId: string;
  titleEn: string;
  filename: string;
  pageCount: number;
  startPage: number;
  endPage: number;
  expiryDate?: string;
  bytes: Uint8Array;
}

export interface GeneratePackageResult {
  success: boolean;
  pdfBytes?: Uint8Array;
  filename?: string;
  totalPackagePages?: number;
  includedDocuments?: IncludedDocumentEntry[];
  error?: string;
}

/**
 * Truncates text safely to avoid horizontal overflow on standard PDF pages.
 */
function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Generates the complete, unified tender submission package PDF in browser memory.
 * - Page 1: English Cover Page with tender metadata and included documents index
 * - Subsequent Pages: Matched documents in requirement.order, with dedicated footer band
 * - Every page includes the mandatory footer: <tender_id> | Page X of Y
 * - Filename: <tender_id>_Package.pdf
 */
export async function generateTenderPackage(
  tender: Tender,
  requirements: Requirement[],
  matchingState: MatchingState,
  files: UploadedPdf[],
  packageDateStr?: string
): Promise<GeneratePackageResult> {
  try {
    // 1. Identify and order all included documents
    // Requirements must be sorted by numeric "order"
    const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order);

    const includedEntries: IncludedDocumentEntry[] = [];
    let runningPage = 2; // Page 1 is the cover page

    for (const req of sortedRequirements) {
      const fileId = matchingState.matches[req.id];
      if (!fileId) {
        // Optional requirements without a file are skipped.
        continue;
      }

      const matchedFile = files.find((f) => f.id === fileId);
      if (!matchedFile) {
        return {
          success: false,
          error: `Matched file for requirement "${req.id}" (${fileId}) could not be found.`
        };
      }

      // Ensure exact page count directly from PDF bytes
      let actualPageCount = matchedFile.pageCount;
      try {
        const tempDoc = await PDFDocument.load(matchedFile.bytes, { ignoreEncryption: true });
        actualPageCount = tempDoc.getPageCount();
      } catch {
        actualPageCount = matchedFile.pageCount;
      }

      const pageCount = actualPageCount;
      const startPage = runningPage;
      const endPage = runningPage + pageCount - 1;

      includedEntries.push({
        order: req.order,
        requirementId: req.id,
        titleEn: req.title_en,
        filename: matchedFile.filename,
        pageCount,
        startPage,
        endPage,
        expiryDate: matchingState.expiryDates[req.id],
        bytes: matchedFile.bytes
      });

      runningPage += pageCount;
    }

    const totalPackagePages = runningPage - 1;
    const finalDate = packageDateStr || new Date().toISOString().split('T')[0];

    // 2. Initialize new merged PDF document
    const mergedDoc = await PDFDocument.create();
    const regularFont = await mergedDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await mergedDoc.embedFont(StandardFonts.HelveticaBold);

    // 3. PAGE 1: English Cover Page
    const coverWidth = 595.28; // Standard A4
    const coverHeight = 841.89;
    const coverPage = mergedDoc.addPage([coverWidth, coverHeight]);

    // Top Header Banner
    coverPage.drawRectangle({
      x: 40,
      y: 760,
      width: coverWidth - 80,
      height: 44,
      color: rgb(0.08, 0.16, 0.32)
    });

    coverPage.drawText('TENDER SUBMISSION PACKAGE', {
      x: 55,
      y: 778,
      size: 16,
      font: boldFont,
      color: rgb(1, 1, 1)
    });

    coverPage.drawText('OFFICIAL BID COMPLIANCE DOCUMENTATION', {
      x: 55,
      y: 766,
      size: 8,
      font: regularFont,
      color: rgb(0.8, 0.88, 1)
    });

    // Tender Information Section
    let currentY = 728;
    coverPage.drawText('TENDER INFORMATION', {
      x: 40,
      y: currentY,
      size: 11,
      font: boldFont,
      color: rgb(0.12, 0.22, 0.42)
    });

    coverPage.drawLine({
      start: { x: 40, y: currentY - 5 },
      end: { x: coverWidth - 40, y: currentY - 5 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92)
    });

    currentY -= 22;

    const metadataRows: [string, string][] = [
      ['Tender ID', tender.tender_id],
      ['Project Title', truncateText(tender.title, 75)],
      ['Procuring Entity', truncateText(tender.procuring_entity, 70)],
      ['Bidder Name', truncateText(tender.bidder, 70)],
      ['Submission Deadline', tender.submission_deadline],
      ['Package Generated Date', finalDate],
      ['Total Included Documents', `${includedEntries.length} documents`],
      ['Total Package Pages', `${totalPackagePages} pages`]
    ];

    for (const [label, val] of metadataRows) {
      coverPage.drawText(`${label}:`, {
        x: 45,
        y: currentY,
        size: 9,
        font: boldFont,
        color: rgb(0.25, 0.3, 0.38)
      });

      coverPage.drawText(val, {
        x: 180,
        y: currentY,
        size: 9,
        font: regularFont,
        color: rgb(0.1, 0.1, 0.1)
      });

      currentY -= 17;
    }

    currentY -= 10;

    // Index of Included Documents Table
    coverPage.drawText('INDEX OF INCLUDED DOCUMENTS', {
      x: 40,
      y: currentY,
      size: 11,
      font: boldFont,
      color: rgb(0.12, 0.22, 0.42)
    });

    coverPage.drawLine({
      start: { x: 40, y: currentY - 5 },
      end: { x: coverWidth - 40, y: currentY - 5 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92)
    });

    currentY -= 22;

    // Table Header Row
    coverPage.drawRectangle({
      x: 40,
      y: currentY - 4,
      width: coverWidth - 80,
      height: 18,
      color: rgb(0.93, 0.95, 0.98)
    });

    coverPage.drawText('#', { x: 45, y: currentY, size: 8, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
    coverPage.drawText('Requirement Document', { x: 75, y: currentY, size: 8, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
    coverPage.drawText('Matched File', { x: 260, y: currentY, size: 8, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
    coverPage.drawText('Expiry', { x: 410, y: currentY, size: 8, font: boldFont, color: rgb(0.2, 0.25, 0.35) });
    coverPage.drawText('Package Pages', { x: 475, y: currentY, size: 8, font: boldFont, color: rgb(0.2, 0.25, 0.35) });

    currentY -= 18;

    for (let i = 0; i < includedEntries.length; i++) {
      const doc = includedEntries[i];
      if (currentY < 70) {
        // Stop if reaching near bottom footer area
        break;
      }

      // Alternating row background
      if (i % 2 === 1) {
        coverPage.drawRectangle({
          x: 40,
          y: currentY - 3,
          width: coverWidth - 80,
          height: 15,
          color: rgb(0.98, 0.98, 0.99)
        });
      }

      coverPage.drawText(`${doc.order}`, { x: 45, y: currentY, size: 8, font: regularFont, color: rgb(0.2, 0.2, 0.2) });
      coverPage.drawText(truncateText(`[${doc.requirementId}] ${doc.titleEn}`, 34), {
        x: 75,
        y: currentY,
        size: 8,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      coverPage.drawText(truncateText(doc.filename, 28), {
        x: 260,
        y: currentY,
        size: 7.5,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      coverPage.drawText(doc.expiryDate || 'N/A', {
        x: 410,
        y: currentY,
        size: 7.5,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      coverPage.drawText(
        doc.startPage === doc.endPage ? `Page ${doc.startPage}` : `pp. ${doc.startPage}-${doc.endPage}`,
        { x: 475, y: currentY, size: 8, font: boldFont, color: rgb(0.15, 0.35, 0.7) }
      );

      currentY -= 16;
    }

    // Cover Page Footer (Page 1 of Y)
    const coverFooterY = 16;
    coverPage.drawLine({
      start: { x: 40, y: 35 },
      end: { x: coverWidth - 40, y: 35 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8)
    });
    coverPage.drawText(`${tender.tender_id} | Page 1 of ${totalPackagePages}`, {
      x: 40,
      y: coverFooterY,
      size: 9,
      font: regularFont,
      color: rgb(0.35, 0.35, 0.35)
    });

    // 4. EMBED INCLUDED DOCUMENTS (IN REQUIREMENT.ORDER)
    let currentPackagePage = 2;

    for (const docEntry of includedEntries) {
      let srcDoc: PDFDocument;
      try {
        srcDoc = await PDFDocument.load(docEntry.bytes, { ignoreEncryption: true });
      } catch (err) {
        return {
          success: false,
          error: `Failed to load PDF "${docEntry.filename}": ${err instanceof Error ? err.message : 'Corrupted PDF'}`
        };
      }

      const srcPageCount = srcDoc.getPageCount();

      for (let pIdx = 0; pIdx < srcPageCount; pIdx++) {
        const srcPage = srcDoc.getPage(pIdx);
        const embeddedPage = await mergedDoc.embedPage(srcPage);

        // Determine destination page dimensions (match orientation of source page)
        const isLandscape = embeddedPage.width > embeddedPage.height;
        const destWidth = isLandscape ? 841.89 : 595.28;
        const destHeight = isLandscape ? 595.28 : 841.89;

        // Dedicated bottom footer band
        const footerBandHeight = 42;
        const marginX = 16;
        const marginTop = 16;

        // Printable content area strictly above footer band
        const availWidth = destWidth - (2 * marginX);
        const availHeight = destHeight - footerBandHeight - marginTop;

        // Uniform aspect-ratio preserving scale factor
        const scale = Math.min(availWidth / embeddedPage.width, availHeight / embeddedPage.height);
        const drawWidth = embeddedPage.width * scale;
        const drawHeight = embeddedPage.height * scale;

        // Centered horizontally and vertically in the area above the footer
        const drawX = (destWidth - drawWidth) / 2;
        const drawY = footerBandHeight + (availHeight - drawHeight) / 2;

        const newPage = mergedDoc.addPage([destWidth, destHeight]);

        // Draw embedded source page
        newPage.drawPage(embeddedPage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight
        });

        // Draw dedicated clean footer band with divider
        newPage.drawRectangle({
          x: 0,
          y: 0,
          width: destWidth,
          height: footerBandHeight,
          color: rgb(1, 1, 1)
        });

        newPage.drawLine({
          start: { x: marginX, y: footerBandHeight },
          end: { x: destWidth - marginX, y: footerBandHeight },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8)
        });

        // Mandatory Footer: <tender_id> | Page X of Y
        const footerText = `${tender.tender_id} | Page ${currentPackagePage} of ${totalPackagePages}`;
        newPage.drawText(footerText, {
          x: marginX + 4,
          y: 15,
          size: 9,
          font: regularFont,
          color: rgb(0.35, 0.35, 0.35)
        });

        currentPackagePage++;
      }
    }

    // 5. Serialize and return final PDF bytes
    const pdfBytes = await mergedDoc.save();
    const cleanTenderId = tender.tender_id.trim().replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${cleanTenderId}_Package.pdf`;

    return {
      success: true,
      pdfBytes,
      filename,
      totalPackagePages,
      includedDocuments: includedEntries
    };
  } catch (err) {
    return {
      success: false,
      error: `Package generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}

/**
 * Initiates client-side browser download for generated PDF bytes.
 */
export function downloadPdfBytes(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
