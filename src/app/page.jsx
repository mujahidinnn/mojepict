import Image from "next/image";
import Link from "next/link";
import MojepictLogo from "@/assets/mojepict-logo.png";

const tools = [
  {
    title: "Compress Image",
    description:
      "Kompres ukuran file gambar tanpa mengurangi kualitas secara signifikan.",
    href: "/compress",
  },
  {
    title: "Convert Format",
    description:
      "Ubah format gambar ke JPG, PNG, WebP, atau lainnya dengan mudah.",
    href: "/convert",
  },
  {
    title: "Resize",
    description:
      "Ubah dimensi gambar sesuai kebutuhan tanpa mengorbankan proporsi.",
    href: "/resize",
  },
  {
    title: "Crop Image",
    description:
      "Potong bagian gambar sesuai area yang diinginkan secara presisi.",
    href: "/crop",
  },
  {
    title: "Metadata Viewer",
    description:
      "Lihat informasi EXIF gambar seperti jenis kamera, lokasi, dan detail teknis lainnya.",
    href: "/metadata",
  },
  {
    title: "Draw on Image",
    description:
      "Tambahkan coretan, teks, atau gambar bebas langsung di atas gambar.",
    href: "/draw",
  },
  {
    title: "Watermark",
    description:
      "Tambahkan watermark berupa teks atau logo untuk melindungi dan mem-branding gambar.",
    href: "/watermark",
  },
  {
    title: "Twibbon",
    description:
      "Tambahkan foto ke dalam twibbon transparan dengan posisi dan ukuran yang bisa diatur.",
    href: "/twibbon",
  },
  {
    title: "Color Picker from Image",
    description:
      "Klik pada gambar untuk mengambil kode warna HEX, RGB, atau HSL.",
    href: "/color-picker",
  },
  {
    title: "QR Generator",
    description:
      "Buat QR Code dari teks, link, atau gambar dengan opsi warna, latar, ukuran, dan logo.",
    href: "/qr-generator",
  },

  // Tambahkan lebih banyak tools jika perlu
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Image
        src={MojepictLogo}
        alt="Mojapict Logo"
        priority
        className="h-40 w-max m-auto"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-5">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href}
            className="block p-6 bg-white shadow-sm hover:shadow-md rounded-xl transition"
          >
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {tool.title}
            </h2>
            <p className="text-gray-600">{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
