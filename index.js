const puppeteer = require("puppeteer");

const disableLoadingExtra = async (page) => {
  await page.setRequestInterception(true);
  page.on("request", req => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == 'image'
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

async function download(page, link) {
  let folder = link.slice(39);
  folder = folder.split('/');
  folder = folder.slice(1, -1).join('/');
  folder = folder.split('%20').join(' '); 
  console.log('TCL: download -> folder', folder);
  await page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: `./data/${folder}/`
  });
  await page.goto(link);
  await page.click('body > div.container > div.panel.panel-default.panel-green > div.panel-body > div > div:nth-child(2) > div > div.panel-body > center > div > div.col-md-7 > a');
  await page.waitFor(4444);
}

const call = async (browser, page, link) => {
  const ind = link.indexOf('mp3');
  try {
    if (ind !== -1) {
      let url = link.replace('/www.', '/download.');
      url = url.slice(0, -5);
      url = url.replace('https', 'http');
      await download(page, link);
    } else {
      await page.goto(link);
      await page.waitFor(1000);
      const folders = await page.evaluate(() => {
        const div = document.getElementsByClassName('list-group')[0];
        const anchors = div.querySelectorAll('a');
        const folders = [];
        anchors.forEach(anchor => {
          folders.push(anchor.href);
        })
        return folders.slice(1);
      })
      for (let i = 0; i < folders.length; i += 1) {
        const link = folders[i];
        await call(browser, page, link);
        // break;
      }
    }
  } catch(err) {
    console.log('vitore', err);
  }
};

const scrapeMusicPage = async (URL, folder) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-web-security"
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    var userAgent = JSON.stringify({
      "user-agent" : 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    });
    page.setUserAgent(userAgent);

    disableLoadingExtra(page)
    await call(browser, page, URL, folder);
    await browser.close();

  } catch (err) {
    console.log(err);
    await browser.close();
    return null;
  }
}

const start = async () => {
  let now = 'A';
  while (now.charCodeAt(0) <= 90) {
    const url = `https://www.music.com.bd/download/browse/${now}/`
    await scrapeMusicPage(url, `./data2/${now}/`)
    now = String.fromCharCode(now.charCodeAt(0) + 1);
    // break;
  }

}

start().then(val => {

})
// scrapeAProduct(url).then(val => {
//     console.log(JSON.stringify(val, null, 2))
// })