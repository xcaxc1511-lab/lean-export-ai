import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/components/pages/ServiceTemplate";
import { servicesConfig } from "@/config/services";
import {
  getServiceSeoTitle,
  getServiceSeoDescription,
  buildFaqSchema,
  buildServiceSchema,
} from "@/config/seo";
import { pageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/services/$serviceId")({
  loader: ({ params }) => {
    const service = servicesConfig.find((item) => item.slug === params.serviceId);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData: service }) =>
    service
      ? pageHead(
          {
            title: getServiceSeoTitle(service),
            description: getServiceSeoDescription(service),
            path: `/services/${service.slug}`,
          },
          [buildServiceSchema(service.slug), buildFaqSchema(service.faqs)],
        )
      : { meta: [{ title: "Page Not Found" }, { name: "robots", content: "noindex, nofollow" }] },
  component: ServiceRoute,
});

function ServiceRoute() {
  return <Page service={Route.useLoaderData()} />;
}
