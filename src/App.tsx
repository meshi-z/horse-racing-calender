import { Layout } from "@/components/shared/Layout";
import { FilterBar } from "@/components/shared/FilterBar";
import { RaceCard } from "@/components/shared/RaceCard";
import { useRaces } from "@/hooks/useRaces";
import { useRaceStore, selectFilteredRaces } from "@/store/useRaceStore";

export function App() {
  const { isLoading, error } = useRaces();
  const filteredRaces = useRaceStore(selectFilteredRaces);
  const viewMode = useRaceStore((state) => state.viewMode);

  return (
    <Layout>
      <div className="space-y-6">
        {/* フィルターバー */}
        <FilterBar />

        {/* 状態表示 */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            レース日程を読み込み中...
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
            レースデータの取得に失敗しました: {error.message}
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>該当レース: {filteredRaces.length} 件</span>
              <span className="capitalize">表示モード: {viewMode}</span>
            </div>

            {filteredRaces.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
                <p className="text-sm font-medium">条件に合致するレースが見つかりませんでした。</p>
                <p className="text-xs mt-1">検索条件を変更するか、リセットをお試しください。</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRaces.map((race) => (
                  <RaceCard key={race.id} race={race} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default App;
