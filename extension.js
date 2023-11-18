// extension.js

const vscode = require("vscode");
const axios = require("axios");

let diagnosticCollection;
// let orange = vscode.window.createOutputChannel("Orange");

function activate(context) {
  // 在activate函数中初始化diagnosticCollection
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("typoCorrections");
  // Ensure apiKey and baseUrl are retrieved inside the function that uses them
  let disposable = vscode.commands.registerCommand(
    "extension.checkChineseTypo",
    async function () {
      diagnosticCollection.clear();

      const apiKey = vscode.workspace
        .getConfiguration("chineseTypoChecker")
        .get("openaiApiKey");
      const baseUrl = vscode.workspace
        .getConfiguration("chineseTypoChecker")
        .get("openaiBaseUrl");
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return; // No open text editor
      }

      const chineseLines = extractChineseLines(editor);
      const corrections = await checkChineseText(chineseLines, baseUrl, apiKey);
      applyCorrections(editor, corrections, chineseLines);
    }
  );

  context.subscriptions.push(disposable);

  // Register the custom command here
  registerApplyFixAndClearDiagnosticsCommand(context);

  // Register a code actions provider to handle the diagnostics
  vscode.languages.registerCodeActionsProvider(
    "*",
    {
      provideCodeActions(document, range, context, token) {
        // Filter for diagnostics that we've provided
        const typoDiagnostics = context.diagnostics.filter(
          (diag) => diag.code === "typoCorrection"
        );

        // Create a code action for each diagnostic
        return typoDiagnostics.map((diag) => createCodeAction(document, diag));
      },
    },
    {
      providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
    }
  );
}

// This function creates a code action for the given diagnostic
function createCodeAction(document, diag) {
  const fix = new vscode.CodeAction(
    `Fix typo: ${diag.message}`,
    vscode.CodeActionKind.QuickFix
  );
  fix.edit = new vscode.WorkspaceEdit();
  fix.edit.replace(document.uri, diag.range, diag.correctText);
  fix.isPreferred = true;
  fix.diagnostics = [diag];

  // Register a command to the CodeAction which will clear the diagnostics upon execution
  fix.command = {
    title: "Fix Typo",
    command: "chineseTypoChecker.applyFixAndClearDiagnostics",
    arguments: [document.uri, diag.range, diag],
  };

  return fix;
}

function extractChineseLines(editor) {
  const text = editor.document.getText();
  const chineseLines = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const chineseTextMatch = line.match(/[\u3400-\u9FBF]+/g);
    if (chineseTextMatch) {
      chineseTextMatch.forEach((match) => {
        chineseLines.push({
          content: match,
          lineNumber: i,
          startIndex: line.indexOf(match),
          endIndex: line.indexOf(match) + match.length,
        });
      });
    }
  }

  return chineseLines;
}

async function checkChineseText(chineseLines, baseUrl, apiKey) {
  // Call OpenAI API
  const responses = await axios.post(
    `${baseUrl}/v1/chat/completions`,
    {
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content:
            "修正下列数组中每个元素文字中的错别字，并以json格式返回结果：{'corrections':[{errorText: '错别字', correctText: '正确字', index:0}]}",
        },
        { role: "user", content: JSON.stringify(chineseLines) },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  );

  // Process API responses and extract corrections
  const corrections = JSON.parse(responses.data.choices[0].message.content);
  // ... process responses and fill corrections array

  // orange.appendLine(responses.data.choices[0].message.content);

  return corrections.corrections;
}

function applyCorrections(editor, corrections, chineseLines) {
  const diagnostics = []; // Array to hold diagnostics

  editor
    .edit((editBuilder) => {
      corrections.forEach((correction) => {
        const lineText = chineseLines[correction.index].content;
        const line = chineseLines[correction.index];

        // Find the start index of the errorText in the line
        const startIndex =
          line.startIndex + lineText.indexOf(correction.errorText);
        if (startIndex === -1) {
          console.error(
            `Error text "${correction.errorText}" not found in line ${correction.index}`
          );
          return;
        }
        const endIndex = startIndex + correction.errorText.length;

        // Create a range for the errorText
        const range = new vscode.Range(
          line.lineNumber,
          startIndex,
          line.lineNumber,
          endIndex
        );

        // Add diagnostic for the errorText
        const diagnostic = new vscode.Diagnostic(
          range,
          `Typo: ${correction.errorText}`,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.code = "typoCorrection";
        diagnostic.correctText = correction.correctText; // 将正确的文本存储在诊断中
        diagnostics.push(diagnostic);
      });
    })
    .then(() => {
      // Apply the diagnostics to the diagnostic collection
      diagnosticCollection.set(editor.document.uri, diagnostics);
    });
}

// 注册自定义命令来应用修复并清除诊断
function registerApplyFixAndClearDiagnosticsCommand(context) {
  const applyFixAndClearDiagnostics = vscode.commands.registerCommand(
    "chineseTypoChecker.applyFixAndClearDiagnostics",
    async (uri, range, diagnostic) => {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(uri, range, diagnostic.correctText);

      // Apply the edit
      await vscode.workspace.applyEdit(edit);

      // Clear related diagnostics
      const remainingDiagnostics = diagnosticCollection
        .get(uri)
        .filter((d) => d !== diagnostic);
      diagnosticCollection.set(uri, remainingDiagnostics);
    }
  );

  context.subscriptions.push(applyFixAndClearDiagnostics);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
