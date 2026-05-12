"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MainPage } from "@/components/pages/MainPage";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-[1600px] mx-auto">
        <MainPage />
      </main>
      <Footer />
    </div>
  );
}
