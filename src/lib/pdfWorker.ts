// IMPROVED: PDF.js worker configuration for in-browser PDF parsing
import * as pdfjsLib from "pdfjs-dist";
// @ts-expect-error - vite worker import
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export { pdfjsLib };
