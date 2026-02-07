import { Download } from "lucide-react";

interface CsvColumn {
  key: string;
  label: string; // 한국어 컬럼명
}

interface CsvDownloadButtonProps {
  data: Record<string, unknown>[];
  columns: CsvColumn[];
  filename: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * CSV 다운로드 버튼 컴포넌트
 * - 한국어 컬럼명 지원
 * - UTF-8 BOM 포함 (엑셀 호환)
 */
export function CsvDownloadButton({
  data,
  columns,
  filename,
  className = "",
  children,
}: CsvDownloadButtonProps) {
  const downloadCsv = () => {
    if (data.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    try {
      const escape = (v: unknown) => {
        const s = String(v ?? "");
        const escaped = s.replace(/"/g, '""');
        return `"${escaped}"`;
      };

      // 한국어 헤더 행
      const headerRow = columns.map((col) => escape(col.label)).join(",");

      // 데이터 행
      const dataRows = data.map((row) =>
        columns.map((col) => escape(row[col.key])).join(","),
      );

      const lines = [headerRow, ...dataRows];
      const csvContent = `\uFEFF${lines.join("\r\n")}`; // UTF-8 BOM 포함

      // 파일명에 .csv 확장자 보장
      const finalFilename = filename.endsWith(".csv")
        ? filename
        : `${filename}.csv`;

      const safeFilename = finalFilename.replace(/[\\/:*?"<>|]/g, "_");
      const asciiFallback = safeFilename.replace(/[^\x20-\x7E]/g, "_");
      const useAsciiFallback = /[^\x20-\x7E]/.test(safeFilename);
      const downloadFilename =
        (useAsciiFallback ? asciiFallback : safeFilename).trim() ||
        "export.csv";
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(
        csvContent,
      )}`;
      const useDataUri = dataUri.length <= 1_000_000;

      // IE/Edge 레거시 지원
      const msSave =
        (navigator as any).msSaveBlob || (navigator as any).msSaveOrOpenBlob;
      if (msSave) {
        msSave(blob, downloadFilename);
        return;
      }

      const url = useDataUri ? dataUri : URL.createObjectURL(blob);
      const link = document.createElement("a");
      const supportsDownload = typeof link.download !== "undefined";

      link.href = url;
      link.download = downloadFilename;
      link.setAttribute("download", downloadFilename);
      link.rel = "noopener";
      link.style.position = "fixed";
      link.style.left = "-9999px";
      link.style.top = "0";
      link.style.opacity = "0";
      document.body.appendChild(link);

      if (supportsDownload) {
        link.click();
      } else {
        window.location.href = url;
      }

      window.setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        if (!useDataUri) {
          URL.revokeObjectURL(url);
        }
      }, 10000);
    } catch (error) {
      console.error("CSV 다운로드 오류:", error);
      alert("CSV 다운로드 중 오류가 발생했습니다.");
    }
  };

  return (
    <button
      type="button"
      onClick={downloadCsv}
      className={
        className ||
        "px-3 py-2 rounded bg-gray-900 hover:bg-gray-700 text-gray-200 text-xs transition-colors flex items-center gap-1"
      }
    >
      <Download size={14} />
      {children || "엑셀 다운로드"}
    </button>
  );
}
