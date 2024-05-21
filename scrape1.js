const axios = require('axios');
const cheerio = require('cheerio');
const xlsx = require('xlsx');
const iconv = require('iconv-lite');
const jschardet = require('jschardet');

const baseUrl = 'https://www.agsvyazi.ru/beeline/numbers/index.page.';
const startPage = 0;
const endPage = 12300;

const results = [];

async function scrapePage(page) {
  try {
    const url = `${baseUrl}${page}.htm`;
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const detectedEncoding = jschardet.detect(response.data).encoding;

    console.log(`Detected encoding for page ${page}: ${detectedEncoding}`);

    const decodedData = iconv.decode(response.data, detectedEncoding);
    const $ = cheerio.load(decodedData);

    $('tr[id^="row_"]').each((i, elem) => {
      const number = $(elem).find('.number-table').text().trim();
      const region = $(elem).find('td.display-table').eq(1).text().trim();
      const tariff = $(elem).find('.cost-rental').text().trim();

      console.log(`Number: ${number}, Region: ${region}, Tariff: ${tariff}`);

      if (number && region && tariff) {
        results.push({ number, region, tariff });
        console.log(`Parsed: ${number}, ${region}, ${tariff}`);
      } else {
        console.log('Missing data for one of the fields.');
      }
    });

  } catch (error) {
    console.error(`Error fetching page ${page}:`, error);
  }
}

async function scrapeAllPages() {
  for (let page = startPage; page <= endPage; page+=100) {
    await scrapePage(page);
  }

  if (results.length === 0) {
    console.log('No data was parsed. Please check your selectors or website structure.');
    return;
  }

  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(results);


  xlsx.utils.book_append_sheet(workbook, worksheet, 'Numbers1');

  xlsx.writeFile(workbook, 'numbers1.xlsx');

  console.log('The Excel file was written successfully');
}

scrapeAllPages();
