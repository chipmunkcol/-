import dotenv from "dotenv";
dotenv.config();

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import creds from "./translation/.credentials/august-sandbox-378002-e13c063fc08e.json" assert { type: "json" };
import fs from "fs";
import { dirname } from "path";

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

await doc.loadInfo();

const sheet = doc.sheetsByIndex[0];

const rows = await sheet.getRows();
const fetchedRows = rows.map((row) => {
  return row._rawData;
});

function arrayToNestedObject(arr) {
  const result = {};

  arr.forEach(([path, , , , , value]) => {
    const keys = path.split(".");
    let current = result;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        current[key] = value;
      } else {
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    });
  });

  return result;
}

const nestedObject = arrayToNestedObject(fetchedRows);

const filePath = process.env.EN_JSON_PATH;
// 중간 폴더 없으면 생성
fs.mkdirSync(dirname(filePath), { recursive: true });
// 파일 생성
fs.writeFileSync(filePath, JSON.stringify(nestedObject, null, 2));
