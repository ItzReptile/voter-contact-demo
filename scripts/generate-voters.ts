// npm run generate: writes public/sample-voters.csv. Same seed, same file.
import { writeFileSync } from "node:fs";
import { generateVoterCsv } from "@/dev/fake-voters";

const file = "public/sample-voters.csv";
writeFileSync(file, generateVoterCsv());
console.log(`Wrote ${file}`);
