import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'tb_cart_v1';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  const setQty = useCallback((product, qty) => {
    if (!product?.id) return;
    const nextQty = Math.max(0, Number(qty) || 0);
    setCart((prev) => {
      const next = { ...prev };
      if (nextQty <= 0) delete next[product.id];
      else next[product.id] = { qty: nextQty, product };
      return next;
    });
  }, []);

  const getQty = useCallback(
    (productId) => Number(cart[productId]?.qty) || 0,
    [cart]
  );

  const clearCart = useCallback(() => setCart({}), []);

  const cartCount = useMemo(
    () => Object.values(cart).reduce((sum, e) => sum + (Number(e?.qty) || 0), 0),
    [cart]
  );

  const lines = useMemo(
    () =>
      Object.values(cart)
        .filter((e) => e?.qty > 0 && e?.product)
        .map((e) => ({
          ...e,
          lineTotal: Number(e.product.price) * Number(e.qty),
        })),
    [cart]
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.lineTotal, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      cart,
      lines,
      subtotal,
      cartCount,
      getQty,
      setQty,
      clearCart,
      isCartOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      toggleCart: () => setIsCartOpen((v) => !v),
    }),
    [cart, lines, subtotal, cartCount, getQty, setQty, clearCart, isCartOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
