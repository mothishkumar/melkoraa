"use client";

import { create } from "zustand";

type BagToast = {
  message: string;
  href: string;
  label: string;
};

type UiState = {
  bagCount: number;
  bagToast: BagToast | null;
};

export const useUiStore = create<UiState>(() => ({
  bagCount: 0,
  bagToast: null,
}));

export function showAddedToBagToast() {
  useUiStore.setState({
    bagToast: { message: "Added to Bag", href: "/cart", label: "View Bag" },
  });
}

export function clearBagToast() {
  useUiStore.setState({ bagToast: null });
}
