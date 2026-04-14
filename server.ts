import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL}/api/auth/google/callback`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Google OAuth URL
  app.get("/api/auth/google/url", (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.status(400).json({ error: "Google OAuth not configured" });
    }

    const oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email"
      ],
      prompt: "consent"
    });

    res.json({ url });
  });

  // Google OAuth Callback
  app.get("/api/auth/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      
      // Send tokens back to the client via postMessage and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify(tokens)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. You can close this window.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error exchanging code for tokens:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // Google Drive Upload
  app.post("/api/drive/upload", async (req, res) => {
    const { tokens, fileName, content, mimeType } = req.body;

    if (!tokens) return res.status(400).json({ error: "No tokens provided" });

    try {
      const oauth2Client = new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );
      oauth2Client.setCredentials(tokens);

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const fileMetadata = {
        name: fileName || "Transcription.txt",
      };

      const media = {
        mimeType: mimeType || "text/plain",
        body: content,
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id, name, webViewLink",
      });

      res.json({ status: "ok", file: response.data });
    } catch (error) {
      console.error("Error uploading to Drive:", error);
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  // Email sending endpoint
  app.post("/api/notify", async (req, res) => {
    const { email, subject, message } = req.body;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email credentials not configured. Skipping email send.");
      return res.status(200).json({ status: "skipped", reason: "no_credentials" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Ayalga AI" <${process.env.EMAIL_USER}>`,
        to: email || process.env.EMAIL_USER,
        subject: subject || "Ayalga AI Мэдэгдэл",
        text: message || "Ayalga AI-аас шинэ мэдэгдэл ирлээ.",
      });

      res.json({ status: "ok" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ status: "error", error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
