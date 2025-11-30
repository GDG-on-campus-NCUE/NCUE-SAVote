const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('Generating 2048-bit RSA key pair...');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

// Write keys to files
const secretsDir = path.join(__dirname, '..', 'apps', 'api', 'secrets');

fs.writeFileSync(path.join(secretsDir, 'jwt-private.key'), privateKey);
fs.writeFileSync(path.join(secretsDir, 'jwt-public.key'), publicKey);

console.log('✓ Keys generated successfully!');
console.log(`  Private key: ${path.join(secretsDir, 'jwt-private.key')}`);
console.log(`  Public key: ${path.join(secretsDir, 'jwt-public.key')}`);
console.log('\nThese keys are for development only. Generate new keys for production.');
