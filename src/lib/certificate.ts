import { jsPDF } from "jspdf";
import { formatDate, generateCertificateCode } from "./utils";

export interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: Date;
  certificateCode: string;
  verificationUrl: string;
}

export function generateCertificatePDF(data: CertificateData): Buffer {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // Border
  doc.setDrawColor(201, 169, 110); // gold
  doc.setLineWidth(2);
  doc.rect(10, 10, width - 20, height - 20);

  // Inner border
  doc.setLineWidth(0.5);
  doc.rect(14, 14, width - 28, height - 28);

  // Corner decorations
  const cornerSize = 15;
  doc.setLineWidth(1);
  // Top-left
  doc.line(14, 14 + cornerSize, 14, 14);
  doc.line(14, 14, 14 + cornerSize, 14);
  // Top-right
  doc.line(width - 14 - cornerSize, 14, width - 14, 14);
  doc.line(width - 14, 14, width - 14, 14 + cornerSize);
  // Bottom-left
  doc.line(14, height - 14 - cornerSize, 14, height - 14);
  doc.line(14, height - 14, 14 + cornerSize, height - 14);
  // Bottom-right
  doc.line(width - 14, height - 14 - cornerSize, width - 14, height - 14);
  doc.line(width - 14 - cornerSize, height - 14, width - 14, height - 14);

  // Header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(201, 169, 110);
  doc.text("LASH EXTENSION ACADEMY", width / 2, 35, { align: "center" });

  // Title
  doc.setFontSize(36);
  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.text("Certificate of Completion", width / 2, 55, { align: "center" });

  // Divider line
  doc.setDrawColor(201, 169, 110);
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 50, 62, width / 2 + 50, 62);

  // "This is to certify that"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("This is to certify that", width / 2, 75, { align: "center" });

  // Student name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(40, 40, 40);
  doc.text(data.studentName, width / 2, 90, { align: "center" });

  // Name underline
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  const nameWidth = doc.getTextWidth(data.studentName);
  doc.line(
    width / 2 - nameWidth / 2 - 10,
    93,
    width / 2 + nameWidth / 2 + 10,
    93
  );

  // "has successfully completed"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("has successfully completed the course", width / 2, 105, {
    align: "center",
  });

  // Course name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(201, 169, 110);
  doc.text(data.courseName, width / 2, 118, { align: "center" });

  // Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Completed on ${formatDate(data.completionDate)}`,
    width / 2,
    132,
    { align: "center" }
  );

  // Certificate ID
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate ID: ${data.certificateCode}`, width / 2, 155, {
    align: "center",
  });

  // Verification URL
  doc.setFontSize(8);
  doc.text(`Verify at: ${data.verificationUrl}`, width / 2, 162, {
    align: "center",
  });

  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(width / 2 - 35, 175, width / 2 + 35, 175);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Instructor Signature", width / 2, 181, { align: "center" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}

export { generateCertificateCode };
