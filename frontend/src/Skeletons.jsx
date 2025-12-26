export function QuestionSkeleton() {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.7)",
        border: "1px solid #334155",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        animation: "pulse 2s infinite",
      }}
    >
      <div
        style={{
          height: 24,
          background: "rgba(148, 163, 184, 0.2)",
          borderRadius: 6,
          marginBottom: 12,
          width: "70%",
        }}
      />
      <div
        style={{
          height: 16,
          background: "rgba(148, 163, 184, 0.2)",
          borderRadius: 6,
          marginBottom: 16,
          width: "40%",
        }}
      />
      <div
        style={{
          height: 40,
          background: "rgba(148, 163, 184, 0.2)",
          borderRadius: 6,
          width: "100%",
        }}
      />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div
      style={{
        background: "rgba(30, 27, 75, 0.5)",
        border: "1px solid #4f46e5",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          height: 32,
          background: "rgba(148, 163, 184, 0.2)",
          borderRadius: 6,
          marginBottom: 20,
          width: "30%",
          animation: "pulse 2s infinite",
        }}
      />
      {[1, 2, 3].map((i) => (
        <QuestionSkeleton key={i} />
      ))}
    </div>
  );
}

// Add animation to global styles
const style = document.createElement("style");
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
document.head.appendChild(style);
