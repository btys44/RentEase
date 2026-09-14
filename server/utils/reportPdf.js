const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a landlord summary report PDF (revenue per property + outstanding balances).
 */
function generateReportPdf({ revenueByProperty, outstanding, occupancy, landlordName }) {
  return new Promise((resolve, reject) => {
    const uploadDir = path.join(
      __dirname,
      '..',
      process.env.UPLOAD_DIR || 'uploads',
      'receipts'
    );
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const fileName = `report-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, 70).fill('#15803d');
    doc.image(path.join(__dirname, '..', 'assets', 'logo.png'), 40, 15, { width: 40, height: 40 });
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text('RentEase Kenya - Report', 90, 26);
    doc.fillColor('#000000');

    let y = 100;
    doc.fontSize(11).font('Helvetica').text(`Landlord: ${landlordName}`, 40, y);
    doc.text(`Generated: ${new Date().toLocaleString('en-KE')}`, 300, y);
    y += 30;

    doc.fontSize(13).font('Helvetica-Bold').text('Monthly Revenue by Property', 40, y);
    y += 20;
    revenueByProperty.forEach((p) => {
      doc.fontSize(10).font('Helvetica').text(`${p.propertyName}: KES ${p.revenue.toLocaleString('en-KE')}`, 50, y);
      y += 16;
    });

    y += 15;
    doc.fontSize(13).font('Helvetica-Bold').text('Outstanding Balances', 40, y);
    y += 20;
    if (outstanding.length === 0) {
      doc.fontSize(10).font('Helvetica').text('No outstanding balances. All tenants are up to date.', 50, y);
      y += 16;
    } else {
      outstanding.forEach((o) => {
        doc.fontSize(10).font('Helvetica').text(
          `${o.tenantName} - Unit ${o.unitNumber} (${o.propertyName}): KES ${o.amountDue.toLocaleString('en-KE')} due`,
          50, y
        );
        y += 16;
      });
    }

    y += 15;
    doc.fontSize(13).font('Helvetica-Bold').text('Occupancy Rate', 40, y);
    y += 20;
    doc.fontSize(10).font('Helvetica').text(
      `${occupancy.occupied} occupied / ${occupancy.total} total units (${occupancy.rate}%)`,
      50, y
    );

    doc.end();
    stream.on('finish', () => resolve(`/uploads/receipts/${fileName}`));
    stream.on('error', reject);
  });
}

module.exports = { generateReportPdf };
