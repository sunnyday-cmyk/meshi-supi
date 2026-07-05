export default function HomeIntro() {
  return (
    <section
      aria-labelledby="home-intro-heading"
      className="mb-6 rounded-xl4 border border-white/10 bg-white/5 p-4 text-slate-200"
    >
      <h2 id="home-intro-heading" className="text-lg font-extrabold text-yellow">
        MeshiSpin（メシスピン）とは
      </h2>
      <p className="mt-2 text-sm font-bold text-teal">みんなで楽しく、今夜の一軒を決めよう</p>
      <p className="mt-3 text-sm leading-relaxed">
        MeshiSpinは、友達や同僚と「どこで食べる？」を迷わず決めるためのWebアプリです。現在地の近くのお店を自動で探し、グループ投票やルーレットで楽しく店を決められます。飲み会・ランチ・合コンなど、少人数から大人数まで手軽に使えます。
      </p>
      <h3 className="mt-4 text-sm font-extrabold text-orange">主な機能</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        <li>ジャンル・予算・移動時間などの条件で、近くのレストランを自動検索</li>
        <li>QRコードでメンバーを招待し、リアルタイム投票で全員の希望を反映</li>
        <li>票が割れたときはルーレットで公平に決定</li>
        <li>スマートフォンのブラウザだけで利用可能（アプリのインストール不要）</li>
      </ul>
    </section>
  );
}
