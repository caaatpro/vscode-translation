// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as fs from 'fs';

const projectRootPath = vscode.workspace.rootPath;
let localesDictionary:any = {};

const noTranslation = `No translation`;

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "vscode-translation" is now active!'
  );

  // Получаем путь до файла переводов
  const config = vscode.workspace.getConfiguration('vscode-translation');
  const localeFilePath = config.get('localeFilePath');
  if (!localeFilePath) {
    console.log('vscode-translation plugin config invalid');
    return;
  }

  // Читаем файл переводов
  setLocalesJson(localeFilePath as string);

  /**
   * Регистрируем событие наведения
   */
  const disposable = vscode.languages.registerHoverProvider(
    { scheme: 'file' },
    {
      provideHover: async (_document, position, _token) => {
        const result = [];
        let editor = vscode.window.activeTextEditor as any,
          selectionText = editor.document.getText(editor.selection),
          resultText = '';

        if (!isInSelectedText(position, editor.selection)) {
          return;
        }

        if (selectionText) {
          result.push(getTranslate(selectionText));
        }

        resultText = result.join('\n\n');
        return new vscode.Hover(resultText);
      },
    }
  );
  context.subscriptions.push(disposable);
}

// 判断鼠标是否在选中区域
function isInSelectedText(position: any, selectedPosition: any) {
  const { line: startLine, character: startCharacter } = selectedPosition.start;
  const { line: endLine, character: endCharacter } = selectedPosition.end;
  const { line, character } = position;
  if (startLine < line && line < endLine) {
    return true;
  } else if (startLine === line && character >= startCharacter) {
    return true;
  } else if (line === endLine && character <= endCharacter) {
    return true;
  }
  return false;
}

// Читаем файл перевода
function setLocalesJson(file:string) {
  if (!path.isAbsolute(file) && projectRootPath) {
    file = path.resolve(projectRootPath, file);
  }
  try {
    localesDictionary = yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.log(e);
  }
}

function getTranslate(text: string): string {
  const textPath = text.split('.');
  let currentDictionary = {... localesDictionary};
  if (!currentDictionary[textPath[0]]) {
    return noTranslation;
  }

  textPath.forEach((item) => {
    if (currentDictionary[item]) {
      currentDictionary = currentDictionary[item];
    }
  });

  return JSON.stringify(currentDictionary);
}