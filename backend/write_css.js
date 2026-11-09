const fs = require('fs');
const path = require('path');

const fe = path.join(__dirname, '../frontend');

// --- 1. CSS Files ---
const profileCss = `/* Narayani Sarees - Profile & Order Tracking Styles */
.profile-layout { display: grid; grid-template-columns: 280px 1fr; gap: 35px; padding: 50px 0 80px 0; }
.profile-sidebar { background: var(--card-bg); border-radius: var(--radius-lg); padding: 24px; border: 1px solid var(--light-gray); box-shadow: var(--shadow-sm); height: fit-content; }
.profile-user-badge { text-align: center; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid var(--light-gray); }
.profile-avatar-circle { width: 70px; height: 70px; background: var(--primary); color: var(--secondary); border-radius: 50%; margin: 0 auto 12px auto; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; border: 2px solid var(--secondary); }
.profile-user-badge h3 { font-size: 17px; margin-bottom: 2px; }
.profile-user-badge p { font-size: 12px; color: var(--gray); }
.profile-nav-list { display: flex; flex-direction: column; gap: 6px; }
.profile-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-md); font-size: 14px; font-weight: 500; color: var(--dark); transition: var(--transition); cursor: pointer; }
.profile-nav-item:hover, .profile-nav-item.active { background: var(--primary); color: var(--white); }
.profile-nav-item i { font-size: 16px; width: 20px; }
.order-card { background: var(--card-bg); border-radius: var(--radius-lg); border: 1px solid var(--light-gray); padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow-sm); }
.order-card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 14px; margin-bottom: 16px; border-bottom: 1px solid var(--light-gray); flex-wrap: wrap; gap: 10px; }
.order-num-date h4 { font-size: 16px; color: var(--primary); }
.order-num-date span { font-size: 12px; color: var(--gray); }
.order-item-row { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.order-item-img { width: 60px; height: 75px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; }
.order-item-img img { width: 100%; height: 100%; object-fit: cover; }
.order-item-info h5 { font-size: 14px; margin-bottom: 2px; }
.order-item-info p { font-size: 12px; color: var(--gray); }
.order-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; margin-top: 16px; border-top: 1px solid var(--light-gray); flex-wrap: wrap; gap: 10px; }
.order-total-price { font-size: 16px; font-weight: 700; color: var(--primary); }
.order-card-actions { display: flex; gap: 10px; }
.tracking-timeline { display: flex; justify-content: space-between; margin: 35px 0 25px 0; position: relative; }
.tracking-timeline::before { content: ''; position: absolute; top: 18px; left: 30px; right: 30px; height: 4px; background: var(--light-gray); z-index: 1; }
.timeline-step { position: relative; z-index: 2; text-align: center; flex: 1; }
.timeline-icon { width: 38px; height: 38px; border-radius: 50%; background: var(--light-gray); color: var(--gray); margin: 0 auto 8px auto; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 3px solid var(--white); }
.timeline-step.completed .timeline-icon { background: var(--primary); color: var(--white); }
.timeline-step.active .timeline-icon { background: var(--secondary); color: #222; box-shadow: 0 0 0 4px var(--secondary-light); }
.timeline-step p { font-size: 12px; font-weight: 600; color: var(--dark); }`;

const wishlistCss = `/* Narayani Sarees - Wishlist Styles */
.wishlist-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px; padding: 40px 0 80px 0; }
.wishlist-card { background: var(--card-bg); border-radius: var(--radius-lg); border: 1px solid var(--light-gray); overflow: hidden; box-shadow: var(--shadow-sm); position: relative; transition: var(--transition); }
.wishlist-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-md); }
.wishlist-thumb { height: 300px; position: relative; }
.wishlist-thumb img { width: 100%; height: 100%; object-fit: cover; }
.remove-wishlist-icon { position: absolute; top: 12px; right: 12px; background: var(--white); color: var(--danger); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--shadow-sm); }
.wishlist-content { padding: 18px; }
.wishlist-content h4 { font-size: 15px; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`;

const adminCss = `/* Narayani Sarees - Admin Panel Styles */
.admin-layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; background: #f4f6f9; }
.admin-sidebar { background: #1e1317; color: #c9c3c5; padding: 24px 0; display: flex; flex-direction: column; }
.admin-brand { padding: 0 24px 24px 24px; border-bottom: 1px solid #332228; display: flex; align-items: center; gap: 12px; }
.admin-brand h2 { color: var(--secondary); font-size: 18px; }
.admin-nav { padding: 20px 12px; display: flex; flex-direction: column; gap: 6px; flex-grow: 1; }
.admin-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: var(--radius-sm); color: #ccc; font-size: 14px; font-weight: 500; transition: var(--transition); cursor: pointer; }
.admin-nav-item:hover, .admin-nav-item.active { background: var(--primary); color: var(--white); }
.admin-nav-item i { font-size: 16px; width: 20px; }
.admin-main { padding: 30px; overflow-y: auto; height: 100vh; }
.admin-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: var(--white); padding: 16px 24px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); }
.admin-stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
.stat-card { background: var(--white); border-radius: var(--radius-md); padding: 22px; box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 18px; border-left: 4px solid var(--primary); }
.stat-icon { width: 50px; height: 50px; border-radius: 50%; background: var(--background); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 22px; }
.stat-info h4 { font-size: 12px; color: var(--gray); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.stat-info h2 { font-size: 24px; color: var(--dark); }
.data-table-card { background: var(--white); border-radius: var(--radius-md); padding: 24px; box-shadow: var(--shadow-sm); margin-bottom: 30px; }
.data-table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { background: #faf8f5; padding: 12px 16px; text-align: left; font-size: 13px; text-transform: uppercase; color: var(--gray); border-bottom: 2px solid var(--light-gray); }
.data-table td { padding: 14px 16px; border-bottom: 1px solid var(--light-gray); font-size: 14px; vertical-align: middle; }
.data-table tr:hover { background: #fbf9f5; }
.dropzone-box { border: 2px dashed var(--secondary); border-radius: var(--radius-md); padding: 40px 20px; text-align: center; background: var(--background); cursor: pointer; margin-bottom: 20px; }
.dropzone-box i { font-size: 40px; color: var(--primary); margin-bottom: 12px; }`;

const responsiveCss = `/* Narayani Sarees - Responsive Media Queries */
@media (max-width: 1024px) {
  .hero-title { font-size: 40px; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
  .categories-grid { grid-template-columns: repeat(2, 1fr); }
  .products-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-grid { grid-template-columns: 1fr 1fr; }
  .admin-stat-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .mobile-menu-btn { display: block; }
  .nav-links { position: fixed; top: 72px; left: -100%; width: 280px; height: calc(100vh - 72px); background: var(--card-bg); flex-direction: column; align-items: flex-start; padding: 30px 20px; box-shadow: var(--shadow-lg); transition: var(--transition); z-index: 999; }
  .nav-links.open { left: 0; }
  .hero-section { min-height: 60vh; padding: 50px 0; }
  .hero-title { font-size: 32px; }
  .shop-layout { grid-template-columns: 1fr; }
  .product-detail-layout { grid-template-columns: 1fr; }
  .product-gallery { flex-direction: column-reverse; }
  .gallery-thumbnails { flex-direction: row; width: 100%; }
  .thumb-item { width: 70px; height: 90px; }
  .main-image-container { height: 420px; }
  .cart-layout { grid-template-columns: 1fr; }
  .checkout-layout { grid-template-columns: 1fr; }
  .profile-layout { grid-template-columns: 1fr; }
  .admin-layout { grid-template-columns: 1fr; }
  .admin-sidebar { display: none; }
  .admin-sidebar.mobile-open { display: flex; position: fixed; inset: 0; z-index: 10000; width: 280px; }
  .reviews-grid { grid-template-columns: 1fr; }
  .festival-banner-card { grid-template-columns: 1fr; }
  .festival-banner-img { height: 260px; }
}
@media (max-width: 480px) {
  .hero-title { font-size: 26px; }
  .products-grid { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr; }
  .categories-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
  .admin-stat-cards { grid-template-columns: 1fr; }
  .saved-addresses-grid { grid-template-columns: 1fr; }
}`;

fs.writeFileSync(path.join(fe, 'css/profile.css'), profileCss, 'utf8');
fs.writeFileSync(path.join(fe, 'css/wishlist.css'), wishlistCss, 'utf8');
fs.writeFileSync(path.join(fe, 'css/admin.css'), adminCss, 'utf8');
fs.writeFileSync(path.join(fe, 'css/responsive.css'), responsiveCss, 'utf8');
console.log('CSS stylesheets created successfully!');
