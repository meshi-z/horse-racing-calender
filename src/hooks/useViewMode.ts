import { useRaceStore, getInitialViewMode, VIEW_MODE_STORAGE_KEY } from "@/store/useRaceStore";

export { getInitialViewMode, VIEW_MODE_STORAGE_KEY };
export type ViewMode = "timeline" | "calendar";

/**
 * ビューモードの取得および切り替え用カスタムフック
 */
export function useViewMode() {
  const viewMode = useRaceStore((state) => state.viewMode);
  const setViewMode = useRaceStore((state) => state.setViewMode);

  return {
    viewMode,
    setViewMode,
  };
}
