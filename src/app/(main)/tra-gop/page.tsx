import type { Metadata } from "next";

import ServiceInformationPage from "@/components/information/ServiceInformationPage";
import { SERVICE_PAGES } from "@/config/service-pages";

const content = SERVICE_PAGES.installment;

export const metadata: Metadata = {
  title: `${content.title} | Đức Bách Hoá`,
  description: content.metadataDescription,
};

export default function InstallmentPage() {
  return <ServiceInformationPage content={content} />;
}
