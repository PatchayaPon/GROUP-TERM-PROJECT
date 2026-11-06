GROUP-TERM-PROJECT

เว็บไซต์ Personal Learning Portfolio เป็น Web Application สำหรับสร้าง Portfolio ส่วนตัว เพื่อบันทึกประสบการณ์การเรียนรู้ ทักษะ สิ่งที่ได้ลงมือทำ และสิ่งที่ได้เรียนรู้จากแต่ละกิจกรรมหรือโปรเจกต์

1. Project Description

เว็บไซต์นี้ช่วยให้ผู้ใช้สามารถสร้างและจัดการ Portfolio ของตนเองได้ โดยไม่จำเป็นต้องมีผลงานขนาดใหญ่ก่อนเริ่มต้น สามารถบันทึกประสบการณ์และพัฒนาการเรียนรู้ของตนเองได้อย่างเป็นระบบ

2. Technologies Used

* HTML5 – ใช้สร้างโครงสร้างเว็บไซต์
* CSS3 – ใช้ตกแต่งและจัดรูปแบบเว็บไซต์
* JavaScript – ใช้จัดการข้อมูลและการทำงานต่าง ๆ ของเว็บไซต์
* Bootstrap 6 – ใช้ช่วยในการออกแบบหน้าตาเว็บไซต์
* Local Storage – ใช้จัดเก็บข้อมูลภายใน Browser

3. Project Structure

GROUP-TERM-PROJECT/
│
├── css/
│   └── style.css
│
├── index.html
├── app.js
└── README.md

4. Requirements

ก่อนเปิดใช้งานเว็บไซต์ ควรมีสิ่งต่อไปนี้

* Web Browser เช่น Google Chrome, Microsoft Edge หรือ Firefox
* โปรแกรม Visual Studio Code (แนะนำ)
* Internet Connection สำหรับโหลด Bootstrap จาก CDN

5. How to Run the Website

วิธีที่ 1: เปิดผ่าน Visual Studio Code (แนะนำ)

1. ดาวน์โหลดโปรเจกต์จาก GitHub โดยกดปุ่ม Code และเลือก Download ZIP
2. แตกไฟล์ ZIP ที่ดาวน์โหลดมา
3. เปิดโปรแกรม Visual Studio Code
4. เลือก File > Open Folder
5. เลือกโฟลเดอร์ GROUP-TERM-PROJECT ที่แตกไฟล์ไว้
6. เปิดไฟล์ index.html
7. คลิกขวาที่ไฟล์ index.html แล้วเลือก Open with Live Server
8. เว็บไซต์จะเปิดขึ้นใน Web Browser โดยอัตโนมัติ

วิธีที่ 2: เปิดผ่าน Web Browser โดยตรง

1. ดาวน์โหลดและแตกไฟล์โปรเจกต์
2. เข้าไปในโฟลเดอร์ GROUP-TERM-PROJECT
3. ดับเบิลคลิกไฟล์ index.html
4. เว็บไซต์จะเปิดขึ้นใน Web Browser

6. How to Test the Website

สามารถทดลองใช้งานฟังก์ชันต่าง ๆ ของเว็บไซต์ได้ตามขั้นตอนดังนี้

6.1 Create Portfolio

1. กรอก Name
2. กรอก What I enjoy
3. กรอก What I’ve tried
4. กรอก What I’m curious about
5. กดปุ่ม Create portfolio
6. ตรวจสอบว่า Portfolio ที่สร้างปรากฏในส่วน My Portfolios

6.2 Manage Portfolio

* View: เลือก Portfolio ที่ต้องการดู
* Edit: แก้ไขข้อมูล Portfolio
* Delete: ลบ Portfolio ที่ไม่ต้องการ

6.3 Create Portfolio Item

1. กรอก Title
2. กรอก Type
3. เลือก Date
4. กรอก Your role
5. กรอก Role Description (ถ้ามี)
6. เพิ่ม Skills อย่างน้อย 1 รายการ
7. กรอกข้อมูล Reflection ให้ครบทั้ง 4 ส่วน ได้แก่
    * What I did
    * What I learned
    * Challenge
    * Next steps
8. เพิ่ม Evidence link อย่างน้อย 1 ลิงก์ โดยต้องเป็น URL ที่ถูกต้องและขึ้นต้นด้วย http:// หรือ https://
9. กดปุ่ม Save experience
10. ตรวจสอบว่าข้อมูลที่บันทึกปรากฏในส่วน Portfolio Items

6.4 Add and Delete Portfolio Items

* กด + Add Portfolio Item เพื่อเพิ่มแบบฟอร์มประสบการณ์ใหม่
* กด Delete เพื่อลบแบบฟอร์มที่ยังไม่ได้บันทึก
* กด Delete Portfolio Item เพื่อลบประสบการณ์ที่บันทึกไว้แล้ว

6.5 Add and Delete Skills

* กด + Add a skill เพื่อเพิ่มช่องกรอกทักษะ
* กดปุ่มลบด้านข้างช่องกรอกเพื่อลบทักษะที่ไม่ต้องการ

6.6 Add and Delete Evidence Links

* กด + Add another link เพื่อเพิ่มช่องกรอก Evidence
* กดปุ่มลบด้านข้างช่องกรอกเพื่อลบลิงก์ที่ไม่ต้องการ

6.7 Change Theme

* กดปุ่ม Light mode หรือ Dark mode เพื่อเปลี่ยนธีมของเว็บไซต์

6.8 Data Storage Test

1. สร้าง Portfolio และเพิ่ม Portfolio Item
2. Refresh หน้าเว็บไซต์
3. ตรวจสอบว่าข้อมูลที่บันทึกไว้ยังคงแสดงผลอยู่

หมายเหตุ: เว็บไซต์จัดเก็บข้อมูลด้วย Local Storage ข้อมูลจึงถูกเก็บไว้ใน Browser และอุปกรณ์ที่ใช้งาน ไม่ได้จัดเก็บบน Server กลาง

7. Notes

* ควรเชื่อมต่ออินเทอร์เน็ตเพื่อให้ Bootstrap CDN ทำงานได้
* ไม่จำเป็นต้องติดตั้ง Backend หรือ Database เพิ่มเติม
* หากเปิดเว็บไซต์บนอุปกรณ์หรือ Browser อื่น จะไม่สามารถเห็นข้อมูล Local Storage จากอุปกรณ์เดิมได้โดยอัตโนมัติ

8. GitHub Repository

Repository: https://github.com/PatchayaPon/GROUP-TERM-PROJECT
