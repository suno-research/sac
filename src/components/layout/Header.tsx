import { Bell } from "lucide-react";
import { countPendentesConcessao, countPendentesRemocao } from "@/lib/mock-data";

const pendencias = countPendentesConcessao() + countPendentesRemocao();

export function Header() {
  return (
    <header className="fixed top-0 left-64 right-0 z-20 h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8">
      <div />
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827] transition-colors">
          <Bell className="h-5 w-5" />
          {pendencias > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#D42126]" />
          )}
        </button>
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#E5E7EB]">
          <div className="h-8 w-8 rounded-full bg-[#D42126] flex items-center justify-center text-white text-xs font-bold">
            DL
          </div>
          <div>
            <p className="text-sm font-medium text-[#111827] leading-none">Daniel Lopes</p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5">daniel.lopes@suno.com.br</p>
          </div>
        </div>
      </div>
    </header>
  );
}
