// Import puppeteer
const puppeteer = require("puppeteer");
const config = require("./config");
const fs = require("node:fs");

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
  totalDuration
) => {
  let csv =
    "Time,Redirect,DNS,Connect,Request,Response,DOM Total,DOM Parse,DOM Execute Scripts,DOM Content Loaded,DOM Sub Resources,Load Event,Total Duration";
  if (fs.existsSync("result.csv")) {
    csv = fs.readFileSync("result.csv", "utf-8");
  }
  const now = new Date().toString();
  // console.log(now.toString())
  csv =
    csv +
    `\n${now},${Redirect},${DNS},${Connect},${Request},${Response},${DOMTotal},${DOMParse},${DOMExecuteScripts},${DOMContentLoaded},${DOMSubResources},${LoadEvent},${totalDuration}`;
  fs.writeFileSync("result.csv", csv, "utf-8");
};

const test = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Launch the browser
      const browser = await puppeteer.launch();

      // Create a page
      const page = await browser.newPage();

      // Disable caching
      await page.setCacheEnabled(false);

      // Go to your site
      await page.goto(config.url, {
        timeout: 10000,
        waitUntil: "networkidle2",
      });

      // await waitTillHTMLRendered(page);

      const performance = await page.evaluate(async () => {
        window.scrollTo({ top: 100000000000000 });
        const timing = performance.getEntriesByType("navigation")[0].toJSON();

        return timing;
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
      console.log("Total Duration", performance.duration);
      console.log("URL:", config.url);
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
        totalDuration
      );
      resolve();
    } catch {
      reject("Error");
    }
  });
};

const main = async () => {
  for (let i = 0; i < 1; i++) {
    console.log(`Test Number ${i + 1}`);
    console.log(`-------------------------------------`);
    await test();
    console.log(`-------------------------------------`);
  }
};
main();
