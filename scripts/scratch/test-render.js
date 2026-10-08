import { renderQuestionText } from './src/utils/urlUtils.js';

console.log(renderQuestionText("Hello [IMG]", "http://example.com"));
console.log(renderQuestionText("Hello [img]http://test.com[/img]"));
