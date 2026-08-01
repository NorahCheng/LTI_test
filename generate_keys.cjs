const jose = require('jose');
const fs = require('fs');
async function run() {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256', { extractable: true });
  const privJwk = await jose.exportJWK(privateKey);
  const pubJwk = await jose.exportJWK(publicKey);
  fs.writeFileSync('keys.json', JSON.stringify({ privJwk, pubJwk }));
}
run();
