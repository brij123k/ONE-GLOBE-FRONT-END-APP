import axios from 'axios';
import { BASE_URL } from '@/services/apiConfig';

export async function loginShop(shop: string) {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    shop,
  });

  return response.data;
}
