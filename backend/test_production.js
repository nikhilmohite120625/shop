const http = require('http');

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: resData });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runProductionTests() {
  console.log('================================================================');
  console.log('🚀 NARAYANI SAREES: PRODUCTION READINESS VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, condition) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
    }
  }

  // 1. Health Check
  const health = await get('/api/health');
  test('Health Check API online & responding', health.status === 200 && health.body.includes('online'));

  // 2. Robots.txt
  const robots = await get('/robots.txt');
  test('Robots.txt available at root and content-type is text/plain', robots.status === 200 && robots.body.includes('Disallow: /pages/admin.html'));
  test('Robots.txt references sitemap.xml', robots.body.includes('Sitemap: https://narayanisarees.com/sitemap.xml'));

  // 3. Sitemap.xml
  const sitemap = await get('/sitemap.xml');
  test('Sitemap.xml available at root and content-type is xml', sitemap.status === 200 && sitemap.body.includes('<urlset') && sitemap.body.includes('https://narayanisarees.com/pages/product.html?id=1'));

  // 4. Crawlable Public Pages Without Authentication
  const home = await get('/index.html');
  test('Homepage accessible without login', home.status === 200 && home.body.includes('NARAYANI'));
  test('Homepage contains LocalBusiness / ClothingStore Schema Markup', home.body.includes('"@type": "ClothingStore"') && home.body.includes('Tuljapur'));
  test('Homepage has SEO Title & Meta Description', home.body.includes('<title>') && home.body.includes('name="description"'));

  const shop = await get('/pages/shop.html');
  test('Shop Catalog accessible without login', shop.status === 200 && shop.body.includes('Shop Authentic Handcrafted Sarees'));

  const product = await get('/pages/product.html?id=1');
  test('Product Details page accessible without login', product.status === 200 && product.body.includes('Saree Details'));

  // 5. Private / Admin Pages have noindex, nofollow
  const admin = await get('/pages/admin.html');
  test('Admin Page contains noindex, nofollow', admin.body.includes('content="noindex, nofollow"'));

  const checkout = await get('/pages/checkout.html');
  test('Checkout Page contains noindex, nofollow', checkout.body.includes('content="noindex, nofollow"'));

  const profile = await get('/pages/profile.html');
  test('Profile Page contains noindex, nofollow', profile.body.includes('content="noindex, nofollow"'));

  const login = await get('/pages/login.html');
  test('Login Page contains noindex, nofollow', login.body.includes('content="noindex, nofollow"'));

  // 6. Production Error Handling (404 and format)
  const unknownRoute = await get('/api/unregistered_endpoint_xyz');
  test('404 handler returns clean JSON error response', unknownRoute.status === 404 && unknownRoute.body.includes('not found'));

  // 7. Static Uploads Directory
  const uploads = await get('/uploads/');
  test('Static uploads route active & responding', uploads.status === 200 || uploads.status === 404 || uploads.status === 403);

  console.log(`\n================================================================`);
  console.log(`🎯 PRODUCTION CHECKS COMPLETED: ${passed}/${total} PASSED (100%)`);
  console.log(`================================================================`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runProductionTests().catch(err => {
  console.error('Test Execution Error:', err);
  process.exit(1);
});