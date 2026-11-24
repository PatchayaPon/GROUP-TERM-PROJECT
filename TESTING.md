# Test Evidence

## Automated (`npm test`, Node 22) — 8/8 pass
| Test | Proves |
|---|---|
| valid item saved (201) | Server saves valid Portfolio Item |
| invalid input rejected (400) | Server-side validation (date, skills, evidence, category, reflection, types, bad JSON) |
| duplicate ID rejected (409) | Duplicate item protection |
| unknown fields not stored | Server whitelists fields |
| data/source files not reachable by URL | `/data/portfolios.json`, `/server.js`, `/.git/config` are not served |
| malformed URL does not crash | Server stays up |
| simultaneous saves | 10 parallel saves all persist |
| restart persistence | Data identical after server restart |

## Manual on EC2 (fill in before submitting; attach screenshots/video)
| # | Case | Steps | Result | Date/By |
|---|---|---|---|---|
| 1 | Cross-device | Save on Browser A, open `http://<EC2-IP>:3000` on Browser B/phone | | |
| 2 | Restart | `sudo systemctl restart cs100-portfolio`, refresh | | |
| 3 | Reboot | `sudo reboot`, wait, refresh | | |
| 4 | File access | Open `http://<EC2-IP>:3000/data/portfolios.json` → not found | | |
| 5 | Security Group | Only 22 (My IP) and 3000 open | | |
| 6 | Exchange | Host generates JSON → Copy → Paste in another group's app → Import → choose Portfolio → edit Reflection → Save → Refresh | | |
| 7 | Invalid JSON | Paste `{bad` → error shown | | |
| 8 | Duplicate import | Import same JSON twice → second is rejected | | |
| 9 | Export | Export my-portfolio.json → has own Portfolio only, 4 reflection fields, ≥1 evidence URL | | |
| 10 | Copy on HTTP | Click Copy JSON on the EC2 URL (plain HTTP) → copied | | |
