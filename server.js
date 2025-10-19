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
const PORT = process.env.PORT || 3001;

// ✅ ตัวอย่างข้อมูลจำลอง Agent
const VALID_STATUSES = ["Available", "Active", "Wrap Up", "Not Ready", "Offline"];
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

// Helpers
const nowISO = () => new Date().toISOString();
const findAgent = (code) => agents.find(a => a.code === code);

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

//  สร้าง route structure
app.get('/api/agents/:code', (req, res) => {
  const code = req.params.code;
  const agent = agents.find(a => a.code === code);
  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }
  res.json({ success: true, data: agent, timestamp: new Date().toISOString() });
});

// อัปเดตสถานะ Agent (PATCH)
app.patch('/api/agents/:code/status', (req, res) => {
  const agentCode = req.params.code;

  // รองรับตัวพิมพ์ใหญ่เล็ก/ช่องว่าง
  let s = req.body?.status;
  if (!s) return res.status(400).json({ success:false, message:'status is required', allow: VALID_STATUSES });
  s = s.toString().trim().replace(/\s+/g, ' ');
  const match = VALID_STATUSES.find(v => v.toLowerCase() === s.toLowerCase());
  if (!match) return res.status(400).json({ success:false, message:'Invalid status', allow: VALID_STATUSES });

  const agent = findAgent(agentCode);
  if (!agent) return res.status(404).json({ success:false, message:'Agent not found' });

  const oldStatus = agent.status;
  agent.status = match;

  // Log การเปลี่ยนสถานะ (ดูได้ใน terminal)
  console.log(`[${nowISO()}] Agent ${agentCode}: ${oldStatus} → ${agent.status}`);

  res.json({
    success: true,
    message: 'Status updated',
    data: { code: agent.code, oldStatus, newStatus: agent.status },
    timestamp: nowISO()
  });
});

app.get('/api/dashboard/stats', (_req, res) => {
  const total = agents.length;
  const countBy = (status) => agents.filter(a => a.status === status).length;

  const breakdown = {
    available: { count: countBy('Available') },
    active:    { count: countBy('Active') },
    wrapUp:    { count: countBy('Wrap Up') },
    notReady:  { count: countBy('Not Ready') },
    offline:   { count: countBy('Offline') }
  };

  Object.values(breakdown).forEach(x => {
    x.percent = total > 0 ? Math.round((x.count / total) * 100) : 0; // กันหาร 0
  });

  res.json({
    success: true,
    data: { total, statusBreakdown: breakdown },
    timestamp: nowISO()
  });
});

/* ===== Mini Project: Login / Logout ===== */
app.post('/api/agents/:code/login', (req, res) => {
  const code = req.params.code;
  const name = req.body?.name?.toString().trim();

  let agent = findAgent(code);
  if (!agent) {
    agent = { code, name: name || `Agent ${code}`, status: 'Available' };
    agents.push(agent);
  } else if (name) {
    agent.name = name;
  }

  const oldStatus = agent.status;
  agent.status = 'Available';
  agent.loginTime = nowISO();

  console.log(`[${nowISO()}] Agent ${code}: ${oldStatus || '-'} → ${agent.status} (login)`);

  res.json({ success: true, message: 'Logged in', data: agent, timestamp: nowISO() });
});

app.post('/api/agents/:code/logout', (req, res) => {
  const code = req.params.code;
  const agent = findAgent(code);
  if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });

  const oldStatus = agent.status;
  agent.status = 'Offline';
  delete agent.loginTime;

  console.log(`[${nowISO()}] Agent ${code}: ${oldStatus} → Offline (logout)`);

  res.json({ success: true, message: 'Logged out', data: agent, timestamp: nowISO() });
});

/* ===== Error Handler (ไว้ล่างสุด) ===== */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', timestamp: nowISO() });
});

// ขั้นที่ 5: เริ่ม server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
