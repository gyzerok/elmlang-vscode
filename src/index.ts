import * as vscode from 'vscode';
import { exec } from 'child_process';

const ELM_MODE: vscode.DocumentFilter = { language: 'elm', scheme: 'file' };

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      ELM_MODE,
      new ElmFormatProvider(),
    ),
  );
}

class ElmFormatProvider implements vscode.DocumentFormattingEditProvider {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
    );
  }

  private showError(err: Error): void {
    const message = (<string>err.message).includes('SYNTAX PROBLEM')
      ? 'Running elm-format failed. Check the file for syntax errors.'
      : 'Running elm-format failed. Install from ' +
        "https://github.com/avh4/elm-format and make sure it's on your path";

    if (vscode.window.activeTextEditor) {
      this.statusBarItem.text = message;
      this.statusBarItem.show();
    }
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
  ): Thenable<vscode.TextEdit[]> {
    return new Promise<string>((resolve, reject) => {
      const cmd = exec('elm-format --stdin', (err, stdout) => {
        err ? reject(err) : resolve(stdout);
      });

      cmd.stdin.write(document.getText());
      cmd.stdin.end();
    })
      .then(formattedText => {
        const lastLineId = document.lineCount - 1;
        const wholeDocument = new vscode.Range(
          0,
          0,
          lastLineId,
          document.lineAt(lastLineId).text.length,
        );
        return [vscode.TextEdit.replace(wholeDocument, formattedText)];
      })
      .catch(err => {
        this.showError(err);
        return [];
      });
  }
}
