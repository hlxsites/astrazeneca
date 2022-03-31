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

const makeAbsoluteLink = (link) => {
  return new URL(link, 'https://main--astrazeneca--hlxsites.hlx.page/').toString();
}

const makeAbsoluteLinks = (main) => {
  main.querySelectorAll('a').forEach((a) => {
    if (a.href.startsWith('/')) {
      a.href = makeAbsoluteLink(a.href);
    }
  });
}

// const createHTMLLink = (doc, url, title) => {
//   if (url) {
//     const a = doc.createElement('a');
//     a.href = url;
//     a.textContent = title || url;
//     return a.outerHTML;
//   }
//   return '';
// }

// const createHTMLHeading = (doc, title, level = 2) => {
//   if (title) {
//     const heading = doc.createElement(`h${level}`);
//     heading.textContent = title;
//     return heading.outerHTML;
//   }
//   return '';
// }

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
    return el.outerHTML;
  }
  return '';
};

const insertSectionAfter = (doc, elem) => {
  if (elem) {
    const hr = doc.createElement('hr');
    if (elem.nextElementSibling) {
      elem.parentElement.insertBefore(elem.nextElementSibling, hr);
    } else {
      elem.parentNode.appendChild(hr);
    }
    return hr;
  }
  return null;
}

const createHeroSection = (main, doc) => {
  const heroHeader = main.querySelector('.hero-header');
  if (heroHeader) {
    // add section metadata
    const sectionMetaData = WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['theme', getTheme(heroHeader)]
    ], doc);
    insertSectionAfter(doc, heroHeader);
    heroHeader.replaceWith(heroHeader.querySelector('h1'), sectionMetaData);
  }

  const heroCover = main.querySelector('.hero-feature__cover');
  if (heroCover) {
    // extract background image
    let heroCoverUrl = heroCover.style.backgroundImage;
    if (heroCoverUrl && heroCoverUrl.startsWith('url(')) {
      heroCoverUrl = new URL(
        /url\(\"?(.*)\"?\)/.exec(heroCoverUrl)[1],
        'http://localhost:3000/',
      ).toString();
    }
    const heroCoverImg = doc.createElement('img');
    heroCoverImg.src = heroCoverUrl;
    heroCover.append(heroCoverImg);
    insertSectionAfter(doc, heroCover.closest('.heroFeature'));
  }
};

const createStoriesBlock = (main, doc) => {
  main.querySelectorAll('.homepage-hero-story-wrapper').forEach((section) => {
    const data = [['Stories']];
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
      data.push([`${title.outerHTML}${list(doc, trendingStories)}`]);
    }
    const signupLink = section.querySelector(':scope a.homepage-hero__latest-stories-cta');
    if (signupLink) {
      data.push([signupLink]);
    }
    // add section break
    insertSectionAfter(doc, section);

    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table);
  });
}

const createLinkListBlock = (main, doc) => {
  main.querySelectorAll('.curator__accordion-block').forEach((section) => {
    insertSectionAfter(doc, section);
    const data = [['Link List']];
    const elems = Array.from(section.querySelectorAll('h3, .button'));
    data.push([`${elems.map((e) => e.outerHTML).join('<br>')}`]);

    // add section metadata
    const sectionMetaData = WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['theme', getTheme(section.closest('.content-set-curator'))]],
    doc);

    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table, sectionMetaData);
  });
};

const createAllStoriesBlock = (main, doc) => {
  main.querySelectorAll('#ng-app').forEach((section) => {
    insertSectionAfter(doc, section);
    const data = [['All Stories'], ['Filters: ']];
    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table);
  });
};

const createSignUpBannerBlock = (main, doc) => {
  main.querySelectorAll('.newsletterSignUpBanner').forEach((section) => {
    insertSectionAfter(doc, section);
    const data = [
      ['Sign Up Banner'],
      [section.querySelector('.col-left'), section.querySelector('.col-right')],
    ];
    // add section metadata
    const sectionMetaData = WebImporter.DOMUtils.createTable([
      ['Section Metadata'],
      ['theme', getTheme(section.querySelector('.newsletter-sign-up'))]],
    doc);


    const table = WebImporter.DOMUtils.createTable(data, doc);
    section.replaceWith(table, sectionMetaData);
  });
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

  const author = doc.querySelector('[name="author"]');
  if (author) {
    meta.Author = author.content;
  }

  const date = main.querySelector('.publishedDate .date__date');
  if (date) {
    meta['article:published_time'] = new Date(date.textContent).toISOString();
    date.closest('.publishedDate').remove();
  }

  const block = WebImporter.Blocks.getMetadataBlock(doc, meta);
  main.append(block);

  return meta;
}

export default {
  /**
   * Apply DOM operations to the provided doc and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLdoc} doc The doc
   * @returns {HTMLElement} The root element
   */
  transformDOM: (doc) => {
    // simply return the body, no transformation (yet)
    doc.querySelectorAll('ul.shortcuts, div.mainnav, .modal-window, .leftPar.parsys, div.footer-component').forEach((element) => { 
      element.remove();
    });

    const main = doc.querySelector('.main-section');
    makeAbsoluteLinks(main);
    createHeroSection(main, doc);
    createStoriesBlock(main, doc);
    createLinkListBlock(main, doc);
    createAllStoriesBlock(main, doc);
    createSignUpBannerBlock(main, doc);
    createMetadata(main, doc);
    return doc.body;
  },

  /**
   * Return a path that describes the doc being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word doc.
   * @param {String} url The url of the doc being transformed.
   * @param {HTMLdoc} doc The doc
   */
  generateDocumentPath: (url, doc) => {
    return new URL(url).pathname.replace('.html', '').replace(/\/$/, '');
  },
}
