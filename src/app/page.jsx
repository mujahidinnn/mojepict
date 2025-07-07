import Link from "next/link";

const tools = [
  {
    title: "Compress Image",
    description: "Perkecil ukuran gambar tanpa mengurangi kualitas.",
    href: "/compress",
  },
  {
    title: "Convert Format",
    description: "Ubah format gambar (JPG, PNG, WebP, dll).",
    href: "/convert",
  },
  {
    title: "Resize",
    description: "Ubah dimensi gambar sesuai kebutuhan.",
    href: "/resize",
  },
  {
    title: "Crop",
    description: "Potong gambar sesuai area yang diinginkan.",
    href: "/crop",
  },
  {
    title: "Metadata viewer",
    description: "Lihat data EXIF seperti kamera, lokasi, dll dari gambar.",
    href: "/metadata",
  },
  // Tambahkan lebih banyak tools jika perlu
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-center text-indigo-700 mb-12">
        Selamat Datang di Mojepict 🎨
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="block p-6 bg-white shadow-sm hover:shadow-md rounded-xl transition"
          >
            <h2 className="text-xl font-semibold text-indigo-700 mb-2">
              {tool.title}
            </h2>
            <p className="text-gray-600">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
