// const BASE_URL = "http://localhost:3000";
const BASE_URL = "https://one-globe.onrender.com"
const ApiConfig = {
  baseUrl: BASE_URL,
  // shopify products
  getProducts: `${BASE_URL}/api/shop/products`,
  getVendors: `${BASE_URL}/api/shop/vendors`,
  getCollections: `${BASE_URL}/api/shop/collections`,

  storeProduct:`${BASE_URL}/api/optimization/store`,
  getStoredProduct:`${BASE_URL}/api/optimization/products?serviceName=title`,
  getStoredDesProduct:`${BASE_URL}/api/optimization/products?serviceName=description`,
  getStoredMetaTitileProduct:`${BASE_URL}/api/optimization/products?serviceName=metaTitle`,
  getStoredMetaDecProduct:`${BASE_URL}/api/optimization/products?serviceName=metaDescription`,
  aiTitleOptimization:`${BASE_URL}/api/optimization/ai/title`,
  aiDescriptionOptimization:`${BASE_URL}/api/optimization/ai/description`,
  updateShopifyTitle:`${BASE_URL}/api/optimization/apply/title`,
  updateShopifyDescription:`${BASE_URL}/api/optimization/apply/description`,

  // meta
  aiMetaTitleOptimization:`${BASE_URL}/api/meta/title/optimize`,
  updateMetaTitleOptimization:`${BASE_URL}/api/meta/title/save`,

  aiMetadescriptionOptimization:`${BASE_URL}/api/meta/description/optimize`,
  updateMetaDescriptionOptimization:`${BASE_URL}/api/meta/description/save`,


};

export default ApiConfig;
