# PhotoFlow（画像編集アプリ）

ブラウザだけで動作する、PWA対応の画像編集アプリです。

## 主な機能

- 画像アップロード（ファイル選択 / ドラッグ&ドロップ）
- 基本調整: 明るさ / コントラスト / ぼかし / グレースケール
- 色調整: 彩度 / 色相回転 / セピア / 反転
- プリセット: Vivid / Mono / Warm / Cool / Cinematic
- 回転・反転
- Undo / Redo
- 比較表示（押している間だけ元画像）
- PNG / JPEG 保存
- キーボードショートカット
- PWA対応（`manifest.json` + `sw.js`）

## 使い方

1. `index.html` をブラウザで開く
2. 画像をアップロード
3. スライダーやボタンで編集
4. PNGまたはJPEGで保存

## ローカルサーバーで確認

```bash
python3 -m http.server 8000
```

`http://localhost:8000/index.html` にアクセスしてください。

## PWAファイル

- `manifest.json`: アプリメタ情報
- `sw.js`: オフラインキャッシュ用 Service Worker
- `icon.svg`: アプリアイコン

## ショートカット

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Shift + Z`: Redo
- `R`: 右回転
- `F`: 横反転
