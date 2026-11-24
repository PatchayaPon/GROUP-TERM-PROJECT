# CS100 POWER UP! — Learning Portfolio

Portfolio web app (Node.js, no database). Portfolios and items are stored as JSON on the server (`data/portfolios.json`); the browser only keeps the theme in localStorage.

**Public URL (EC2):** `http://<EC2-PUBLIC-IP>:3000` (update before the demo)

## Requirements
- Node.js 18+ (no `npm install` needed, no dependencies)
- A browser with internet access (Bootstrap CDN)

## Run locally
```bash
npm start            # http://localhost:3000
npm test             # automated tests
```

## Project structure
- `server.js` — HTTP server, REST API, server-side validation
- `public/` — the only folder served to browsers (`index.html`, `app.js`, `challenges.js`, `css/`)
- `data/portfolios.json` — saved data (git-ignored, never served by URL)
- `deploy/cs100-portfolio.service` — systemd unit for EC2

## Deploy on AWS EC2 (Amazon Linux)
1. Launch EC2, install Node.js 18+ (`sudo dnf install -y nodejs git`).
2. `git clone <repo-url> ~/GROUP-TERM-PROJECT`
3. Security Group inbound rules: **22** (SSH, My IP only) and **3000** (Anywhere) only.
4. Install the service so it restarts after reboot:
   ```bash
   sudo cp deploy/cs100-portfolio.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now cs100-portfolio
   systemctl status cs100-portfolio
   ```
   Adjust `User`, `WorkingDirectory` and the `node` path in the file if yours differ.
5. Open `http://<EC2-PUBLIC-IP>:3000` from another device.
6. Persistence check: `sudo systemctl restart cs100-portfolio` and `sudo reboot` — data must remain.

Never commit passwords, AWS credentials or `.pem` keys. If one is leaked, revoke/rotate it; deleting the file is not enough.

## Challenge & Portfolio Item exchange
**Host (booth owner)**
1. Edit `public/challenges.js` to describe your group's challenge(s) and group name.
2. Let the friend complete the challenge, then open **Host Booth** in the app.
3. Choose the challenge, enter the participant name, click **Generate JSON**.
4. Click **Copy JSON** (or download `portfolio-item.json`) and give it to the participant.

**Participant (tester)**
1. Paste the JSON into **Import Portfolio Item JSON** and click **Read JSON** (invalid JSON or wrong fields show an error).
2. Choose the destination Portfolio, review/edit all four Reflection fields.
3. Click **Save Imported Item to Server**. Importing the same item ID into the same Portfolio again is rejected.
4. Refresh the page — the item stays (read from the server).
5. Select your Portfolio and click **Export my-portfolio.json** (only that Portfolio is exported).

## Portfolio Item JSON contract
```json
{
  "id": "unique-item-id",
  "title": "Challenge title",
  "type": "Challenge",
  "date": "2026-11-24",
  "role": "Participant",
  "description": "What the participant did",
  "skills": ["Problem solving"],
  "reflection": {
    "whatIDid": "...", "whatILearned": "...", "challenge": "...", "nextStep": "..."
  },
  "evidence": ["https://example.com/evidence"],
  "challengeId": "CH-001",
  "hostGroup": "Group A",
  "category": "discover",
  "schemaVersion": "1.0"
}
```
`challengeId`, `hostGroup`, `category` (`discover` | `mix` | `levelup`), `schemaVersion` (`"1.0"`) are optional metadata.

## API
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/portfolios` | List portfolios |
| POST | `/api/portfolios` | Create portfolio |
| PUT | `/api/portfolios/:id` | Edit portfolio |
| DELETE | `/api/portfolios/:id` | Delete portfolio |
| POST | `/api/portfolios/:id/items` | Add item (400 invalid, 409 duplicate ID) |
| DELETE | `/api/portfolios/:id/items/:itemId` | Delete item |

Every write re-reads the file and saves one change, so simultaneous users do not overwrite each other. See `TESTING.md` for the test checklist.
