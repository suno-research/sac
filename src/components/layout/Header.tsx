import { Badge } from "@/components/ui/badge";
import { Bell, User } from "lucide-react";
import { countPendentesConcessao, countPendentesRemocao } from "@/lib/mock-data";

const pendencias = countPendentesConcessao() + countPendentesRemocao();

export function Header() {
  return (
    <header className="fixed top-0 left-60 right-0 z-20 h-14 border-b border-[#DDDDDD] bg-white flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100">
          <Bell className="h-4 w-4" />
          {pendencias > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D42126] text-[10px] font-bold text-white">
              {pendencias}
            </span>
          )}
        </button>

        {/* Usuário logado */}
        <div className="flex items-center gap-2.5 border-l border-[#DDDDDD] pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D42126]/10">
            <User className="h-4 w-4 text-[#D42126]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-medium text-gray-900">Daniel Lopes</span>
            <span className="text-xs text-gray-400">daniel.lopes@suno.com.br</span>
          </div>
          <Badge variant="ti" className="ml-1">TI</Badge>
        </div>
      </div>
    </header>
  );
}
