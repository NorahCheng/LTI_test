import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as jose from "jose";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

// Load persistent keys
let privateKey: any;
let publicKey: any;
let kid = "lti-platform-key-v3";

async function generateKeys() {
  try {
    const keysData = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
    privateKey = await jose.importJWK(keysData.privJwk, 'RS256');
    publicKey = await jose.importJWK(keysData.pubJwk, 'RS256');
    console.log("Loaded persistent LTI keys.");
  } catch (err) {
    console.error("Failed to load keys, generating temporary...", err);
    const { publicKey: pub, privateKey: priv } = await jose.generateKeyPair('RS256', { extractable: true });
    publicKey = pub;
    privateKey = priv;
  }
}

async function startServer() {
  await generateKeys();

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Expose JWKS
  app.get("/api/jwks", async (req, res) => {
    const jwk = await jose.exportJWK(publicKey);
    res.json({
      keys: [
        {
          ...jwk,
          alg: "RS256",
          use: "sig",
          kid
        }
      ]
    });
  });

  // Helper to get base URL
  const getAppUrl = (req: express.Request) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${protocol}://${host}`;
  };

  // Endpoint to initiate launch from the platform side
  app.post("/api/lti/initiate", (req, res) => {
    const { 
      target_link_uri, 
      login_initiation_url, 
      client_id 
    } = req.body;

    if (!target_link_uri || !login_initiation_url || !client_id) {
      return res.status(400).send("Missing tool configuration");
    }

    const appUrl = getAppUrl(req);
    
    // Construct the URL to redirect to the Tool's Login Initiation URL
    const params = new URLSearchParams();
    params.append('iss', appUrl);
    params.append('target_link_uri', target_link_uri);
    params.append('login_hint', 'user-123'); // Fixed for mock
    params.append('lti_message_hint', 'whiteboard-launch'); 
    params.append('client_id', client_id);
    params.append('lti_deployment_id', 'deployment-1');

    const redirectUrl = `${login_initiation_url}?${params.toString()}`;
    
    res.redirect(redirectUrl);
  });

  // OIDC Auth Endpoint (receives auth request from tool)
  app.all("/api/lti/auth", async (req, res) => {
    try {
      const isPost = req.method === 'POST';
      const query = isPost ? req.body : req.query;

      const { 
        client_id, 
        redirect_uri, 
        state, 
        nonce, 
        login_hint, 
        prompt 
      } = query;

      if (!client_id || !redirect_uri || !nonce) {
        console.error("Missing OIDC params:", query);
        return res.status(400).send("Missing required OIDC parameters");
      }

      console.log("OIDC Request from Tool:", query);

      // App URL should be configured in env, default to local if missing
      const appUrl = getAppUrl(req);

      // Create LTI 1.3 id_token
      const jwtPayload = {
        iss: appUrl,
        sub: login_hint || "user-123",
        aud: client_id,
        nonce: nonce,
        name: "Test Instructor",
        given_name: "Test",
        family_name: "Instructor",
        email: "test@example.com",
        "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
        "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id": "deployment-1",
        "https://purl.imsglobal.org/spec/lti/claim/target_link_uri": redirect_uri,
        "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
          id: "link-1",
          title: "Mock Whiteboard"
        },
        "https://purl.imsglobal.org/spec/lti/claim/roles": [
          "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor"
        ],
        "https://purl.imsglobal.org/spec/lti/claim/context": {
          id: "course-1",
          label: "CS101",
          title: "Introduction to Computer Science",
          type: ["CourseSection"]
        }
      };

      const jwt = await new jose.SignJWT(jwtPayload)
        .setProtectedHeader({ alg: 'RS256', kid })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(privateKey);

      // Auto-submit form back to tool
      const html = `
        <html>
          <body onload="document.forms[0].submit()">
            <form method="POST" action="${redirect_uri}">
              <input type="hidden" name="id_token" value="${jwt}" />
              <input type="hidden" name="state" value="${state}" />
            </form>
            <p>Launching LTI Tool...</p>
          </body>
        </html>
      `;

      res.send(html);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error generating LTI launch");
    }
  });

  // API to fetch platform config details (so frontend can show them to the user)
  app.get("/api/platform-info", (req, res) => {
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    res.json({
      issuer: appUrl,
      authUrl: `${appUrl}/api/lti/auth`,
      jwksUrl: `${appUrl}/api/jwks`,
      tokenUrl: `${appUrl}/api/lti/token` // Mock token url if needed
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 5
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
