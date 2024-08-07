import dotenv from "dotenv";
dotenv.config();

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import creds from "./translation/.credentials/august-sandbox-378002-e13c063fc08e.json" assert { type: "json" };
import fs from "fs";

const serviceAccountAuth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
  ],
});

const doc = new GoogleSpreadsheet(
  process.env.SPREAD_SHEET_DOC_ID,
  serviceAccountAuth
);

await doc.loadInfo(); // loads document properties and worksheets
console.log(doc.title);

const sheet = doc.sheetsByIndex[0];
// await sheet.clearRows({ start: 0, end: 1 });

await sheet.setHeaderRow([
  "key",
  "한글",
  "자동번역",
  "검수",
  "비고",
  "다운로드",
]);

const rows = await sheet.getRows();
console.log("rows : ", rows);

let existedKeys = [];
for (const row of rows) {
  console.log(row._rawData[0]);
  existedKeys.push(row._rawData[0]);
}

const filePath = process.env.KO_JSON_PATH;
const jsonFile = fs.readFileSync(filePath);
const jsonData = JSON.parse(jsonFile);

function flattenObject(obj, parentKey = "", result = []) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenObject(value, newKey, result);
    } else {
      const newObject = { key: newKey, 한글: value };
      result.push(newObject);
    }
  }
  return result;
}

const flattenedKoJson = flattenObject(jsonData);

const newFlattenedKoJson = flattenedKoJson.filter(
  (obj) => !existedKeys.includes(obj.key)
);

console.log("새롭게 업데이트 될 Array: ", newFlattenedKoJson);

if (newFlattenedKoJson.length > 0) {
  await sheet.addRows(newFlattenedKoJson);
}
