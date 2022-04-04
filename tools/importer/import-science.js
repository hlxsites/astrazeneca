/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console, class-methods-use-this */

//-----------------------------------------------------------------------------
// HELPERS
//-----------------------------------------------------------------------------

const makeAbsoluteLinks = (main) => {
  main.querySelectorAll('a').forEach((a) => {
    if (a.href.startsWith('/')) {
      let path = a.href;
      // strip .html extension
      if (path.endsWith('.html')) {
        path = path.substring(0, path.length - 5);
      }
      a.href = new URL(path, 'https://main--astrazeneca--hlxsites.hlx.page/').toString();
    }
  });
}

const findElementsAfter = (doc, {
  start, tagFilter, selector, end, wrap, delim,
}) => {
  if (!start) return;
  let cursor = start;
  const elems = [];
  while (cursor.nextElementSibling
    && (!tagFilter || cursor.nextElementSibling.tagName.toLowerCase() === tagFilter)
    && (!end || cursor.nextElementSibling !== end)) {
    cursor = cursor.nextElementSibling;
    cursor.querySelectorAll(selector).forEach((elem) => elems.push(elem));
  }
  if (wrap) {
    const container = doc.createElement(wrap);
    elems.forEach((elem) => {
      container.append(elem);
      if (typeof delim === 'function') {
        container.append(delim(doc));
      }
    });
    return container;
  }
  return elems;
};

const getTheme = (elem) => {
  try {
    return [...elem.classList]
      .filter((cl) => cl.includes('--'))
      .pop()
      .split('--')[1];
  } catch (e) {
    // ignore
  }
  return '';  
};

const list = (doc, list, ordered) => {
  if (list && list.length > 0) {
    const el = doc.createElement(ordered ? 'ol' : 'ul');
    list.forEach((item) => {
      const li = doc.createElement('li');
      if (typeof item === 'string') {
        li.innerHTML = item;
      } else {
        li.append(item);
      }
      el.append(li);
    });
    return el;
  }
  return '';
};

const hr = (doc) => doc.createElement('hr');

const location = () => document.querySelector('iframe#contentFrame').contentWindow.location;

const extractBackgroundImage = (doc, elem) => {
  // extract background image
  const bgImg = elem.style.backgroundImage;
  if (bgImg && bgImg.startsWith('url(')) {
    const url = new URL(
      /url\(\"?(.*)\"?\)/.exec(bgImg)[1],
      'http://localhost:3000/',
    ).toString();
    const img = doc.createElement('img');
    img.src = url;
    return img;
  }
  return null;
};

//-----------------------------------------------------------------------------
// BLOCKS & SECTIONS
//-----------------------------------------------------------------------------

const createHeroSection = (main, doc) => {
  const heroHeader = main.querySelector('.hero-header');
  if (heroHeader) {
    // add section metadata
    const sectionMetaData = WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['theme', getTheme(heroHeader)]
    ], doc);
    heroHeader.replaceWith(heroHeader.querySelector('h1'), sectionMetaData, hr(doc));
  }

  const heroCover = main.querySelector('.hero-feature__cover');
  if (heroCover) {
    const heroCoverImg = extractBackgroundImage(doc, heroCover);
    if (heroCoverImg) heroCover.append(heroCoverImg);
    heroCover.closest('.heroFeature').append(hr(doc));
  }

  const richHeader = main.querySelector('.section.richHeader');
  if (richHeader) {
    richHeader.append(hr(doc));
  }
};

const createFeaturedStoriesBlock = (main, doc) => {
  main.querySelectorAll('.homepage-hero-story-wrapper').forEach((section) => {
    const data = [['Featured Stories']];
    const featureStory = section.querySelector('.homepage-hero__feature-story');
    if (featureStory) {
      featureStory.querySelector('p.media-text-link__header')?.remove();
      data.push([featureStory]);
    }
    let trendingStories = Array.from(section.querySelectorAll('.homepage-hero__trending-story'));
    if (trendingStories.length > 0) {
      // add title
      const title = section.querySelector('.homepage-hero__trending-stories .homepage-hero__story-title');
      // reduce story to link
      trendingStories = trendingStories.map((s) => s.querySelector('.treding-story-content .media-text-link__header > a'));
      data.push([`${title.outerHTML}${list(doc, trendingStories).outerHTML}`]);
    }
    const signupLink = section.querySelector(':scope a.homepage-hero__latest-stories-cta');
    if (signupLink) {
      data.push([signupLink]);
    }
    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table, hr(doc));
  });
}

const createLinkListBlock = (main, doc) => {
  main.querySelectorAll('.curator__accordion-block').forEach((section) => {
    const data = [['Link List']];
    const elems = Array.from(section.querySelectorAll('h3, .button'));
    data.push([`${elems.map((e) => e.outerHTML).join('<br>')}`]);

    // add section metadata
    const sectionMetaData = WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['theme', getTheme(section.closest('.content-set-curator'))]],
    doc);

    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table, sectionMetaData, hr(doc));
  });
};

const createStoriesBlock = (main, doc) => {
  const isTopic = location(doc).pathname.includes('/topics/');
  main.querySelectorAll('#ng-app, div.showMoreWrapper').forEach((section) => {
    const data = [['Stories']];
    data.push([['Limit'], 6]);
    data.push([['Filters'], [isTopic ? doc.title : '']]);
    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table);
  });
};

const createSignUpBannerBlock = (main, doc) => {
  main.querySelectorAll('.newsletterSignUpBanner').forEach((section) => {
    const data = [
      ['Sign Up Banner'],
      [section.querySelector('.col-left'), section.querySelector('.col-right')],
    ];
    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(hr(doc), table, hr(doc));
  });
};

const createRelatedStoriesBlock = (main, doc) => {
  let start;
  const h2s = [...main.querySelectorAll('h2')];
  while (!start && h2s.length) {
    const h2 = h2s.shift();
    const lcText = h2.textContent.trim().toLowerCase();
    if (['related story', 'related stories'].includes(lcText)) {
      start = h2;
      break;
    }
  }
  if (!start) return;
  const elems = findElementsAfter(doc, {
    start,
    tagFilter: 'p',
    selector: 'a',
    wrap: 'p',
  });
  const data = [['Related Stories']];
  data.push([[list(doc, [...elems.children])]]);
  const table = WebImporter.DOMUtils.createTable(data, doc);
  start.replaceWith(table);

  table.closest('div.section')?.nextElementSibling?.remove();
};

const createRecommendedStoriesBlock = (main, doc) => {
  let start;
  const h2s = [...main.querySelectorAll('h2')];
  while (!start && h2s.length) {
    const h2 = h2s.shift();
    if (h2.textContent.trim().toLowerCase() === 'you may also like') {
      start = h2.closest('div.section');
      break;
    }
  }
  if (!start) return;

  const links = [...start.nextElementSibling.querySelectorAll('a.content-tile')].map((link) => {
    link.innerHTML = link.textContent.trim();
    return link;
  });
  const content = list(doc, links);

  const data = [['Recommended Stories']];
  data.push([[content]]);
  const table = WebImporter.DOMUtils.createTable(data, doc);
  start.replaceWith(table);
};

const createEmbedBlock = (main, doc) => {
  main.querySelectorAll('.responsive-image__video-link').forEach((video) => {
    const data = [['Embed']];
    data.push([[new URL(video.href, location(doc)).hash.split('=')[1]]]);
    const poster = video.previousElementSibling
    if (poster && poster.src) {
      data.push([[poster]]);
    }
    const table = WebImporter.DOMUtils.createTable(data, doc);
    video.replaceWith(table);
  });
};

const createQuoteBlock = (main, doc) => {
  main.querySelectorAll('blockquote').forEach((quote) => {
    const data = [['Quote']];
    const content = [...quote.children];
    const quoteImg = extractBackgroundImage(doc, quote);
    if (quoteImg) content.unshift(quoteImg);
    data.push([[...content]]);
    const table = WebImporter.DOMUtils.createTable(data, doc);
    quote.replaceWith(table);
  });
};

const removeTopics = (main, doc) => {
  let start;
  const h2s = [...main.querySelectorAll('h2')];
  while (!start && h2s.length) {
    const h2 = h2s.shift();
    const lcText = h2.textContent.trim().toLowerCase();
    if (['topic:', 'topics:'].includes(lcText)) {
      start = h2.closest('div.section');
    }
  }
  if (!start) return;
  if (start.nextElementSibling) {
    if (!start.nextElementSibling.className.includes('spacer')) {
    } else {
      // try next sibling
      start.nextElementSibling.nextElementSibling?.remove();
    }
  }
  start.parentNode.removeChild(start);
};

const createMetadata = (main, doc) => {
  const meta = {};

  const title = doc.querySelector('[property="og:title"]');
  if (title) {
    meta.Title = title.content;
  }

  const desc = doc.querySelector('[name="description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  const image = doc.querySelector('[property="og:image"]');
  if (image && image.content) {
    const img = doc.createElement('img');
    img.src = new URL(image.content, 'http://localhost:3000/');
    meta.Image = img;
  }

  const bios = doc.querySelectorAll('.bio.section');
  if (bios.length > 0) {
    if (bios.length === 1) {
      const author = bios[0];
      meta['article:author'] = author.querySelector('[itemprop="name"]')?.textContent || '';
      const bioPic = author.querySelector('[itemprop="image"]')?.src;
      if (bioPic) {
        const img = doc.createElement('img');
        img.src = new URL(bioPic, 'http://localhost:3000/');
        meta['article:author:image'] = img;
      }
    } else {
      const coAuthors = [...bios].shift();
      meta['article:author'] = coAuthors.querySelector('[itemprop="name"]')?.textContent || '';
    }    
    bios.forEach((bio) => bio.remove());
  }

  const date = main.querySelector('.publishedDate .date__date');
  if (date) {
    meta['article:published_time'] = new Date(date.textContent).toISOString();
    date.closest('.publishedDate').remove();
  }

  const tags = [...main.querySelectorAll('.leftPar.parsys .text.section a')]
    .map((a) => a.textContent)
    .join(', ');
  if (tags) {
    meta['Tags'] = tags;
  }

  const block = WebImporter.Blocks.getMetadataBlock(doc, meta);
  main.append(block);

  return meta;
}

//-----------------------------------------------------------------------------

export default {
  /**
   * Apply DOM operations to the provided doc and return
   * the root element to be then transformed to Markdown.
   * @param {String} cfg.url The url of the doc being transformed.
   * @param {HTMLdoc} cfg.document The doc
   * @returns {HTMLElement} The root element
   */
  transformDOM: ({ document: doc }) => {
    console.log(`Path: ${location(doc).pathname}`);

    const main = doc.querySelector('.main-section');
    createMetadata(main, doc);

    doc.querySelectorAll('ul.shortcuts, div.mainnav, .modal-window, .leftPar.parsys, div.footer-component').forEach((element) => { 
      element.remove();
    });

    makeAbsoluteLinks(main);
    createHeroSection(main, doc);
    createFeaturedStoriesBlock(main, doc);
    createLinkListBlock(main, doc);
    createStoriesBlock(main, doc);
    createSignUpBannerBlock(main, doc);
    createRelatedStoriesBlock(main, doc);
    removeTopics(main, doc);
    createRecommendedStoriesBlock(main, doc);
    createQuoteBlock(main, doc);
    createEmbedBlock(main, doc);
    return doc.body;
  },

  /**
   * Return a path that describes the doc being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word doc.
   * @param {String} cfg.url The url of the doc being transformed.
   * @param {HTMLdoc} cfg.document The doc
   */
  generateDocumentPath: ({ url }) => {
    return new URL(url).pathname.replace('.html', '').replace(/\/$/, '');
  },
}
