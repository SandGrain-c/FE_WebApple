import ResetPasswordPageClient from "@/components/auth/ResetPasswordPageClient";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const tokenParam = (await searchParams).token;
  const token = typeof tokenParam === "string" ? tokenParam : null;

  return <ResetPasswordPageClient token={token} />;
}
