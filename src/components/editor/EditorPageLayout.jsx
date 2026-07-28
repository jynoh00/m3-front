import UserHeader from "../UserHeader";

export default function EditorPageLayout({
  pageClassName,
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <div className={pageClassName}>
      <UserHeader back />
      <main className="create-main">
        <section className="create-section">
          <div className="create-heading">
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <span className="create-step">STORY · MUSIC</span>
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}
