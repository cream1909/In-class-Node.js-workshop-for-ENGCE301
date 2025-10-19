// ขั้นที่ 1: Import Express
const express = require('express');
const cors = require('cors');

// ขั้นที่ 2: สร้าง app
const app = express();

// เปิดใช้งาน CORS และ JSON parser
app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

// ขั้นที่ 3: กำหนด PORT
const PORT = 3001;

// ✅ ตัวอย่างข้อมูลจำลอง Agent
const agents = [
  { 
    code: 'A001', 
    name: 'John Doe',  
    status: 'Available' 
  },
  { 
    code: 'A002', 
    name: 'Jane Roe',  
    status: 'Not Ready' 
  },
  { 
    code: 'A003', 
    name: 'Alex Kim',  
    status: 'Active' 
  }
];

// ขั้นที่ 4: สร้าง route แรก
app.get('/', (req, res) => {
  res.send('Hello Agent Wallboard!');
});

// Route ตรวจสอบสถานะระบบ (Pretty JSON)
app.get('/health', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    status: 'OK',
    timestamp: new Date().toISOString()
  }, null, 2)); // ← "null, 2" ทำให้ JSON จัดบรรทัด (Pretty-print)
});

// Route แสดงข้อมูล Agent ทั้งหมด
app.get('/api/agents', (req, res) => {
  res.json({
    success: true,
    data: agents,
    count: agents.length,
    timestamp: new Date().toISOString()
  });
});

// Route แสดงจำนวน Agent
app.get('/api/agents/count', (req, res) => {
  res.json({
    success: true,
    count: agents.length,
    timestamp: new Date().toISOString()
  });
});

// อัปเดตสถานะ Agent (PATCH)
app.patch('/api/agents/:code/status', (req, res) => {
  const agentCode = req.params.code;
  const newStatus = req.body.status;

  // รายการสถานะที่อนุญาต
  const valid = ["Available", "Active", "Wrap Up", "Not Ready", "Offline"];
  if (!valid.includes(newStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  // ค้นหา Agent
  const agent = agents.find(a => a.code === agentCode);
  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }

  // เปลี่ยนสถานะ
  const oldStatus = agent.status;
  agent.status = newStatus;

  console.log(`[${new Date().toISOString()}] Agent ${agentCode}: ${oldStatus} → ${newStatus}`);

  // ตอบกลับ
  res.json({
    success: true,
    message: 'Status updated',
    data: { code: agent.code, oldStatus, newStatus },
    timestamp: new Date().toISOString()
  });
});

// ขั้นที่ 5: เริ่ม server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
