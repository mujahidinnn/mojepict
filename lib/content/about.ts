import { TOOLS } from "@/lib/tools";

export interface AboutSection {
  heading: string;
  body: string;
}

export interface AboutContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: AboutSection[];
}

export const aboutContent: Record<"en" | "id", AboutContent> = {
  en: {
    eyebrow: "About",
    title: "Tools that respect your files and your time.",
    intro:
      `Mojepict is a growing collection of ${TOOLS.length}+ free web tools for images, PDFs, units, colors, text, and everyday developer tasks. No installs, no accounts, just open a tool and start.`,
    sections: [
      {
        heading: "Why it exists",
        body: "Most quick tasks (resizing a photo, converting a unit, formatting some JSON) shouldn't require signing up for a service or waiting on an upload. Mojepict was built to be the fast, no-friction option: pick a tool, do the task, move on.",
      },
      {
        heading: "Runs in your browser",
        body: "The large majority of tools process files entirely on your device using your browser's own capabilities. Nothing is uploaded to a server for those, so your files never leave your machine.",
      },
      {
        heading: "A couple of tools go further, by choice",
        body: "Background Removal and the AI-enhanced mode of Image Compressor call a cloud service to get sharper results than a browser alone can produce. That path is opt-in: you choose it explicitly, and it's used only for the file you submit at that moment. See the Privacy Policy for details.",
      },
      {
        heading: "Free, without the catch",
        body: "No sign-up, no paywalled features, no ads. Mojepict is a solo, independently run project. If a tool has been useful to you, the Support link in the sidebar goes a long way.",
      },
    ],
  },
  id: {
    eyebrow: "Tentang",
    title: "Alat yang menghargai file dan waktumu.",
    intro:
      `Mojepict adalah kumpulan ${TOOLS.length}+ alat web gratis yang terus bertambah, untuk gambar, PDF, satuan, warna, teks, hingga kebutuhan developer sehari-hari. Tanpa instal, tanpa akun, buka alatnya, langsung pakai.`,
    sections: [
      {
        heading: "Kenapa dibuat",
        body: "Kebanyakan tugas cepat (mengubah ukuran foto, konversi satuan, merapikan JSON) seharusnya tidak perlu daftar akun atau menunggu proses upload. Mojepict dibuat jadi pilihan yang cepat dan tanpa hambatan: pilih alatnya, selesaikan tugasnya, lanjut kerja.",
      },
      {
        heading: "Jalan di browser kamu",
        body: "Sebagian besar alat memproses file sepenuhnya di perangkatmu, memakai kemampuan browser itu sendiri. Tidak ada yang diunggah ke server untuk alat-alat ini, jadi filemu tidak pernah meninggalkan perangkatmu.",
      },
      {
        heading: "Beberapa alat sengaja melangkah lebih jauh",
        body: "Remove Background dan mode AI-enhanced pada Image Compressor memanggil layanan cloud agar hasilnya lebih tajam dibanding kemampuan browser saja. Jalur ini bersifat opsional: kamu yang memilihnya secara sadar, dan hanya file yang kamu kirim saat itu yang diproses. Lihat Kebijakan Privasi untuk detailnya.",
      },
      {
        heading: "Gratis, tanpa jebakan",
        body: "Tanpa pendaftaran, tanpa fitur berbayar, tanpa iklan. Mojepict dikelola sendirian secara independen. Kalau salah satu alatnya pernah membantumu, tautan Dukung di sidebar sangat berarti.",
      },
    ],
  },
};
