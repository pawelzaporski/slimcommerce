import type {
  ApiErrorPayload,
  AuthResponse,
  Cart,
  CartItem,
  Category,
  CheckoutPayload,
  CheckoutResponse,
  Client,
  PaymentMethod,
  Product,
  ProductDetail,
  ShippingMethod,
  StorefrontSettings,
} from './types';
import { SITE_URL } from './site';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiFetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      // Po tym nagłówku API rozpoznaje miejsce sprzedaży (próg darmowej dostawy) -
      // także przy renderowaniu po stronie serwera, gdzie nie ma nagłówka Origin.
      'X-Sales-Channel': SITE_URL,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;

  if (!response.ok) {
    const message = (payload as ApiErrorPayload).error ?? 'Wystąpił błąd.';
    throw new ApiError(message, response.status, (payload as ApiErrorPayload).errors);
  }

  return payload;
}

// Produkty

export function getProducts(revalidate = 60, categorySlug?: string): Promise<Product[]> {
  const query = categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : '';
  return apiFetch<Product[]>(`/api/storefront/products${query}`, {
    next: { revalidate },
  });
}

// Kategorie

export function getCategories(revalidate = 300): Promise<Category[]> {
  return apiFetch<Category[]>('/api/storefront/categories', {
    next: { revalidate },
  });
}

/** Kategorie z bezpiecznym fallbackiem - nawigacja nie może wywalić całego layoutu, gdy API leży. */
export async function getCategoriesSafe(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch {
    return [];
  }
}

export function getProduct(id: number | string, revalidate = 60): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/api/storefront/products/${id}`, {
    next: { revalidate },
  });
}

// Koszyk

export function createCart(): Promise<Cart> {
  return apiFetch<Cart>('/api/storefront/carts', {
    method: 'POST',
    body: JSON.stringify({}),
    cache: 'no-store',
  });
}

export function getCart(token: string): Promise<Cart> {
  return apiFetch<Cart>(`/api/storefront/carts/${token}`, { cache: 'no-store' });
}

export function addCartItem(token: string, variantId: number, quantity: number): Promise<CartItem> {
  return apiFetch<CartItem>(`/api/storefront/carts/${token}/items`, {
    method: 'POST',
    body: JSON.stringify({ variant_id: variantId, quantity }),
    cache: 'no-store',
  });
}

export function updateCartItem(token: string, itemId: number, quantity: number): Promise<CartItem> {
  return apiFetch<CartItem>(`/api/storefront/carts/${token}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
    cache: 'no-store',
  });
}

export function removeCartItem(token: string, itemId: number): Promise<void> {
  return apiFetch<void>(`/api/storefront/carts/${token}/items/${itemId}`, {
    method: 'DELETE',
    cache: 'no-store',
  });
}

/** Kod rabatowy - błąd (nie istnieje, wygasł, za mały koszyk...) przychodzi jako ApiError z errors.code. */
export function applyDiscountCode(token: string, code: string): Promise<Cart> {
  return apiFetch<Cart>(`/api/storefront/carts/${token}/discount-code`, {
    method: 'POST',
    body: JSON.stringify({ code }),
    cache: 'no-store',
  });
}

export function removeDiscountCode(token: string): Promise<Cart> {
  return apiFetch<Cart>(`/api/storefront/carts/${token}/discount-code`, {
    method: 'DELETE',
    cache: 'no-store',
  });
}

// Ustawienia sklepu (próg darmowej dostawy z miejsca sprzedaży)

export function getStorefrontSettings(revalidate = 60): Promise<StorefrontSettings> {
  return apiFetch<StorefrontSettings>('/api/storefront/settings', { next: { revalidate } });
}

/** Bezpieczny wariant do layoutu / stron statycznych - brak API nie może wywalić strony. */
export async function getStorefrontSettingsSafe(): Promise<StorefrontSettings> {
  try {
    return await getStorefrontSettings();
  } catch {
    return { sales_channel: null, free_shipping_from: null };
  }
}

// Klient (auth)

export function registerClient(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/storefront/register', {
    method: 'POST',
    body: JSON.stringify(data),
    cache: 'no-store',
  });
}

export function loginClient(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/api/storefront/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
}

export function getMe(token: string): Promise<Client> {
  return apiFetch<Client>('/api/storefront/me', { token, cache: 'no-store' });
}

// Checkout

export function getShippingMethods(): Promise<ShippingMethod[]> {
  return apiFetch<ShippingMethod[]>('/api/storefront/shipping-methods', { next: { revalidate: 300 } });
}

export function getPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>('/api/storefront/payment-methods', { next: { revalidate: 300 } });
}

export function checkout(payload: CheckoutPayload, token?: string): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>('/api/storefront/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
    cache: 'no-store',
  });
}
