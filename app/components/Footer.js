import Link from 'next/link';

export default function Footer() {
  return (
    <>
      <div className="join-banner">
        <div className="container">
          <h2>Join GameStudy</h2>
          <p>あなたの知見やアイデアを共有しよう</p>
          <Link href="#" className="join-button">今すぐはじめる</Link>
        </div>
      </div>
      <footer className="main-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <h4>GameStudy</h4>
              <p>エンジニアのための情報共有コミュニティ</p>
            </div>
            <div className="footer-column">
              <h5>About</h5>
              <ul>
                <li><Link href="#">GameStudyについて</Link></li>
                <li><Link href="#">運営会社</Link></li>
                <li><Link href="#">お知らせ・リリース</Link></li>
                <li><Link href="#">イベント</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>Guides</h5>
              <ul>
                <li><Link href="#">使い方</Link></li>
                <li><Link href="#">法人向けメニュー</Link></li>
                <li><Link href="#">Publication / Pro</Link></li>
                <li><Link href="#">よくある質問</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>Links</h5>
              <ul>
                <li><Link href="#">X (Twitter)</Link></li>
                <li><Link href="#">GitHub</Link></li>
                <li><Link href="#">メディアキット</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h5>Legal</h5>
              <ul>
                <li><Link href="#">利用規約</Link></li>
                <li><Link href="#">プライバシーポリシー</Link></li>
                <li><Link href="#">特商法表記</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} GameStudy Inc.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
