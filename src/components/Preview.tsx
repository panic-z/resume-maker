import "../templates/classic.css";
import "../templates/modern.css";
import type { TemplateName } from "../lib/storage";

interface PreviewProps {
  html: string;
  template: TemplateName;
}

export function Preview({ html, template }: PreviewProps) {
  return (
    <div className="h-full overflow-auto bg-gray-100 p-8 flex justify-center">
      <div
        className={`template-${template} bg-white shadow-lg w-[210mm] min-h-[297mm] p-[20mm] text-sm leading-relaxed`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
