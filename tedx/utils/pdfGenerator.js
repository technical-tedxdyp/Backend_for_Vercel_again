// File: functions/utils/pdfGenerator.js

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * Generates a TEDx ticket PDF as a Buffer, styled as per the attached image.
 * @param {Object} ticketData - Ticket details (name, email, phone, session, amount, razorpayPaymentId, ticketId)
 * @returns {Promise<Buffer>} - Resolves to the PDF file content as a Buffer
 */
const generateTicket = (ticketData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [500, 220], margin: 0 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- ASSET PATHS ---
      const assetsDir = path.join(__dirname, 'assets');
      const xImgPath = path.join(assetsDir, 'tedx-x-art.png');
      const sunBgPath = path.join(assetsDir, 'sun-bg.png');
      const igIconPath = path.join(assetsDir, 'ig.png');

      // --- LEFT RED SECTION ---
      doc.save();
      doc.roundedRect(10, 10, 320, 200, 14).fill('#BE2326');

      // Sun overlay
      if (fs.existsSync(sunBgPath)) {
        doc.opacity(0.3).image(sunBgPath, 10, 10, { width: 320, height: 200 });
        doc.opacity(1);
      }

      // TEDx Header
      doc.font('Helvetica-Bold').fontSize(26).fillColor('#fff')
        .text('TED', 26, 28, { continued: true });
      doc.fillColor('#EB0028').text('x', { continued: true });
      doc.fillColor('#fff').text('DYPAkurdi');

      doc.font('Helvetica').fontSize(11).fillColor('#fff')
        .text('x = Independently Organized TED Event', 26, 51);

      // Price
      doc.fontSize(22).fillColor('#fff').text(`₹ ${ticketData.amount}`, 270, 28, { align: 'right' });

      // Ticket Details
      const details = [
        { label: 'Name', value: ticketData.name },
        { label: 'Email', value: ticketData.email },
        { label: 'Phone', value: ticketData.phone },
        { label: 'Ticket ID', value: ticketData.ticketId }
      ];

      let y = 85;
      details.forEach(({ label, value }) => {
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#fff')
          .text(`${label} : `, 26, y, { continued: true });
        doc.font('Helvetica').text(value);
        y += 25;
      });

      // Instagram tag
      if (fs.existsSync(igIconPath)) {
        doc.image(igIconPath, 26, 182, { width: 16, height: 16 });
        doc.fontSize(10).fillColor('#fff').font('Helvetica').text('tedxdypakurdi', 48, 186);
      }

      doc.restore();

      // --- RIGHT SECTION ("X" art or fallback) ---
      if (fs.existsSync(xImgPath)) {
        doc.image(xImgPath, 340, 36, { width: 125, height: 145 });
      } else {
        doc.font('Helvetica-Bold').fontSize(140).fillColor('#EB0028').text('X', 355, 73);
      }

      // --- QR CODE (bottom-right corner) ---
      const qrData = `Name: ${ticketData.name}\nEmail: ${ticketData.email}\nPhone: ${ticketData.phone}\nTicketID: ${ticketData.ticketId}\nPaymentID: ${ticketData.razorpayPaymentId}`;
      const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 80 });
      const qrBuffer = Buffer.from(qrImage.split(',')[1], 'base64');
      doc.image(qrBuffer, 400, 150, { width: 80, height: 80 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTicket };
