import React from "react";

const RED = "#C8102E";

const toMinutes = (s) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(s || "");
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
};

const buttonBase = {
  font: "inherit",
  fontSize: 14,
  fontWeight: 600,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: 4,
  cursor: "pointer",
};

export default function AttendanceCard({
  todayPresent = [],
  absentToday = [],
  onOpenPresent,
  onOpenAbsent,
}) {
  const total = todayPresent.length + absentToday.length;
  const latest = [...todayPresent]
    .sort((a, b) => toMinutes(b.time_in) - toMinutes(a.time_in))
    .slice(0, 3);

  return (
    <section
      aria-label="Volunteer time-in today"
      style={{
        background: "#fff",
        color: "#111",
        border: "1px solid #111",
        borderTop: `4px solid ${RED}`,
        borderRadius: 4,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "16px 20px 12px",
          borderBottom: "1px solid #111",
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: "#555" }}>Today</div>
          <h3 style={{ margin: 0, fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 400 }}>
            Volunteer time-in
          </h3>
        </div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 40, lineHeight: 1 }}>
          {todayPresent.length}
          <span style={{ fontSize: 20, color: "#555" }}> / {total}</span>
        </div>
      </header>

      <div style={{ padding: "10px 20px 4px", fontSize: 13, color: "#555" }}>Latest to time in</div>
      {latest.length === 0 && (
        <div style={{ padding: "8px 20px", fontSize: 15, color: "#555" }}>No one has timed in yet.</div>
      )}
      {latest.map((v) => (
        <div
          key={v.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 20px",
            fontSize: 15,
            borderBottom: "1px solid #ddd",
          }}
        >
          <span>{v.volunteer}</span>
          <span style={{ fontWeight: 600 }}>
            {v.arrival === "late" && <span style={{ color: RED, marginRight: 8 }}>Late</span>}
            {v.time_in}
          </span>
        </div>
      ))}

      {absentToday.length > 0 && (
        <div style={{ padding: "12px 20px", fontSize: 14, color: RED, fontWeight: 600 }}>
          Not in yet: {absentToday.slice(0, 3).map((v) => v.volunteer).join(", ")}
          {absentToday.length > 3 ? ` and ${absentToday.length - 3} more` : ""}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: "0 20px 18px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onOpenPresent}
          style={{ ...buttonBase, background: RED, color: "#fff", border: `1px solid ${RED}` }}
        >
          All timed in
        </button>
        <button
          type="button"
          onClick={onOpenAbsent}
          style={{ ...buttonBase, background: "#fff", color: "#111", border: "1px solid #111" }}
        >
          Not in
        </button>
      </div>
    </section>
  );
}
