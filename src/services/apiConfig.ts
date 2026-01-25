const BASE_URL = "http://localhost:3000";

const ApiConfig = {
  baseUrl: BASE_URL,
  // shopify products
  getProducts: `${BASE_URL}/api/shop/products`,
  getVendors: `${BASE_URL}/api/shop/vendors`,
  getCollections: `${BASE_URL}/api/shop/collections`,

  storeProduct:`${BASE_URL}/api/optimization/store`,
  getStoredProduct:`${BASE_URL}/api/optimization/products?serviceName=title`,
  getStoredDesProduct:`${BASE_URL}/api/optimization/products?serviceName=description`,
  aiTitleOptimization:`${BASE_URL}/api/optimization/ai/title`,
  updateShopifyTitle:`${BASE_URL}/api/optimization/apply/title`,
  updateShopifyDescription:`${BASE_URL}/api/optimization/apply/description`,
};

export default ApiConfig;
