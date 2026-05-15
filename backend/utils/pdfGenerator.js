const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a visitor pass PDF badge
 * @param {Object} pass - Pass document
 * @param {Object} visitor - Visitor document
 * @param {boolean} returnBuffer - If true, returns Buffer instead of saving file
 */
exports.generatePassPDF = (pass, visitor, returnBuffer = false) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [250, 350], margin: 20 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);

    doc.on('end', async () => {
      const buffer = Buffer.concat(chunks);

      if (returnBuffer) return resolve(buffer);

      // Save to disk
      const dir = path.join(__dirname, '../passes');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `pass-${pass.passId}.pdf`;
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, buffer);
      resolve(`/passes/${filename}`);
    });

    // ── PDF Layout ──────────────────────────────────────────
    // Header bar
    doc.rect(0, 0, 250, 60).fill('#1a2a4a');
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
       .text('VISIPASS', 20, 15, { width: 210, align: 'center' });
    doc.fillColor('#8bbcff').fontSize(8)
       .text('VISITOR PASS', 20, 33, { width: 210, align: 'center' });

    // Badge type strip
    const badgeColors = { standard: '#4f8ef7', vip: '#a855f7', contractor: '#f59e0b', delivery: '#22c55e' };
    doc.rect(0, 60, 250, 8).fill(badgeColors[pass.badgeType] || '#4f8ef7');

    // Visitor name
    doc.fillColor('#0f1117').fontSize(18).font('Helvetica-Bold')
       .text(`${visitor.firstName} ${visitor.lastName}`, 20, 82, { width: 210, align: 'center' });

    // Company
    doc.fillColor('#5a6a88').fontSize(10).font('Helvetica')
       .text(visitor.company || 'Individual', 20, 104, { width: 210, align: 'center' });

    // Divider
    doc.moveTo(20, 120).lineTo(230, 120).strokeColor('#e5e7eb').stroke();

    // Details
    const detailY = 130;
    const details = [
      ['Pass ID', pass.passId],
      ['Host', visitor.host?.name || 'N/A'],
      ['Department', visitor.department || 'N/A'],
      ['Purpose', visitor.purpose?.replace('_', ' ') || 'N/A'],
      ['Valid From', new Date(pass.validFrom).toLocaleString()],
      ['Valid Until', new Date(pass.validUntil).toLocaleString()],
      ['Access', pass.accessLevel?.toUpperCase() || 'STANDARD'],
    ];

    details.forEach(([label, value], i) => {
      const y = detailY + i * 16;
      doc.fillColor('#8b9ab8').fontSize(7).font('Helvetica').text(label, 20, y);
      doc.fillColor('#0f1117').fontSize(8).font('Helvetica-Bold').text(value, 100, y, { width: 130 });
    });

    // QR code (embed base64 image)
    if (pass.qrCode) {
      const qrBase64 = pass.qrCode.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(qrBase64, 'base64');
      doc.image(qrBuffer, 75, 252, { width: 100, height: 100 });
    }

    // Footer
    doc.rect(0, 320, 250, 30).fill('#1a2a4a');
    doc.fillColor('#8bbcff').fontSize(7)
       .text('This pass must be worn visibly at all times.', 20, 330, { width: 210, align: 'center' });

    doc.end();
  });
};
