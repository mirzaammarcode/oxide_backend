# OXIDE backend (basic, no payment)

This is a small server that stores orders and shipping addresses. No payment
processing — it just records what was ordered and where to ship it.

## What's in here
- `server.js` — the server itself. No external libraries needed (no `npm install` required).
- `data/orders.json` — created automatically the first time an order is placed. This is your "database" — just a file for now.

## Run it on your own computer
1. Make sure Node.js is installed (nodejs.org)
2. Open a terminal in this folder
3. Run:
   ```
   node server.js
   ```
4. You should see: `OXIDE backend running at http://localhost:3001`
5. Open `index.html` (your website) in a browser — the checkout form will now actually save orders here.

## Check what orders came in
Visit `http://localhost:3001/api/orders` in your browser. You'll see the raw order data
(name, email, address, items, total) for everyone who's checked out.

## Putting this online for real
Right now this only works while it's running on your own computer, and only your own
browser can reach it (`localhost`). To make it live for real customers:

1. Push this folder to a GitHub repository
2. Deploy it on a service that runs Node servers — **Render** or **Railway** are the
   easiest free options (similar process to what you did with Netlify, but these
   support backend code, not just static files)
3. Once deployed, you'll get a real URL like `https://oxide-backend.onrender.com`
4. Open `index.html`, find this line near the top of the `<script>` section:
   ```js
   const API_BASE = "http://localhost:3001";
   ```
   and change it to your real backend URL, then re-deploy `index.html` to Netlify as before.

## What's still missing for a real store
- **A real database** instead of a JSON file (so it can handle many orders safely at once)
- **Payment processing** (Stripe, etc.) — not included here on purpose
- **Order status updates / shipping tracking**
- **An admin login** — right now `/api/orders` is open to anyone who knows the URL
