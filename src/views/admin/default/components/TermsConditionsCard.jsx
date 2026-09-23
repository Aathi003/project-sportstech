import { useEffect, useState } from "react";
import Card from "components/card";
import configAPI from "services/configAPI";
import { API_BASE } from "services/apiConfig";
import { FaDownload, FaEye, FaFileContract } from "react-icons/fa";

const getResolvedFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (
    fileUrl.startsWith("http") ||
    fileUrl.startsWith("data:") ||
    fileUrl.startsWith("blob:")
  ) {
    return fileUrl;
  }

  const apiBase = API_BASE?.endsWith("/") ? API_BASE.slice(0, -1) : API_BASE;
  const originBase = apiBase?.replace(/\/api\/?$/, "") || "";
  const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;

  if (path.startsWith("/media/")) {
    return `${originBase}${path}`;
  }

  return `${apiBase}${path}`;
};

const getFileName = (fileUrl) => {
  if (!fileUrl) return "";
  const fileName = fileUrl.split("/").pop() || "terms-and-conditions.pdf";
  return decodeURIComponent(fileName);
};

const TermsConditionsCard = () => {
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState("");
  const [termsText, setTermsText] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    configAPI.getConfig(
      (data) => {
        const configSource =
          data?.data ?? data?.results ?? (Array.isArray(data) ? data : [data]);
        const configData = Array.isArray(configSource)
          ? configSource[0] || {}
          : configSource || {};
        const termsValue = configData?.term_and_conditions || "";
        const termsFilePath =
          configData?.term_and_conditions_file ||
          configData?.term_and_conditions ||
          (typeof termsValue === "string" &&
          (termsValue.startsWith("/media/") ||
            termsValue.startsWith("http") ||
            termsValue.endsWith(".pdf"))
            ? termsValue
            : "");

        setFileUrl(getResolvedFileUrl(termsFilePath));
        setTermsText(termsFilePath ? "" : termsValue);
        setLoading(false);
      },
      () => {
        setFileUrl("");
        setTermsText("");
        setLoading(false);
      }
    );
  }, []);

  const hasFile = Boolean(fileUrl);
  const fileName = getFileName(fileUrl);

  const handleView = () => {
    if (!fileUrl) return;

    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };
  const handlePreview = () => {
    if (!fileUrl) return;

    setIsPreviewOpen(true);
  };

  const handleDownload = () => {
    if (!fileUrl) return;

    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = fileName || "terms-and-conditions.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card extra="w-full h-full px-4 pb-4 pt-4 overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <FaFileContract className="text-xl" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-navy-700 dark:text-white">
              Terms and Conditions
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Preview, open, or download the latest policy document uploaded by
              admin.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-navy-800">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading terms document...
            </p>
          ) : hasFile ? (
            <>
              <p className="truncate text-sm font-semibold text-navy-700 dark:text-white">
                {fileName}
              </p>
              {termsText ? (
                <p className="mt-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                  {termsText}
                </p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                >
                  <FaEye className="text-xs" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleView}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  <FaEye className="text-xs" />
                  View
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  <FaDownload className="text-xs" />
                  Download
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No terms and conditions file has been uploaded yet.
            </p>
          )}
        </div>
      </Card>

      {isPreviewOpen && hasFile && (
        <div className="bg-black/60 fixed inset-0 z-[999] flex items-end justify-center backdrop-blur-sm sm:items-center sm:p-4">
          <div
            className="flex w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-navy-800 sm:max-h-[90vh] sm:max-w-5xl sm:rounded-2xl"
            style={{ height: "92dvh" }}
          >
            <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h4 className="truncate text-sm font-bold text-navy-700 dark:text-white sm:text-base">
                  {fileName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF Preview
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleView}
                  className="flex-1 rounded-lg border border-blue-300 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20 sm:flex-none sm:text-sm"
                >
                  View in New Tab
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-white/5 sm:flex-none sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-navy-900">
              {fileUrl ? (
                <iframe
                  title="Terms and Conditions Preview"
                  src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                  Preview unavailable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TermsConditionsCard;
