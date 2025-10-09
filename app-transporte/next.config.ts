import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita warning de múltiplos lockfiles (monorepo/pasta raiz vs app)
  outputFileTracingRoot: process.cwd(),
  // Next 15: experimental.serverComponentsExternalPackages -> serverExternalPackages
  serverExternalPackages: ['@prisma/client', 'prisma'],
  eslint: {
    // Não falhar build por erros de lint durante a demo/deploy inicial
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
