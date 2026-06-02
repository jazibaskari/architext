import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";

interface ArchitecturePayload {
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: { label: string; [key: string]: unknown };
    [key: string]: unknown;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    [key: string]: unknown;
  }>;
}

async function generateArchitectureImage(
  jsonPayload: ArchitecturePayload,
  outputPath: string
): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--allow-file-access-from-files",
    ],
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1280,
    height: 1024,
    deviceScaleFactor: 2,
  });

  const htmlPath = `file:${path.join(
    __dirname,
    "renderer",
    "dist",
    "index.html"
  )}`;

  await page.goto(htmlPath, { waitUntil: "networkidle0" });

  await page.waitForFunction(
    () => typeof (globalThis as any).renderDiagram === "function",
    { timeout: 5000 }
  );

  await page.evaluate((data: ArchitecturePayload) => {
    (globalThis as any).renderDiagram(data);
  }, jsonPayload);

  const flowSelector = ".react-flow";
  await page.waitForSelector(flowSelector);

  await new Promise((r) => setTimeout(r, 1000));

  const element = await page.$(flowSelector);
  if (!element) {
    await browser.close();
    throw new Error(`Failed to find React Flow viewport: ${flowSelector}`);
  }

  await element.screenshot({ path: outputPath });

  await browser.close();
  console.log(`Diagram successfully saved to ${outputPath}`);
}

try {
  const rawData = fs.readFileSync(
    path.resolve(__dirname, "./architecture.json"),
    "utf8"
  );
  const myArchitectureJson: ArchitecturePayload = JSON.parse(rawData);

  generateArchitectureImage(myArchitectureJson, "./output-diagram.png");
} catch (error) {
  console.error("Error executing diagram generator:", error);
}
