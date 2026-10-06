import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateTenderPackage } from '../src/core/pdfGenerator';
import { parseAndValidateRequirementsJson } from '../src/core/requirementsValidator';
import { SAMPLE_REQUIREMENTS_JSON } from '../src/data/sampleRequirements';
import { computeSha256 } from '../src/core/pdfService';
import type { UploadedPdf } from '../src/types/pdf';
import type { MatchingState } from '../src/types/matching';

async function run() {
  console.log('Generating official sample package output...');

  const parseResult = parseAndValidateRequirementsJson(SAMPLE_REQUIREMENTS_JSON);
  if (!parseResult.success || !parseResult.data) {
    throw new Error('Failed to parse sample requirements JSON');
  }

  const { tender, requirements } = parseResult.data;

  // 1. Create genuine sample PDFs for the matched mandatory requirements
  // Doc 1: Trade License (1 page)
  const doc1 = await PDFDocument.create();
  const font = await doc1.embedFont(StandardFonts.HelveticaBold);
  const p1 = doc1.addPage([595.28, 841.89]);
  p1.drawText('Sample Trade License 2026', { x: 50, y: 780, size: 20, font, color: rgb(0.1, 0.2, 0.4) });
  p1.drawText('Document ID: TL-8849-2026', { x: 50, y: 740, size: 14 });
  p1.drawText('Issued To: Tech Solutions Bangladesh Ltd.', { x: 50, y: 710, size: 12 });
  p1.drawText('Valid until: 2026-12-31', { x: 50, y: 680, size: 12 });
  const bytes1 = await doc1.save();
  const hash1 = await computeSha256(bytes1);

  // Doc 2: Tax Clearance Certificate (2 pages)
  const doc2 = await PDFDocument.create();
  const p2_1 = doc2.addPage([595.28, 841.89]);
  p2_1.drawText('National Board of Revenue - Tax Clearance', { x: 50, y: 780, size: 18, font });
  p2_1.drawText('TIN: 489201948201', { x: 50, y: 740, size: 12 });
  p2_1.drawText('Assessment Year: 2025-2026', { x: 50, y: 710, size: 12 });
  const p2_2 = doc2.addPage([595.28, 841.89]);
  p2_2.drawText('Tax Clearance Certificate - Page 2 of 2', { x: 50, y: 780, size: 14, font });
  p2_2.drawText('All direct taxes cleared up to assessment cycle.', { x: 50, y: 740, size: 11 });
  const bytes2 = await doc2.save();
  const hash2 = await computeSha256(bytes2);

  // Doc 3: Bank Solvency Certificate (1 page)
  const doc3 = await PDFDocument.create();
  const p3 = doc3.addPage([595.28, 841.89]);
  p3.drawText('Bank Solvency Certificate', { x: 50, y: 780, size: 18, font });
  p3.drawText('This is to certify the financial solvency of the bidder.', { x: 50, y: 740, size: 12 });
  p3.drawText('Account Status: Satisfactory & Solvent', { x: 50, y: 710, size: 12 });
  const bytes3 = await doc3.save();
  const hash3 = await computeSha256(bytes3);

  const files: UploadedPdf[] = [
    {
      id: 'pdf-01',
      file: new File([bytes1 as unknown as BlobPart], 'Trade_License_2026.pdf', { type: 'application/pdf' }),
      bytes: bytes1,
      filename: 'Trade_License_2026.pdf',
      size: bytes1.length,
      pageCount: 1,
      sha256: hash1,
      isDuplicate: false
    },
    {
      id: 'pdf-02',
      file: new File([bytes2 as unknown as BlobPart], 'Tax_Clearance_Cert.pdf', { type: 'application/pdf' }),
      bytes: bytes2,
      filename: 'Tax_Clearance_Cert.pdf',
      size: bytes2.length,
      pageCount: 2,
      sha256: hash2,
      isDuplicate: false
    },
    {
      id: 'pdf-03',
      file: new File([bytes3 as unknown as BlobPart], 'Bank_Solvency_Report.pdf', { type: 'application/pdf' }),
      bytes: bytes3,
      filename: 'Bank_Solvency_Report.pdf',
      size: bytes3.length,
      pageCount: 1,
      sha256: hash3,
      isDuplicate: false
    }
  ];

  // Matched state resolving all mandatory requirements
  const matchingState: MatchingState = {
    matches: {
      R01: 'pdf-01',
      R02: 'pdf-02',
      R03: 'pdf-03'
      // R04, R05 are optional and left unmatched
    },
    expiryDates: {
      R01: '2026-12-31', // Valid > 2026-10-20
      R02: '2026-11-15'  // Valid > 2026-10-20
    }
  };

  const result = await generateTenderPackage(tender, requirements, matchingState, files, '2026-10-06');
  if (!result.success || !result.pdfBytes) {
    throw new Error(`Package generation failed: ${result.error}`);
  }

  const outputDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targetPath = path.join(outputDir, `${tender.tender_id}_Package.pdf`);
  fs.writeFileSync(targetPath, Buffer.from(result.pdfBytes));

  console.log(`Successfully generated submission package: ${targetPath}`);
  console.log(`Total Pages: ${result.totalPackagePages}`);
  console.log(`Included Documents: ${result.includedDocuments?.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
