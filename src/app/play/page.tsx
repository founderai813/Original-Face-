import GameFlow from "@/components/GameFlow";

export default function PlayPage() {
  return (
    <main className="min-h-screen px-6 py-12 md:py-20">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-10">
          <div className="inline-block border border-gold-main px-6 py-2 mb-6 tracking-[0.4em] text-gold-main text-sm">
            本 來 面 目
          </div>
          <h1 className="text-2xl md:text-3xl tracking-widest text-gold-light">
            五行自我探索
          </h1>
        </header>

        <GameFlow />

        <footer className="mt-16 text-center text-gold-dark/40 text-xs tracking-widest">
          約 10 分鐘 · 一個人就能玩
        </footer>
      </div>
    </main>
  );
}
