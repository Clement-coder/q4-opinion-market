import { Link } from "react-router-dom";
import { TwitterX, Discord, Telegram, Mail, Send } from "./icons";

const socials = [
  { icon: TwitterX, href: "#", label: "Twitter / X"  },
  { icon: Discord,  href: "#", label: "Discord"       },
  { icon: Telegram, href: "#", label: "Telegram"      },
  { icon: Mail,     href: "#", label: "Email"         },
];

const cols = [
  {
    heading: "Platform",
    links: [
      { label: "Markets",       to: "/markets"      },
      { label: "How It Works",  to: "/how-it-works" },
      { label: "Rewards",       to: "/dashboard"    },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us",  to: "/about" },
      { label: "Blog",      to: "/"      },
      { label: "Careers",   to: "/"      },
      { label: "Contact",   to: "/"      },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center",      to: "/"     },
      { label: "FAQ",              to: "/faq"  },
      { label: "Terms of Service", to: "/"     },
      { label: "Privacy Policy",   to: "/"     },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#080808",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand column — takes 2/5 on large */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="text-xl font-bold text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Q4
            </Link>
            <p
              className="mt-3 text-sm leading-6"
              style={{ color: "rgba(255,255,255,0.4)", maxWidth: 240 }}
            >
              Short-term prediction markets.
              <br />
              Resolved by real-world data.
            </p>

            {/* Social icons */}
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map(({ heading, links }) => (
            <div key={heading}>
              <h4
                className="mb-4 mono-label text-xs font-semibold"
                style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: "0.14em" }}
              >
                {heading}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-sm transition-colors"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div
          className="mt-10 rounded-2xl p-6 sm:p-7"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Stay Updated</p>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                Get the latest markets and updates delivered to your inbox.
              </p>
            </div>
            <form
              className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-xs"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="input-field flex-1"
                style={{ padding: "10px 14px" }}
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition"
                style={{
                  background: "#ffffff",
                  color: "#080808",
                  border: "none",
                }}
                aria-label="Subscribe"
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f0f0f0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
              >
                <Send size={14} strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs sm:flex-row"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          <span>© 2026 Q4 Opinion Market. All rights reserved.</span>
          <span>Predict. Wait. Resolve.</span>
        </div>
      </div>
    </footer>
  );
}
