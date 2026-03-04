import { assets } from "@/data/sample-data";
import { ocpsAssets } from "@/data/ocps-data";
import AssetDetailClient from "./client";

export function generateStaticParams() {
  const allIds = [
    ...assets.map((a) => a.id),
    ...ocpsAssets.map((a) => a.id),
  ];
  return allIds.map((id) => ({ id }));
}

export default function AssetDetailPage() {
  return <AssetDetailClient />;
}
