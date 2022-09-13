import { html_beautify } from 'js-beautify';
import webfontloader from 'webfontloader';

declare global {
  interface Window {
    html_beautify: typeof html_beautify;
    PR: {
      prettyPrint: () => void;
    };
    webFont: typeof webfontloader;
  }
}

{
  const buildCodeView = () => {
    document.documentElement.classList.add('js');

    const docHtml = window
      .html_beautify(document.documentElement.outerHTML, {
        indent_inner_html: true,
        indent_size: 2,
        wrap_line_length: 0,
      })
      .replace(/<br>/gim, '\n');
    const flexBox = document.createElement('div');
    const preBlock = document.createElement('pre');
    const codeBlock = document.createElement('code');
    const checkBox = document.createElement('input');
    const labelTag = document.createElement('label');
    const main = document.getElementsByTagName('main')[0];
    const footer = document.querySelector('.page-footer')!;

    preBlock.className = 'prettyprint linenums';
    preBlock.appendChild(codeBlock);

    codeBlock.textContent = docHtml;
    codeBlock.className = 'lang-html';

    flexBox.className = 'flex-box';
    flexBox.appendChild(preBlock);

    document.body.insertBefore(flexBox, main);

    flexBox.appendChild(main);
    flexBox.appendChild(footer);

    window.PR.prettyPrint();

    checkBox.type = 'checkbox';
    checkBox.id = 'show_code_view';
    checkBox.checked = true;
    labelTag.htmlFor = 'show_code_view';
    labelTag.textContent = 'Show Code View';

    document.body.insertBefore(checkBox, flexBox);
    document.body.insertBefore(labelTag, flexBox);
  };

  document.addEventListener('DOMContentLoaded', () => {
    buildCodeView();

    window.WebFont.load({ google: { families: ['Lato:300,300i,700,700i'] } });
  });
}
