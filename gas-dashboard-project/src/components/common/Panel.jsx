export default function Panel({ title, children, className = '', action = null }) {
  return (
    <section className={`panel ${className}`.trim()}>
      {(title || action) && (
        <div className="panel-header">
          {title ? <h3 className="panel-title">{title}</h3> : <span />}
          {action}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
