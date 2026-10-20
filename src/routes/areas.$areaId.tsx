import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/components/pages/AreaPage";
import { areasConfig } from "@/config/areas";
import {
  getAreaSeoTitle,
  getAreaSeoDescription,
  buildFaqSchema,
  buildLocalBusinessSchema,
} from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/areas/$areaId")({
  loader: ({ params }) => {
    const area = areasConfig.find((item) => item.slug === params.areaId);
    if (!area) throw notFound();
    return area;
  },
  head: ({ loaderData: area }) =>
    area
      ? pageHead(
          {
            title: getAreaSeoTitle(area),
            description: getAreaSeoDescription(area),
            path: `/areas/${area.slug}`,
          },
          [buildLocalBusinessSchema(), buildFaqSchema(area.faqs)],
        )
      : { meta: [{ title: "Page Not Found" }, { name: "robots", content: "noindex, nofollow" }] },
  component: AreaRoute,
});

function AreaRoute() {
  return <Page area={Route.useLoaderData()} />;
}
