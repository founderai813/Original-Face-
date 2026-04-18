import Link from "next/link";
import BaziForm from "@/components/BaziForm";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <div className="inline-block border border-gold-main px-6 py-2 mb-8 tracking-[0.4em] text-gold-main text-sm">
            本 來 面 目
          </div>
          <h1 className="text-3xl md:text-4xl tracking-widest text-gold-light mb-4">
            用五行認識自己
          </h1>
          <p className="text-gold-main/70 tracking-wider leading-relaxed">
            今天抽到的牌，不是巧合。
            <br />
            你的命盤早就寫好了——只是你還沒看過。
          </p>
        </header>

        {/* 線上體驗入口 */}
        <section className="mb-12 border border-gold-main/40 p-8 text-center space-y-4">
          <h2 className="text-xl tracking-widest text-gold-light">
            線上五行探索
          </h2>
          <p className="text-gold-main/70 text-sm leading-relaxed">
            抽牌、回答情境問題、對照你的命盤。
            <br />
            一個人就能玩，約 10 分鐘。
          </p>
          <Link href="/play" className="btn-gold inline-block">
            開始探索
          </Link>
        </section>

        {/* 直接輸入八字（實體工作坊掃碼入口） */}
        <section className="mb-12 border-t border-gold-dark/30 pt-8 text-center">
          <p className="text-gold-main/60 tracking-widest text-xs mb-6">
            已經玩過實體桌遊？直接輸入八字
          </p>
        </section>

        <BaziForm />

        <footer className="mt-20 text-center text-gold-dark/60 text-xs tracking-widest">
          &copy; 本來面目｜五行自我探索遊戲
        </footer>
      </div>
    </main>
  );
}
