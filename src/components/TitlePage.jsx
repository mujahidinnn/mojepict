import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";

const TitlePage = ({ title, subtitle, backUrl }) => {
  return (
    <div className="flex items-center gap-3 mb-6">
      {backUrl && (
        <Link href={backUrl}>
          <ChevronLeftIcon size={32} className="text-indigo-700" />
        </Link>
      )}
      <h3 className="text-3xl font-bold text-indigo-700">{title}</h3>
    </div>
  );
};

export default TitlePage;
