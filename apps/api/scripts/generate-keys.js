const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateKeys() {
  const secretsDir = path.resolve(__dirname, '../secrets');
  const privateKeyPath = path.join(secretsDir, 'jwt-private.key');
  const publicKeyPath = path.join(secretsDir, 'jwt-public.key');

  // 確保目錄存在
  if (!fs.existsSync(secretsDir)) {
    fs.mkdirSync(secretsDir, { recursive: true });
  }

  // 檢查是否已存在有效密鑰
  if (fs.existsSync(privateKeyPath)) {
    const stats = fs.statSync(privateKeyPath);
    if (stats.size > 1000) {
      console.log('✅ JWT keys already exist and are valid.');
      return;
    }
    console.log('⚠️ Existing keys are invalid or too short, regenerating...');
  }

  console.log('Generating 2048-bit RSA key pair (Pure Node.js)...');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  // 設定權限 (僅適用於類 Unix 系統，Windows 會忽略但不會報錯)
  try {
    fs.chmodSync(privateKeyPath, 0o600);
    fs.chmodSync(publicKeyPath, 0o644);
  } catch (err) {
    // Ignore permission errors on Windows
  }

  console.log('✅ JWT keys generated successfully in apps/api/secrets/');
}

generateKeys();
