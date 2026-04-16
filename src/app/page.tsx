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

        <section className="mb-12 border-t border-b border-gold-dark/30 py-8 text-center">
          <p className="text-gold-main/80 tracking-widest text-sm leading-relaxed">
            輸入你的生辰八字，
            <br className="md:hidden" />
            獲得免費五行基礎報告。
          </p>
        </section>

        <BaziForm />

        <footer className="mt-20 text-center text-gold-dark/60 text-xs tracking-widest">
          © 本來面目｜五行自我探索遊戲
        </footer>
      </div>
    </main>
  );
}
