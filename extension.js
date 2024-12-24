const vscode = require('vscode');
const path = require('path');

let imageSettings = {
    noMatches: 'https://via.placeholder.com/150/FF0000/FFFFFF?text=No+Matches',
    lessThanFive: 'https://via.placeholder.com/150/00FF00/000000?text=Keep+Improving',
    fiveOrMore: 'https://via.placeholder.com/150/0000FF/FFFFFF?text=Great+Style',
};

function activate(context) {
    console.log('Style Check extension is now active!');

    // Команда для настройки картинок
    const setImagesCommand = vscode.commands.registerCommand('styleCheck.setImages', async () => {
        const noMatchesPath = await selectImage('Select an image for "No Matches" case');
        const lessThanFivePath = await selectImage('Select an image for "Less than Five Matches" case');
        const fiveOrMorePath = await selectImage('Select an image for "Five or More Matches" case');

        if (noMatchesPath) imageSettings.noMatches = noMatchesPath;
        if (lessThanFivePath) imageSettings.lessThanFive = lessThanFivePath;
        if (fiveOrMorePath) imageSettings.fiveOrMore = fiveOrMorePath;

        vscode.window.showInformationMessage('Images updated successfully!');
    });

    // Команда для проверки стиля
    const runCheckCommand = vscode.commands.registerCommand('styleCheck.runCheck', () => {
        const editor = vscode.window.activeTextEditor;

        if (!editor) {
            vscode.window.showErrorMessage('No active editor found!');
            return;
        }

        const document = editor.document;
        const text = document.getText();

        console.log('Document content:', text);

        // Регулярные выражения для поиска
        const variablePattern = /\b[a-z][a-zA-Z0-9]*\s*=\s*[^;]+;/gm;
        const constPattern = /\bconst\s+[A-Z_]+\s*=\s*[^;]+;/gm;
        const functionPattern = /\b[a-z][a-zA-Z0-9]*\s*\(.*\)\s*\{/gm;

        // Подсчёт совпадений
        const variableMatches = (text.match(variablePattern) || []).length;
        const constMatches = (text.match(constPattern) || []).length;
        const functionMatches = (text.match(functionPattern) || []).length;

        const totalMatches = variableMatches + constMatches + functionMatches;

        console.log('Matches found:', {
            variableMatches,
            constMatches,
            functionMatches,
            totalMatches
        });

        // Создание Webview
        const panel = vscode.window.createWebviewPanel(
            'styleCheck',
            'Code Style Check',
            vscode.ViewColumn.One,
            {
                enableScripts: true, // Разрешение скриптов в Webview
                localResourceRoots: [vscode.Uri.file(context.extensionPath)],
                 // Разрешение доступа к локальным ресурсам
                
            }
        );

        let imgSrc;
        if (totalMatches === 0) {
            imgSrc = resolveImagePath(context, imageSettings.noMatches, panel);
        } else if (totalMatches < 5) {
            imgSrc = resolveImagePath(context, imageSettings.lessThanFive, panel);
        } else {
            imgSrc = resolveImagePath(context, imageSettings.fiveOrMore, panel);
        }
        
        console.log('Resolved image source:', imgSrc);

        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <body>
                <h1>Code Style Results</h1>
                <p>Total Matches: ${totalMatches}</p>
                <img src="${imgSrc}" alt="Result Image" style="max-width: 100%; height: auto;" />
            </body>
            </html>
        `;
    });

    context.subscriptions.push(setImagesCommand, runCheckCommand);
}

async function selectImage(prompt) {
    const uri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: prompt,
        filters: {
            Images: ['png', 'jpg', 'jpeg', 'gif']
        }
    });

    return uri && uri[0] ? uri[0].fsPath : null;
}

function resolveImagePath(context, filePath, panel) {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath; // Если это URL, возвращаем его как есть
    }

    // Для локальных файлов
    const localFileUri = vscode.Uri.file(filePath); // Получаем URI локального файла
    const webviewUri = panel.webview.asWebviewUri(localFileUri); // Преобразуем в URI для WebView

    return webviewUri.toString(); // Возвращаем строку URI для использования в HTML
}


function deactivate() {}

module.exports = {
    activate,
    deactivate
};
