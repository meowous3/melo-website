const GITHUB_URL = "https://github.com/meowous3/melo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__links">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href={`${GITHUB_URL}/releases`} target="_blank" rel="noopener noreferrer">Releases</a>
          <a href={`${GITHUB_URL}/issues`} target="_blank" rel="noopener noreferrer">Issues</a>
        </div>
        <p className="footer__credit">© 2026 melo</p>
      </div>
    </footer>
  );
}
