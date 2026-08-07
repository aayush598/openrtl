import { test, expect } from "bun:test"
const locales = ["ar","br","bs","da","de","es","fr","ja","ko","no","pl","ru","uk","th","tr","zh","zht"]
test("parity", async () => {
  const en = await import("./en")
  const report: Record<string, string[]> = {}
  for (const loc of locales) {
    const t = await import(`./${loc}`)
    const missing = Object.keys(en.dict).filter((k) => !(k in t.dict))
    if (missing.length) report[loc] = missing
  }
  console.log("MISSING REPORT:", JSON.stringify(report, null, 2))
  expect(Object.keys(report).length).toBe(0)
})
