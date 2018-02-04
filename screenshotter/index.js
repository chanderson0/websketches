const puppeteer = require("puppeteer");
const rimraf = require("rimraf");

const fs = require("fs");
const os = require("os");
const path = require("path");
const child_process = require("child_process");

(async () => {
  try {
    const url = process.argv[2];
    const name = process.argv[3];

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const dlDir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));

    // Set up page
    await page.setViewport({ width: 512, height: 512 });
    await page._client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: dlDir
    });

    page.on("console", console.log);
    page.on("error", console.log);

    // Go and wait
    await page.goto(url);
    await page.waitFor(500);

    // Take a screenshot
    await page.screenshot({ path: `${name}.png` });

    // Record a video
    await page.keyboard.type("r");
    await page.waitFor(30000);
    await page.keyboard.type("r");
    await page.waitFor(1000);

    // Encode video
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "frames-"));
    {
      const cmd = ["tar", "xf", path.join(dlDir, "Sketch.tar"), "-C", dir].join(
        " "
      );
      child_process.execSync(cmd);
    }
    {
      const cmd = [
        "ffmpeg",
        "-y",
        "-framerate 30",
        `-i ${dir}/%07d.png`,
        "-c:v libx264",
        "-pix_fmt yuv420p",
        `${name}.mp4`
      ].join(" ");
      child_process.execSync(cmd);
    }
    rimraf.sync(dir);
    rimraf.sync(dlDir);

    // Done!
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
