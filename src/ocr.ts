import Tesseract from 'tesseract.js';

const seekonkRegex = /(?:JUN|JULY|AUG|SEPT|OCT|NOV|DEC|JUN|JUL|JAN|FEB|MAR|APR|MAY|JUNE)\s+(?:\d{1,2})/gmi;

// if a date shows up in the OCR, we assume there's a race on that event
// we can make a guess as to the classes and whatnot by looking at the rest of the line
export async function doOCR(): Promise<string | void>
{
  const { data: { text } } = await Tesseract.recognize(
    'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg',
    'eng',
    { logger: (m1) => console.log(m1) }
  );
  console.log(text);
}
