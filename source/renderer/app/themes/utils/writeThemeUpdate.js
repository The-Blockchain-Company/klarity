// @flow
import fs from 'fs';
import path from 'path';
import type { FormattedConstNames, WriteThemeUpdateParams } from '../types';

const formatConstNames = (fileName: string): FormattedConstNames => {
  const constNames = {};
  let PREFIX = '';

  const fileNameParts = fileName.split('-');
  if (fileNameParts.length > 1) {
    PREFIX = `${fileNameParts[0].toUpperCase()}_${fileNameParts[1].toUpperCase()}`;
    constNames.themeOutput = `${PREFIX}_THEME_OUTPUT`;
    constNames.themeParams = `${PREFIX}_THEME_PARAMS`;
    return constNames;
  }

  PREFIX = `${fileNameParts[0].toUpperCase()}`;
  constNames.themeOutput = `${PREFIX}_THEME_OUTPUT`;
  constNames.themeParams = `${PREFIX}_THEME_PARAMS`;
  return constNames;
};

export const writeThemeUpdate = ({
  fileName,
  updatedThemeObj,
}: WriteThemeUpdateParams) => {
  const pathBase = __dirname.includes('dist')
    ? '../../source/renderer/app/themes/klarity'
    : '../klarity';

  const THEME_FILE = path.join(__dirname, pathBase, `${fileName}.js`);

  const { themeOutput, themeParams } = formatConstNames(fileName);
  const FILE_CONTENT = `
    // @flow
    import { createTheme } from '../utils/createTheme';
    import type { CreateThemeParams } from '../types';

    //  ==== ${fileName} theme output for Klarity and react-polymorph components === //
    export const ${themeOutput} = ${JSON.stringify(updatedThemeObj, null, 2)};

    const ${themeParams}: CreateThemeParams = {
      config: ${themeOutput},
    };

    export default createTheme(${themeParams});
  `;

  // @TODO - remove flow fix and move fs to main process
  // $FlowFixMe
  fs.writeFileSync(THEME_FILE, FILE_CONTENT, {}); // eslint-disable-line
};
