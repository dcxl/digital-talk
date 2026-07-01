import { ImagePlus, Link2, Upload } from "lucide-react";
import type { AvatarAssetItem } from "../types";

interface AvatarAssetsPanelProps {
  assets: AvatarAssetItem[];
  isBusy: boolean;
  onBind: (asset: AvatarAssetItem) => void;
  onUpload: (file: File) => void;
  selectedAssetUrl?: string;
}

function getAssetUrl(asset: AvatarAssetItem) {
  return asset.publicUrl || `/api/avatar-assets/${asset.id}/content`;
}

function formatSize(size: number) {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AvatarAssetsPanel({
  assets,
  isBusy,
  onBind,
  onUpload,
  selectedAssetUrl,
}: AvatarAssetsPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Avatar Assets</h3>
          <p className="mt-1 text-xs text-slate-500">
            上传并绑定静态数字人形象
          </p>
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-slate-950 px-3 text-sm text-white">
          <Upload size={15} />
          Upload
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={isBusy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onUpload(file);
            }}
            type="file"
          />
        </label>
      </div>

      <div className="grid max-h-[360px] gap-3 overflow-y-auto p-4 sm:grid-cols-2">
        {assets.map((asset) => {
          const assetUrl = getAssetUrl(asset);
          const selected = selectedAssetUrl === assetUrl;

          return (
            <article
              className={`rounded-lg border p-3 ${
                selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200"
              }`}
              key={asset.id}
            >
              <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
                {asset.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={asset.name}
                    className="size-full object-cover"
                    src={assetUrl}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-slate-400">
                    <ImagePlus size={32} />
                  </div>
                )}
              </div>
              <div className="mt-3">
                <p className="truncate text-sm font-medium text-slate-950">
                  {asset.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {asset.source} · {formatSize(asset.size)}
                </p>
              </div>
              <button
                className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 disabled:opacity-60"
                disabled={isBusy}
                onClick={() => onBind(asset)}
                type="button"
              >
                <Link2 size={14} />
                {selected ? "已绑定" : "绑定"}
              </button>
            </article>
          );
        })}

        {assets.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            暂无 Avatar Asset
          </div>
        ) : null}
      </div>
    </section>
  );
}
