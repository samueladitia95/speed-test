// Import puppeteer
const puppeteer = require("puppeteer");
const config = require("./config");
const fs = require("node:fs");
const iphone = puppeteer.KnownDevices["iPhone 12 Pro"];

const printData = (eventName, startTime = 0, endTime = 0) => {
  console.log(`${eventName}: `);
  console.log(`   Start Time : ${startTime}`);
  console.log(`   End Time   : ${endTime}`);
  console.log(`   Duration   : ${endTime - startTime} ms`);
  console.log("+++++++++++++++++++");
  return endTime - startTime;
};

const saveToCSV = (
  Redirect,
  DNS,
  Connect,
  Request,
  Response,
  DOMTotal,
  DOMParse,
  DOMExecuteScripts,
  DOMContentLoaded,
  DOMSubResources,
  LoadEvent,
  totalDuration,
  fcp
) => {
  let csv =
    "Time,Redirect,DNS,Connect,Request,Response,DOM Total,DOM Parse,DOM Execute Scripts,DOM Content Loaded,DOM Sub Resources,Load Event,Total Duration,FCP";
  if (fs.existsSync("result.csv")) {
    const file = fs.readFileSync("result.csv", "utf-8");
    if (file !== "") {
      csv = file;
    }
  }
  const now = new Date().toISOString();
  // console.log(now.toString())
  csv =
    csv +
    `\n${now},${Redirect},${DNS},${Connect},${Request},${Response},${DOMTotal},${DOMParse},${DOMExecuteScripts},${DOMContentLoaded},${DOMSubResources},${LoadEvent},${totalDuration},${fcp}`;
  fs.writeFileSync("result.csv", csv, "utf-8");
};

const test = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Launch the browser
      const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: config.isMobile
          ? {
              width: 390,
              height: 884,
              isMobile: true,
            }
          : {
              width: 1920,
              height: 1080,
            },
      });

      // Create a page
      const page = await browser.newPage();
      if (config.isMobile) {
        await page.emulate(iphone);
      }

      // Disable caching
      await page.setCacheEnabled(false);

      await page.emulateNetworkConditions(
        puppeteer.PredefinedNetworkConditions["Fast 3G"]
      );

      const client = await page.createCDPSession();
      client.send("Network.emulateNetworkConditions", {
        offline: false,
        downloadThroughput: 1.6 * 1024 * 1024,
        uploadThroughput: 1.6 * 1024 * 1024,
        latency: 100,
      });

      // Go to your site
      await page.goto(config.url, {
        timeout: 30000,
        waitUntil: "networkidle2",
      });

      const { performance, fcp } = await page.evaluate(async () => {
        const timing = performance.getEntriesByType("navigation")[0].toJSON();
        const fcp = performance
          .getEntriesByType("paint")
          .find(({ name }) => name === "first-contentful-paint")
          .toJSON();

        return {
          performance: timing,
          fcp,
        };
      });
      console.log(await page.metrics());

      const redirect = printData(
        "Redirect",
        performance.redirectStart,
        performance.redirectEnd
      );
      const dns = printData(
        "DNS",
        performance.domainLookupStart,
        performance.domainLookupEnd
      );
      const connect = printData(
        "Connect",
        performance.connectStart,
        performance.connectEnd
      );

      const request = printData(
        "Request",
        performance.requestStart,
        performance.responseStart
      );
      const response = printData(
        "Response",
        performance.responseStart,
        performance.responseEnd
      );

      const domTotal = printData(
        "DOM Total",
        performance.responseEnd,
        performance.domComplete
      );
      const domParse = printData(
        "DOM Parse",
        performance.responseEnd,
        performance.domInteractive
      );
      const domExecute = printData(
        "DOM Execute Scripts",
        performance.domInteractive,
        performance.domContentLoadedEventStart
      );
      const domContent = printData(
        "DOM Content Loaded",
        performance.domContentLoadedEventStart,
        performance.domContentLoadedEventEnd
      );
      const domSub = printData(
        "DOM Sub Resources",
        performance.domContentLoadedEventEnd,
        performance.domComplete
      );

      const loadEvent = printData(
        "Load Event",
        performance.loadEventStart,
        performance.loadEventEnd
      );
      const totalDuration = performance.duration;
      console.log("Total Duration", performance.duration, "ms");

      const fcpEvent = printData("FCP", 0, fcp.startTime);

      console.log("URL:", config.url);
      console.log("FCP:", fcpEvent, "ms");
      // Close browser.
      await browser.close();
      saveToCSV(
        redirect,
        dns,
        connect,
        request,
        response,
        domTotal,
        domParse,
        domExecute,
        domContent,
        domSub,
        loadEvent,
        totalDuration,
        fcpEvent
      );
      resolve();
    } catch {
      reject("Error");
    }
  });
};

const main = async () => {
  const iteration = config.iteration ? config.iteration : 1;
  for (let i = 0; i < iteration; i++) {
    console.log(`Test Number ${i + 1}`);
    console.log(`-------------------------------------`);
    await test();
    console.log(`-------------------------------------`);
  }
};
main();
