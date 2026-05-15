const QRCode = require('qrcode');

/**
 * Generate a QR code as a base64 data URL
 * @param {string} token - Unique token to encode
 * @returns {Promise<string>} Base64 data URL
 */
exports.generateQRCode = async (token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${token}`;
  const qrDataURL = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#000000', light: '#ffffff' },
  });
  return qrDataURL;
};

/**
 * Generate QR code as SVG string
 */
exports.generateQRCodeSVG = async (token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${token}`;
  const svg = await QRCode.toString(url, { type: 'svg', margin: 2 });
  return svg;
};
