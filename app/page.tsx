import dynamic from "next/dynamic";
import MarketingHomeSkeleton from "@/components/landing/MarketingHomeSkeleton";

const MarketingHome = dynamic(() => import("@/components/landing/MarketingHome"), {
  loading: () => <MarketingHomeSkeleton />,
});

export default function HomePage() {
  return <MarketingHome />;
}
