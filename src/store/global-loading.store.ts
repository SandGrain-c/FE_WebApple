import { create } from "zustand";

type GlobalLoadingState = {
  isOpen: boolean;
  title: string;
  description: string;

  showLoading: (payload?: {
    title?: string;
    description?: string;
  }) => void;

  hideLoading: () => void;
};

export const useGlobalLoadingStore = create<GlobalLoadingState>((set) => ({
  isOpen: false,
  title: "Chờ một xíu nhaaa...",
  description: "Hệ thống đang xử lý yêu cầu của bạn.",

  showLoading: (payload) => {
    set({
      isOpen: true,
      title: payload?.title ?? "Chờ một xíu nhaaa...",
      description:
        payload?.description ?? "Hệ thống đang xử lý yêu cầu của bạn.",
    });
  },

  hideLoading: () => {
    set({
      isOpen: false,
    });
  },
}));