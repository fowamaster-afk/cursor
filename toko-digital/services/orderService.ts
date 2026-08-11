import { supabase } from "./supabaseClient";

/** Status valid untuk sebuah order. */
export type OrderStatus = "pending" | "paid" | "cancelled";

/** Produk yang terkait dalam sebuah order (hasil JOIN dengan products). */
export interface OrderProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
}

/** Order yang sudah membawa data produk terkait (hasil JOIN products). */
export interface UserOrder {
  id: string;
  product_id: string;
  amount: number;
  user_id: string;
  status: OrderStatus;
  created_at: string;
  products: OrderProduct | OrderProduct[] | null;
}

export interface Order {
  id: string;
  product_id: string;
  amount: number;
  user_id: string;
  status: OrderStatus;
  created_at: string;
}

/**
 * Membuat order baru pada tabel `orders`.
 * Mengembalikan objek order yang berhasil dibuat.
 */
export async function createOrder(
  productId: string,
  amount: number,
  userId: string
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      product_id: productId,
      amount,
      user_id: userId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Gagal membuat order:", error.message);
    throw new Error(`Gagal membuat order: ${error.message}`);
  }

  return data as Order;
}

/**
 * Memperbarui status dari sebuah order.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Gagal memperbarui status order:", error.message);
    throw new Error(`Gagal memperbarui status order: ${error.message}`);
  }
}

/**
 * Mengambil semua order berstatus 'paid' untuk seorang user,
 * lengkap dengan data produk terkait (JOIN tabel products).
 */
export async function getUserOrders(userId: string): Promise<UserOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(*)")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil order user:", error.message);
    throw new Error(`Gagal mengambil order user: ${error.message}`);
  }

  return (data as UserOrder[]) ?? [];
}
