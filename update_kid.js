const fs = require('fs');
let serverFile = fs.readFileSync('server.ts', 'utf8');
serverFile = serverFile.replace(/let kid = "lti-platform-key-fixed";/g, 'let kid = "lti-platform-key-v2";');
fs.writeFileSync('server.ts', serverFile);
