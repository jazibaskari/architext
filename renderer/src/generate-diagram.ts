import puppeteer from "puppeteer";
import * as fs from "fs";
import * as path from "path";

// 1. Replaced 'any' with 'unknown' to satisfy ESLint
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
    headless: true, // 2. Fixed Puppeteer type error
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.setViewport({ width: 1024, height: 768 });

  const htmlPath = `file:${path.join(
    __dirname,
    "renderer",
    "dist",
    "index.html"
  )}`;
  await page.goto(htmlPath, { waitUntil: "networkidle0" });

  await page.evaluate((data: ArchitecturePayload) => {
    // 3. Define a custom window interface inside the evaluate context
    interface DiagramWindow extends Window {
      renderDiagram: (payload: ArchitecturePayload) => void;
    }

    // Cast window to unknown first, then to our custom interface
    (window as unknown as DiagramWindow).renderDiagram(data);
  }, jsonPayload);

  const flowSelector = ".react-flow";
  await page.waitForSelector(flowSelector);

  await new Promise((r) => setTimeout(r, 500));

  const element = await page.$(flowSelector);
  if (!element) {
    await browser.close();
    throw new Error(
      `Failed to find React Flow viewport selector: ${flowSelector}`
    );
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
