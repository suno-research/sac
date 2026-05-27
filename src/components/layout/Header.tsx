import { Bell, User } from "lucide-react";
import { countPendentesConcessao, countPendentesRemocao } from "@/lib/mock-data";

const pendencias = countPendentesConcessao() + countPendentesRemocao();

export function Header() {
  return (
    <header className="fixed top-0 left-60 right-0 z-20 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div />
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-md hover:bg-slate-100">
          <Bell className="h-4 w-4" />
          {pendencias > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D42126] text-[10px] font-bold text-white">
              {pendencias}
            </span>
          )}
        </button>

        {/* Usuário logado */}
        <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D42126]">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-medium text-slate-900">Daniel Lopes</span>
            <span className="text-xs text-slate-400">daniel.lopes@suno.com.br</span>
          </div>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#D42126]/10 text-[#D42126]">
            TI
          </span>
        </div>
      </div>
    </header>
  );
}
