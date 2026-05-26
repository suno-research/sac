import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-6xl font-bold text-[#D42126]">404</p>
      <h1 className="text-xl font-semibold text-gray-800">Página não encontrada</h1>
      <p className="text-sm text-gray-400">O recurso que você procura não existe.</p>
      <Link href="/dashboard"><Button>Voltar ao dashboard</Button></Link>
    </div>
  );
}
