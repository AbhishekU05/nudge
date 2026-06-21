import { Container } from "@/components/site/container";
import { SettingsTabs } from "@/components/site/settings-tabs";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        <Container className="py-8 sm:py-10">
          <div className="mb-6">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl">
              Settings
            </h1>
            <p className="mt-3 text-base leading-7 text-zinc-500">
              Manage your account, billing, and integrations.
            </p>
          </div>
          
          <SettingsTabs />
          
          {children}
        </Container>
      </main>
    </div>
  );
}
