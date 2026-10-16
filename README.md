# Songkran 2027 Travel Dashboard (Next.js + Supabase + Vercel)

เปรียบเทียบงบหนีร้อน + จุดวิ่ง Trail/City ของแต่ละเมือง (ออกจาก CNX)

## สิ่งที่เพิ่มจากเวอร์ชัน HTML
- **อากาศจริง** `/api/weather` (Open-Meteo, ฟรี): ทริปอยู่ใน 16 วัน = พยากรณ์, ไกลกว่านั้น = เฉลี่ยย้อนหลัง 3 ปีของวันที่เดียวกัน
- **อัตราแลกเปลี่ยนจริง** `/api/fx` (open.er-api.com, ฟรี, แคช 6 ชม.)
- **ลิงก์แชร์แผน** ปุ่ม "แชร์" บันทึกลง Supabase แล้วได้ลิงก์ `/t/<id>`
- **ชื่อทริป + #แฮชแท็ก** บันทึกไปกับแผน แสดงเป็นชิป และพิมพ์ลง PDF
- **เข้าสู่ระบบด้วยอีเมล (magic link)**: บันทึก/บันทึกทับ/เปิด/ลบ "ทริปของฉัน" ข้ามเครื่องได้
- **แผนรายวันอัตโนมัติ**, ตัวกรองวีซ่า, ลิงก์ค้นหาตั๋ว (Google Flights) / ที่พัก (Booking) ตามวันที่ที่เลือก, ลิงก์เปิดจุดวิ่งใน Google Maps
- **Rate limit** การสร้างลิงก์แชร์: 10 ลิงก์/ชม./IP สำหรับคนไม่ล็อกอิน, 50 ทริป/บัญชี
- ข้อมูลเมืองอยู่ที่ `data/cities.json` (เพิ่มเมือง/จุดวิ่งโดยไม่ต้องแก้โค้ด) ตัวคูณราคา/ฤดูกาลอยู่ที่ `lib/calc.js`

## รันในเครื่อง
```bash
npm install
cp .env.example .env.local   # ใส่ค่า Supabase (ข้ามได้ถ้ายังไม่ใช้แชร์/เข้าสู่ระบบ)
npm run dev                  # http://localhost:3000
```

## ตั้งค่า Supabase (สำหรับปุ่มแชร์)
1. สร้างโปรเจกต์ใน Supabase แล้วเปิด SQL Editor รันไฟล์ `supabase/schema.sql`
2. Project Settings > API: คัดลอก **Project URL** และ **service_role key**
   - service_role key ใช้ฝั่ง server เท่านั้น ห้ามใส่ชื่อตัวแปรขึ้นต้น `NEXT_PUBLIC_` และห้าม commit
3. ปุ่ม "เข้าสู่ระบบ" ต้องมี `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ด้วย (ถ้าไม่ตั้ง ปุ่มนี้จะไม่แสดง)
4. Authentication > URL Configuration: ตั้ง Site URL เป็นโดเมน Vercel ของคุณ และเพิ่ม `http://localhost:3000` ใน Redirect URLs
   - อีเมลเริ่มต้นของ Supabase ส่งได้จำกัดมากต่อชั่วโมง ถ้าใช้จริงจังให้ตั้ง SMTP ของตัวเอง

## Deploy
1. `git init && git add . && git commit -m "init"` แล้ว push ขึ้น GitHub repo ใหม่
2. Vercel > Add New Project > เลือก repo (Framework จะตรวจเป็น Next.js เอง)
3. Settings > Environment Variables ใส่ตัวแปรทั้ง 4 ตัวตาม `.env.example` แล้ว Redeploy
4. push ครั้งต่อไป Vercel deploy ให้อัตโนมัติ

## ข้อควรรู้
- ราคาตั๋ว/โรงแรม ระยะทางจุดวิ่ง เวลาบิน และกฎวีซ่า เป็นค่าประมาณ ตรวจสอบก่อนใช้จริง
- Rate limit ใช้ IP + ฐานข้อมูล ป้องกันการสแปมแบบพื้นฐาน ถ้าเปิดสาธารณะหนักๆ ควรเสริม Vercel Firewall
- ราคาตั๋ว/ที่พักแบบสดยังไม่มี: Amadeus Self-Service ปิดบริการไปแล้วเมื่อ 17 ก.ค. 2026 จึงใช้ลิงก์ค้นหาแทน
