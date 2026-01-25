import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export async function loginShop(shop: string) {
  const response = await axios.post(`${API_BASE}/api/auth/login`, {
    shop,
  });

  return response.data;
}
