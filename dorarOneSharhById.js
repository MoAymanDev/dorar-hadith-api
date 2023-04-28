const nodeFetch = require('node-fetch');
const { decode } = require('html-entities');
const { parseHTML } = require('linkedom');

const cache = require('./cache');

module.exports = async (sharhId, req, next) => {
  try {
    if (!sharhId) throw `Can't find sharh with this id`;
    const url = `https://www.dorar.net/hadith/sharh/${sharhId}`;

    if (cache.has(url)) return cache.get(url);

    const res = await nodeFetch(url);
    if (res.status === 404) throw `Can't find sharh with this id`;

    const html = decode(await res.text());
    const doc = parseHTML(html).document;

    const hadith = doc
      .querySelector('article')
      .textContent.replace(/\d+ -/g, '')
      .trim();

    const subtitles = [
      ...doc.querySelectorAll('.primary-text-color'),
    ].map((el) => el.textContent.trim());

    const sharh = doc
      .querySelector('.text-justify')
      .nextElementSibling.textContent.trim();

    const result = {
      hadith,
      el_rawi: subtitles[0],
      el_mohdith: subtitles[1],
      source: subtitles[2],
      number_or_page: subtitles[3],
      grade: subtitles[4],
      hasSharhMetadata: true,
      sharhMetadata: {
        id: sharhId,
        isContainSharh: true,
        sharh,
        urlToGetSharh: `/site/oneSharhBy?id=${sharhId}`,
      },
    };

    cache.set(url, result);

    return result;
  } catch (err) {
    next(new Error(err));
  }
};
