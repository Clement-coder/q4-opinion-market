export default function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="feature-card p-6">
      <div
        className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: "rgba(0,0,0,0.04)",
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Icon size={19} strokeWidth={1.75} style={{ color: "#080808" }} />
      </div>
      <h3 className="mb-2 text-sm font-semibold text-[#080808]">{title}</h3>
      <p className="text-sm leading-6" style={{ color: "rgba(0,0,0,0.5)" }}>
        {text}
      </p>
    </div>
  );
}
