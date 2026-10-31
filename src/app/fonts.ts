import { Archivo } from "next/font/google";

// One family, two widths: Archivo condensed (font-stretch 72%) for display and numbers,
// normal width for reading. The width axis has to be requested explicitly.
export const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
