import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info, AlertTriangle, ShieldAlert, Copyright, BarChart3 } from "lucide-react";

export interface DisclaimerDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DisclaimerDialog({
  children,
  open,
  onOpenChange,
}: DisclaimerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? (
        <DialogTrigger asChild>{children}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <button
            type="button"
            className="underline underline-offset-4 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            免責事項・データ出典
          </button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="space-y-1.5 shrink-0 text-left">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="text-lg font-bold tracking-tight">
              免責事項・データ出典
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            本アプリの利用に関する規約、データの取り扱い、および免責規定です。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1 text-xs text-muted-foreground leading-relaxed">
          {/* 非公式ファンサイト */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>非公式ファンサイトについて</span>
            </div>
            <p className="text-muted-foreground">
              本サービス（重賞カレンダー）は、個人が開発・運営する非公式のファンサイトです。日本中央競馬会（JRA）およびその他の競馬主催団体、関連機関とは一切関係ありません。
            </p>
          </section>

          {/* データの出典 */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>データの出典</span>
            </div>
            <p className="text-muted-foreground">
              本アプリで掲載しているレース日程、発走予定時刻、出走条件（コース・距離・出走資格・斤量等）のデータは、JRA（日本中央競馬会）公式サイト等で一般公開されている公式情報（カレンダーファイル、重賞一覧、確定出馬表等）を取得・加工して提供しています。
            </p>
          </section>

          {/* 変更の可能性と免責 */}
          <section className="rounded-lg border border-amber-200 dark:border-amber-900/50 p-3.5 space-y-1.5 bg-amber-50/50 dark:bg-amber-950/20 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>開催変更・公式発表確認の推奨と免責事項</span>
            </div>
            <div className="space-y-1.5 text-amber-900/80 dark:text-amber-200/80">
              <p>
                レースの日程、発走時刻、出走馬、斤量等の情報は、天候悪化・自然災害や主催者の都合等により、予告なく変更・中止・延期（代替開催・続行競馬等）となる場合があります。
              </p>
              <p>
                情報の正確性・網羅性には細心の注意を払っておりますが、リアルタイム性や完全性を保証するものではありません。<strong>馬券の購入、現地観戦、遠征等の際は、必ず主催者（JRA等）公式発表の最新情報をご確認ください。</strong>
              </p>
              <p>
                本サービスの利用、または利用できなかったことにより生じたあらゆる直接的・間接的な損害・トラブル（馬券投票結果、交通・宿泊費用等を含むがこれらに限定されません）について、本サービスの開発者および運営者は一切の責任を負いません。
              </p>
            </div>
          </section>

          {/* 権利・商標の帰属 */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Copyright className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>権利・商標の帰属</span>
            </div>
            <p className="text-muted-foreground">
              本サービスに記載されているレース名、競馬場名、主催団体名等の名称、商標およびロゴ等の知的財産権は、日本中央競馬会（JRA）ならびに各権利者に帰属します。
            </p>
          </section>

          {/* アクセス解析ツール（Google Analytics）について */}
          <section className="rounded-lg border p-3.5 space-y-1.5 bg-muted/30 text-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <BarChart3 className="h-4 w-4 text-primary shrink-0" />
              <span>アクセス解析ツール（Google Analytics）について</span>
            </div>
            <div className="space-y-1.5 text-muted-foreground">
              <p>
                本サービスでは、利用状況の把握や機能改善・利便性向上のため、Google社が提供するアクセス解析ツール「Google Analytics（GA4）」を利用しています。
              </p>
              <p>
                Google Analyticsはデータの収集のためにCookie（クッキー）を使用しています。このデータは匿名で収集されており、個人を特定する情報は含まれません。
              </p>
              <p>
                データ収集を希望されない場合は、ブラウザの設定でCookieを無効化するか、Google社が提供する「Google アナリティクス オプトアウト アドオン」をご利用いただくことで拒否することが可能です。詳細についてはGoogle社の「ポリシーと規約」をご確認ください。
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
