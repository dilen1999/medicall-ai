import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useReorder } from "./useOrders";
import { useCartStore } from "@/stores/cartStore";

export function useReorderToCart() {
  const reorder = useReorder();
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  async function reorderToCart(orderId: string) {
    try {
      const items = await reorder.mutateAsync(orderId);
      items.forEach((item) => addItem(item));
      toast.success("Items added to your cart");
      navigate("/cart");
    } catch {
      toast.error("Could not reorder these items right now.");
    }
  }

  return { reorderToCart, isReordering: reorder.isPending };
}
