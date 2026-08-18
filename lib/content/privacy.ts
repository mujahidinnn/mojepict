export interface PrivacySection {
  heading: string;
  body: string;
}

export interface PrivacyContent {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: PrivacySection[];
}

export const privacyContent: Record<"en" | "id", PrivacyContent> = {
  en: {
    eyebrow: "Privacy Policy",
    title: "Your files are yours. We try hard to keep it that way.",
    updated: "Last updated: August 2026",
    intro:
      "This page explains, plainly, what happens to your data when you use Mojepict. There are no accounts, no trackers, and no ad networks on this site, so what follows is the complete picture.",
    sections: [
      {
        heading: "Local-first, by default",
        body: "Most tools (image resizing, cropping, format conversion, PDF merging, unit and color conversion, text and dev utilities, and more) run entirely in your browser using JavaScript. The file you open never leaves your device: there is no upload, and Mojepict's servers never see it.",
      },
      {
        heading: "Optional AI-enhanced processing",
        body: "Two tools offer an opt-in \"AI Enhanced\" mode: Remove Background and Image Compressor. When you explicitly choose that mode, the image you submit is sent from your browser to a Mojepict server route, which forwards it to a third-party processing service (remove.bg for background removal, Tinify/TinyPNG for AI compression) to perform the operation, then returns the result to you. The file is used only to fulfill that single request; Mojepict does not store a copy of it. The default \"Local\" mode on both tools keeps everything on-device, as described above.",
      },
      {
        heading: "What's stored on your device",
        body: "Mojepict uses your browser's local storage for a few small conveniences: your recently-used tools list, saved color palettes (if you use the palette tools), and your theme and language preference. This data stays on your device, it's never sent to us, and you can clear it anytime via your browser settings.",
      },
      {
        heading: "No accounts, no tracking",
        body: "There's no sign-up, no login, and no analytics or advertising trackers on this site. We don't build a profile of you or your usage across sessions.",
      },
      {
        heading: "Third-party services",
        body: "Aside from the two opt-in AI features above, this site is hosted on standard web infrastructure that, like any website, may log basic technical request data (such as IP address and timestamp) for security and reliability purposes. That's operational logging, not usage tracking, and it isn't tied to any file content.",
      },
      {
        heading: "Changes to this policy",
        body: "If this policy changes in a meaningful way, the \"Last updated\" date above will reflect it. Continuing to use Mojepict after a change means you accept the updated policy.",
      },
      {
        heading: "Questions",
        body: "If you have a question about how a specific tool handles your data, the answer is almost always on this page. Check whether the tool offers a Local/AI mode toggle; Local always means on-device only.",
      },
    ],
  },
  id: {
    eyebrow: "Kebijakan Privasi",
    title: "Filemu tetap milikmu. Kami berusaha keras menjaganya begitu.",
    updated: "Terakhir diperbarui: Agustus 2026",
    intro:
      "Halaman ini menjelaskan secara terus terang apa yang terjadi pada datamu saat memakai Mojepict. Tidak ada akun, tidak ada pelacak, dan tidak ada jaringan iklan di situs ini, jadi berikut gambaran lengkapnya.",
    sections: [
      {
        heading: "Local-first, secara default",
        body: "Sebagian besar alat (ubah ukuran gambar, crop, konversi format, gabung PDF, konversi satuan dan warna, utilitas teks dan developer, dan lainnya) berjalan sepenuhnya di browser memakai JavaScript. File yang kamu buka tidak pernah meninggalkan perangkatmu: tidak ada upload, dan server Mojepict tidak pernah melihatnya.",
      },
      {
        heading: "Pemrosesan AI-enhanced (opsional)",
        body: "Dua alat menawarkan mode \"AI Enhanced\" yang opsional: Remove Background dan Image Compressor. Saat kamu secara sengaja memilih mode itu, gambar yang kamu kirim diteruskan dari browser ke rute server Mojepict, lalu diteruskan lagi ke layanan pemroses pihak ketiga (remove.bg untuk hapus background, Tinify/TinyPNG untuk kompresi AI) guna melakukan prosesnya, kemudian hasilnya dikembalikan ke kamu. File hanya dipakai untuk memenuhi permintaan itu saja; Mojepict tidak menyimpan salinannya. Mode \"Local\" (default) pada kedua alat ini tetap memproses semuanya di perangkatmu, seperti dijelaskan di atas.",
      },
      {
        heading: "Apa yang tersimpan di perangkatmu",
        body: "Mojepict memakai local storage browser untuk beberapa kenyamanan kecil: daftar alat yang baru dipakai, palet warna tersimpan (jika kamu memakai alat palet), serta preferensi tema dan bahasa. Data ini tetap di perangkatmu, tidak pernah dikirim ke kami, dan bisa kamu hapus kapan saja lewat pengaturan browser.",
      },
      {
        heading: "Tanpa akun, tanpa pelacakan",
        body: "Tidak ada pendaftaran, tidak ada login, dan tidak ada pelacak analitik atau iklan di situs ini. Kami tidak membangun profil dirimu atau riwayat penggunaanmu lintas sesi.",
      },
      {
        heading: "Layanan pihak ketiga",
        body: "Selain dua fitur AI opsional di atas, situs ini dihosting di infrastruktur web standar yang, seperti situs pada umumnya, mungkin mencatat data teknis dasar permintaan (seperti alamat IP dan waktu akses) untuk keperluan keamanan dan keandalan. Ini adalah log operasional, bukan pelacakan penggunaan, dan tidak terkait dengan isi file apa pun.",
      },
      {
        heading: "Perubahan kebijakan ini",
        body: "Jika kebijakan ini berubah secara berarti, tanggal \"Terakhir diperbarui\" di atas akan mencerminkannya. Terus memakai Mojepict setelah ada perubahan berarti kamu menerima kebijakan yang diperbarui.",
      },
      {
        heading: "Pertanyaan",
        body: "Kalau kamu punya pertanyaan tentang bagaimana suatu alat menangani datamu, jawabannya hampir selalu ada di halaman ini. Cek apakah alat tersebut punya toggle mode Local/AI; Local selalu berarti hanya diproses di perangkatmu.",
      },
    ],
  },
};
