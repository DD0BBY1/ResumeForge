import "./globals.css";

export const metadata = {
  title: "ResumeForge — AI Career Toolkit",
  description: "Land 3x more interviews. AI-optimized resumes, cover letters, and LinkedIn rewrites.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
