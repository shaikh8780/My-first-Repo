import base from './playwright.config';
export default { ...base, testIgnore: undefined, grep: /capture:/ };
