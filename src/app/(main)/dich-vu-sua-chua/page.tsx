import type { Metadata } from "next";

import ServiceInformationPage from "@/components/information/ServiceInformationPage";
import { SERVICE_PAGES } from "@/config/service-pages";
import { SITE_CONFIG } from "@/config/site";

const content = SERVICE_PAGES.repair;

export const metadata: Metadata = {
  title: `${content.title} | ${SITE_CONFIG.name}`,
  description: content.metadataDescription,
};

export default function RepairServicePage() {
  return <ServiceInformationPage content={content} />;
}
