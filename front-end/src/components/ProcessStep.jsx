export default function ProcessStep({ number, icon: Icon, title, description, isLast }) {
  return (
    <div className="relative flex flex-col items-center text-center">
      {/* Icon circle */}
      <div className="relative mb-4">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "#080808",
            border: "1px solid rgba(255,255,255,0.0)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          }}
        >
          <Icon size={22} strokeWidth={1.65} style={{ color: "#ffffff" }} />
        </div>
        {/* Number badge */}
        <span
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.1)",
            color: "#080808",
          }}
        >
          {number}
        </span>
      </div>

      {/* Connector line (desktop) */}
      {!isLast && (
        <div
          className="absolute top-7 hidden lg:block"
          style={{
            left: "calc(50% + 34px)",
            right: "calc(-50% + 34px)",
            height: 1,
            borderTop: "1.5px dashed rgba(0,0,0,0.15)",
          }}
        />
      )}

      <h3 className="mb-1.5 text-sm font-semibold text-[#080808]">{title}</h3>
      <p className="text-xs leading-5" style={{ color: "rgba(0,0,0,0.48)", maxWidth: 130 }}>
        {description}
      </p>
    </div>
  );
}
