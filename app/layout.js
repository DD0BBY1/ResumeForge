import "./globals.css";

export const metadata = {
  title: "ResumeForge — Land your next job 3x faster | AI Resume Optimizer",
  description: "AI-optimized resumes, tailored cover letters, and LinkedIn rewrites that get past the bots. Try free, no credit card required.",
  keywords: ["resume builder", "AI resume", "ATS resume", "cover letter generator", "LinkedIn optimizer", "job application"],
  authors: [{ name: "ResumeForge" }],
  openGraph: {
    title: "ResumeForge — Land your next job 3x faster",
    description: "AI-optimized resumes, tailored cover letters, and LinkedIn rewrites. Try free, no credit card required.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeForge — Land your next job 3x faster",
    description: "AI-optimized resumes, cover letters & LinkedIn rewrites.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
