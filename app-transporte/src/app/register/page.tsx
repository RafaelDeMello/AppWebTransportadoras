"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!email.includes("@")) throw new Error("Email inválido");
      if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
      if (!nome || nome.length < 3) throw new Error("Nome obrigatório");
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        const msg = signUpError.message?.toLowerCase?.() || "";
        if (msg.includes("already registered") || msg.includes("já registrado")) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) throw new Error(`Erro ao autenticar: ${signInError.message}`);
        } else {
          throw new Error(`Erro ao criar conta: ${signUpError.message}`);
        }
      }
      await fetch("/api/auth/sync", { method: "POST" });
      const apiRes = await fetch("/api/auth/register-admin-transportadora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome, tipo: "TRANSPORTADORA" }),
      });
      if (!apiRes.ok) {
        const j = await apiRes.json().catch(() => ({}));
        throw new Error(j.error || "Erro ao registrar");
      }
      setSuccess(true);
      setError("");
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro no cadastro";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Registro Concluído!</h2>
            <p className="text-gray-600">Redirecionando para o dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Registro de Transportadora</CardTitle>
          <CardDescription className="text-center">
            Preencha os dados para criar sua conta de transportadora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Transportadora</Label>
              <Input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome da sua transportadora" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Já tem conta?{' '}
              <a href="/login" className="text-blue-600 hover:underline">Fazer login</a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
