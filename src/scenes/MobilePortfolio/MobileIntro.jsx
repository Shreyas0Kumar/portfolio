import React, { useState } from "react";
import "./MobileIntro.css";

/**
 * MobileIntro
 * Handoff screen for phone/tablet visitors: the real portfolio is an interactive
 * desktop experience, so nudge them to open it on a laptop — while offering a
 * one-tap "copy link" and a clear way to continue to the lightweight version.
 *
 * Shown by default on mobile (see MobilePortfolio). Kept as its own component so
 * the planned PDF-style portfolio can be wired in as the "continue" target later.
 *
 * Props:
 *   onContinue {function} — proceed to the scrollable mobile portfolio
 */
const SITE_URL = "portfolio.shreyas.space";

export default function MobileIntro({ onContinue }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://${SITE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL is shown below as a fallback */
    }
  };

  return (
    <div className="mintro">
      <div className="mintro-inner">
        <span className="mintro-glyph" aria-hidden="true">
          🖥️
        </span>

        <p className="mintro-lead">this portfolio is an</p>
        <h1 className="mintro-title">interactive desktop</h1>
        <p className="mintro-body">
          It opens into a little macOS-style world you can click around in, best
          explored on a laptop or computer.
        </p>

        <div className="mintro-url">{SITE_URL}</div>

        <div className="mintro-actions">
          <button type="button" className="mintro-copy" onClick={copyLink}>
            {copied ? "link copied ✓" : "copy link for desktop"}
          </button>
          <button
            type="button"
            className="mintro-continue"
            onClick={onContinue}
          >
            continue here →
          </button>
        </div>

        <p className="mintro-note">
          a quick, scrollable version works fine on mobile too.
        </p>
      </div>
    </div>
  );
}
