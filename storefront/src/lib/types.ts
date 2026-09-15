export interface Product {
  id: number;
  external_id: string | null;
  sku: string;
  name: string;
  base_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
}

export interface ProductVariant {
  id: number;
  external_id: string | null;
  product_id: number;
  sku: string;
  ean: string | null;
  price: string;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail extends Product {
  variants: ProductVariant[];
  categories: Category[];
}

export interface CartItem {
  id: number;
  cart_id: number;
  variant_id: number;
  quantity: number;
  created_at: string;
  updated_at: string;
  variant: ProductVariant;
}

export interface Cart {
  id: number;
  token: string;
  client_id: number | null;
  name: string | null;
  status: string;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export interface Client {
  id: number;
  external_id: string | null;
  client_type: 'b2c' | 'b2b' | 'gov';
  first_name: string;
  last_name: string;
  company_name: string | null;
  nip: string | null;
  email: string;
  discount_percent: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  client: Client;
}

export interface Address {
  id: number;
  client_id: number;
  type: 'billing' | 'delivery';
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface AddressInput {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface ShippingMethod {
  id: number;
  external_id: string | null;
  name: string;
  flat_rate: string;
}

export interface PaymentMethod {
  id: number;
  external_id: string | null;
  name: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  unit_price: string;
  variant: ProductVariant;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
}

export interface Order {
  id: number;
  client_id: number;
  billing_address_id: number | null;
  delivery_address_id: number | null;
  shipping_method_id: number | null;
  total_amount: string;
  status: string;
  client: Client;
  billing_address: Address | null;
  delivery_address: Address | null;
  shipping_method: ShippingMethod | null;
  items: OrderItem[];
  payments: Payment[];
}

export interface CheckoutPayload {
  cart_token: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  delivery_address: AddressInput;
  billing_address?: AddressInput;
  shipping_method_id?: number | null;
  payment_method?: string;
}

export interface CheckoutResponse {
  token: string;
  order: Order;
}

export interface ApiErrorPayload {
  error?: string;
  errors?: Record<string, string>;
}
