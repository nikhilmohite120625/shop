# 🥻 Narayani Sarees — Full-Stack E-Commerce Platform

> **"Grace In Every Drape"**  
> Premium, Authentic Handcrafted Paithani, Banarasi, Kanjeevaram Silk & Festival Sarees.  
> **Physical Boutique Address:** Infront Of Shreenath Mangal Karyalaya, Naldurg Road, Tuljapur - 413601, Maharashtra, India.  
> **Seller Phone / WhatsApp:** [+91 9359594007](https://wa.me/919359594007) | **Email:** [nikhilmohitepcet@gmail.com](mailto:nikhilmohitepcet@gmail.com)

---

## 🏛️ Project Overview & Architecture

Narayani Sarees is a complete, production-ready, full-stack e-commerce web platform designed for authentic Maharashtrian Paithani, Banarasi silk, and wedding sarees.

### ⚙️ Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Modular ES6+), Font Awesome 6, Google Fonts (*Cinzel*, *Cormorant Garamond*, *Montserrat*).
- **Backend**: Node.js, Express.js REST API, JSON Web Tokens (JWT), Bcrypt password hashing, Multer file upload, PDFKit GST invoices, Nodemailer alerts.
- **Database**: MySQL 8.0+ relational schema (`database/saree_shop.sql`) with 25 tables, combined with an automatic resilient in-memory & JSON-backed data store engine for instant standalone development and 100% offline fallback.
- **External Integrations**:
  - Razorpay Online Payments (UPI, Cards, NetBanking) + Cash on Delivery (COD)
  - Direct WhatsApp Seller Order Notification (`+91 9359594007`) & Floating Widget
  - Automated Seller Email Alerts (`nikhilmohitepcet@gmail.com`)
  - Google Sheets Order Sync Service
  - Cloudinary Multi-Image Cloud Storage Service

---

## 🚀 How to Run the Application

### 1. Install Backend Dependencies
Open your terminal in the `backend/` directory:
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
node server.js
```
The server will start on **http://localhost:5000**, serving both the REST APIs and the frontend web pages.

### 3. Open in Browser
- **Store Homepage**: [http://localhost:5000/index.html](http://localhost:5000/index.html)
- **Shop Saree Catalog**: [http://localhost:5000/pages/shop.html](http://localhost:5000/pages/shop.html)
- **Shopping Cart**: [http://localhost:5000/pages/cart.html](http://localhost:5000/pages/cart.html)
- **Customer Checkout**: [http://localhost:5000/pages/checkout.html](http://localhost:5000/pages/checkout.html)
- **Admin Dashboard**: [http://localhost:5000/pages/admin.html](http://localhost:5000/pages/admin.html)
- **Customer Login**: [http://localhost:5000/pages/login.html](http://localhost:5000/pages/login.html)

---

## 🔑 Pre-Configured Test Accounts & Credentials


### 🛍️ Customer Account
| Role | Email | Password | Pre-loaded Address |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@gmail.com` | `Customer@123` | Tuljapur - 413601, Maharashtra |

*(Tip: On the `/pages/login.html` page, click any of the 4 "Quick Login Presets" buttons to test each role instantly!)*

---

---

## 🧪 Running Automated Tests
Run the comprehensive 12-point end-to-end verification suite:
```bash
cd backend
node test_e2e.js
```

---

## 📦 Directory Structure
```
saree-shop/
├── backend/
│   ├── config/ (db.js)
│   ├── controllers/ (auth, product, cart, wishlist, order, coupon, review, user, contact)
│   ├── middleware/ (auth, admin RBAC, upload, validation)
│   ├── models/ (User, Product, Category, Cart, Wishlist, Order, Coupon, Review, Contact)
│   ├── routes/ (Express REST routes)
│   ├── services/ (email, payment, cloudinary, whatsapp, sheets)
│   ├── utils/ (jwt, helper, email, invoice PDF)
│   ├── uploads/ (Uploaded saree images & generated invoices)
│   ├── server.js (Express server entry point)
│   ├── package.json
│   ├── test_e2e.js
│   └── .env & .env.example
├── database/
│   ├── saree_shop.sql (Production MySQL schema: 25 relational tables)
│   ├── init_db.js (20+ handwoven saree datasets & seeds)
│   └── seed.sql
├── frontend/
│   ├── index.html (Main Showcase Homepage)
│   ├── components/ (navbar.html, footer.html)
│   ├── css/ (12 theme stylesheets with luxury Indian palette)
│   ├── js/ (12 modular ES6+ vanilla controllers)
│   └── pages/ (shop, product, cart, checkout, wishlist, login, register, profile, orders, order-details, admin, about, contact, faq, privacy, terms, shipping, refund)
└── README.md
```
