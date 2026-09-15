"use client";

import { create } from "zustand";

type UiState = {
  bagCount: number;
};

export const useUiStore = create<UiState>(() => ({
  bagCount: 0,
}));
