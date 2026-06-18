// OXIDE backend — a basic server with a simple file-based "database".
// No payment processing here on purpose — this just stores orders + addresses.
// Run locally with: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'data', 'orders.json');

// ---------- "DATABASE" ----------
// This is the simplest possible database: a JSON file on disk.
// Good for learning/demo. A real store would use something like
// PostgreSQL, MySQL, or MongoDB instead, because a JSON file can't
// safely handle many people placing orders at the same exact time.
function ensureDB() {
  if (!fs.existsSync(path.dirname(DB_FILE))) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ orders: [] }, null, 2));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ---------- PRODUCT CATALOG ----------
// In a bigger app this would also live in the database. Keeping it
// here in code keeps this example simple.
const products = [
  { id: 1, name: "Foreman Field Jacket", cat: "Outerwear", price: 228 },
  { id: 2, name: "14oz Raw Selvedge Jean", cat: "Denim", price: 165 },
  { id: 3, name: "Ironclad Flannel Overshirt", cat: "Shirting", price: 118 },
  { id: 4, name: "Mill Crew Sweatshirt", cat: "Knitwear", price: 92 },
  { id: 5, name: "Dock Worker Coat", cat: "Outerwear", price: 265 },
  { id: 6, name: "Heavy Cotton Henley", cat: "Shirting", price: 68 },
  { id: 7, name: "Cargo Utility Trouser", cat: "Bottoms", price: 138 },
  { id: 8, name: "Waxed Canvas Vest", cat: "Outerwear", price: 154 },
];

// ---------- HELPERS ----------
function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    // CORS: lets your frontend (running on a different address/port,
    // or opened as a plain file) talk to this backend during development.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = '';
    req.on('data', (c) => (chunks += c));
    req.on('end', () => {
      try {
        resolve(chunks ? JSON.parse(chunks) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function isValidOrder(body) {
  if (!body || typeof body !== 'object') return false;
  if (!Array.isArray(body.items) || body.items.length === 0) return false;
  const c = body.customer;
  if (!c || !c.name || !c.email || !c.address || !c.city || !c.zip) return false;
  return true;
}

// ---------- SERVER ----------
const server = http.createServer(async (req, res) => {
  // Preflight CORS request
  if (req.method === 'OPTIONS') {
    return sendJSON(res, 204, {});
  }

  // GET /api/products — list what's for sale
  if (req.method === 'GET' && req.url === '/api/products') {
    return sendJSON(res, 200, { products });
  }

  // POST /api/checkout — save a new order (no payment, just record-keeping)
  if (req.method === 'POST' && req.url === '/api/checkout') {
    let body;
    try {
      body = await readBody(req);
    } catch {
      return sendJSON(res, 400, { error: 'Invalid JSON body' });
    }

    if (!isValidOrder(body)) {
      return sendJSON(res, 400, { error: 'Missing required order or address fields' });
    }

    // Recalculate total on the server — never trust a price sent from the browser
    let total = 0;
    for (const item of body.items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        return sendJSON(res, 400, { error: `Unknown product id ${item.id}` });
      }
      total += product.price * (item.qty || 1);
    }

    const db = readDB();
    const order = {
      id: 'ORD-' + Date.now(),
      items: body.items,
      total,
      customer: body.customer,
      createdAt: new Date().toISOString(),
      status: 'received',
    };
    db.orders.push(order);
    writeDB(db);

    return sendJSON(res, 200, { orderId: order.id, total: order.total });
  }

  // GET /api/orders — basic admin view, no login (fine for local testing only)
  if (req.method === 'GET' && req.url === '/api/orders') {
    const db = readDB();
    return sendJSON(res, 200, { orders: db.orders });
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`OXIDE backend running at http://localhost:${PORT}`);
  console.log(`Try: GET  http://localhost:${PORT}/api/products`);
  console.log(`     GET  http://localhost:${PORT}/api/orders`);
});
