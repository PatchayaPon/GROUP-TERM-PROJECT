# CS100 POWER UP! — Learning Portfolio

ระบบ Portfolio สำหรับ CS100 Final Demo โดยใช้ Node.js และไฟล์ JSON ฝั่ง Server (ไม่ใช้ localStorage เป็นแหล่งข้อมูลหลัก)

## Requirements
- Node.js 18 หรือใหม่กว่า
- Web Browser
- Internet connection สำหรับ Bootstrap CDN

## Run locally
```bash
npm start
```
จากนั้นเปิด `http://localhost:3000`

## Data storage
ข้อมูลถูกจัดเก็บที่ `data/portfolios.json` ซึ่งอยู่นอกส่วน URL ที่ผู้ใช้เปิดได้โดยตรง Server เป็นผู้จัดการอ่าน/เขียนไฟล์นี้ ข้อมูลยังคงอยู่หลัง restart server ตราบใดที่ไฟล์และ disk ของเครื่อง/EC2 ยังอยู่

## Main features
- Create, View, Edit, Delete Portfolio
- Create/Delete Portfolio Items
- Add/Delete Skills และ Evidence URLs
- Reflection ครบ 4 fields: `whatIDid`, `whatILearned`, `challenge`, `nextStep`
- Import Portfolio Item ด้วย Copy/Paste JSON พร้อมตรวจรูปแบบและ ID ซ้ำ
- เลือก Portfolio ปลายทางก่อน Import
- Export เฉพาะ Portfolio ที่เลือกเป็น `my-portfolio.json`
- Server-side validation ก่อนบันทึก

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
    "whatIDid": "What I did",
    "whatILearned": "What I learned",
    "challenge": "Challenge encountered",
    "nextStep": "What I will do next"
  },
  "evidence": ["https://example.com/evidence"],
  "challengeId": "CH-001",
  "hostGroup": "Group A",
  "category": "discover",
  "schemaVersion": "1.0"
}
```
`challengeId`, `hostGroup`, `category`, `schemaVersion` เป็น metadata เพิ่มเติม; category ที่รองรับคือ `discover`, `mix`, `levelup`.

## API
- `GET /api/portfolios` — read all portfolios
- `PUT /api/portfolios` — validate and save all portfolios

ไฟล์ข้อมูล JSON ไม่สามารถเปิดผ่าน URL ได้โดยตรง

## AWS EC2 deployment (overview)
1. ติดตั้ง Node.js บน EC2
2. Upload/clone project
3. รัน `npm start` (แนะนำให้ใช้ process manager เช่น systemd เพื่อให้ service กลับมาทำงานหลัง reboot)
4. เปิด Security Group เฉพาะ port ที่ใช้งานจริง (เช่น 3000 หรือ 80 ผ่าน reverse proxy)
5. ใช้ Public IPv4 ของ EC2 เปิด Web App

**สำคัญ:** อย่า commit AWS credentials, private keys, `.env` หรือข้อมูลส่วนบุคคลลง GitHub. `data/portfolios.json` ถูก ignore โดย `.gitignore`.
