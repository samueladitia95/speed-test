// Import puppeteer
const puppeteer = require("puppeteer");
const config = require("./config");

const printData = (eventName, startTime = 0, endTime = 0) => {
  console.log(`${eventName}: `);
  console.log(`   Start Time : ${startTime}`);
  console.log(`   End Time   : ${endTime}`);
  console.log(`   Duration   : ${endTime - startTime} ms`);
  console.log("+++++++++++++++++++");
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
      await page.goto(config.url);

      const performance = await page.evaluate(async () => {
        window.scrollTo({ top: 100000000000000 });

        if (config.customBehaviour) {
          await config.customBehaviour();
        }

        const timing = performance.getEntriesByType("navigation")[0].toJSON();

        return timing;
      });

      printData("Redirect", performance.redirectStart, performance.redirectEnd);
      printData(
        "DNS",
        performance.domainLookupStart,
        performance.domainLookupEnd
      );
      printData("Connect", performance.connectStart, performance.connectEnd);

      printData("Request", performance.requestStart, performance.responseStart);
      printData("Response", performance.responseStart, performance.responseEnd);

      printData("DOM Total", performance.responseEnd, performance.domComplete);
      printData(
        "DOM Parse",
        performance.responseEnd,
        performance.domInteractive
      );
      printData(
        "DOM Execute Scripts",
        performance.domInteractive,
        performance.domContentLoadedEventStart
      );
      printData(
        "DOM Content Loaded",
        performance.domContentLoadedEventStart,
        performance.domContentLoadedEventEnd
      );
      printData(
        "DOM Sub Resources",
        performance.domContentLoadedEventEnd,
        performance.domComplete
      );

      printData(
        "Load Event",
        performance.loadEventStart,
        performance.loadEventEnd
      );

      console.log("Duration", performance.duration);

      // Close browser.
      await browser.close();

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
