import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../hooks";
import { Mascot } from "../../../shared/ui";

export function FloatingCartBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: cart } = useCart();

  // Do not show floating bar if cart is empty or user is on Cart, Orders, or Checkout pages
  if (
    !cart ||
    cart.itemCount === 0 ||
    location.pathname === "/cart" ||
    location.pathname.startsWith("/orders") ||
    location.pathname.startsWith("/checkout")
  ) {
    return null;
  }

  // Calculate actual total amount if backend totalAmount is 0 (fallback enrichment)
  let displayTotalAmount = cart.totalAmount;
  if (displayTotalAmount === 0 && cart.projects) {
    const itemsTotal = cart.projects.reduce((acc, p) => acc + p.itemsAmount, 0);
    const shippingTotal = cart.projects.reduce((acc, p) => acc + p.shippingFee, 0);
    displayTotalAmount = itemsTotal + (itemsTotal >= 50000 ? 0 : shippingTotal);
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center justify-between gap-4 rounded-full border-2 border-ink bg-brand px-6 py-3 text-white shadow-stamp transition-transform duration-200 hover:scale-105 active:scale-95">
      <button
        type="button"
        onClick={() => navigate("/cart")}
        className="flex items-center gap-3 font-display font-bold outline-none"
      >
        <div className="relative flex items-center justify-center">
          <Mascot variant="face" className="h-7 w-7 rounded-full bg-white/20 p-0.5" />
          <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink bg-peach text-xs font-black text-ink">
            {cart.itemCount}
          </span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-xs text-white/80">장바구니에 담긴 상품</span>
          <span className="text-base font-extrabold tabular-nums">
            {displayTotalAmount > 0 ? `${displayTotalAmount.toLocaleString()}원` : `${cart.itemCount}개 항목`}
          </span>
        </div>

        <div className="ml-2 flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white hover:text-brand">
          <ShoppingBag className="h-4 w-4" />
          <span>장바구니 보기 ➔</span>
        </div>
      </button>
    </div>
  );
}
